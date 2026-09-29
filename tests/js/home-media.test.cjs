const test = require('node:test');
const assert = require('node:assert/strict');
const { createMediaController } = require('../../src/Novar.Web/wwwroot/js/home-media.js');

class EventTarget {
    constructor() { this.listeners = new Map(); }
    addEventListener(name, handler) {
        if (!this.listeners.has(name)) this.listeners.set(name, new Set());
        this.listeners.get(name).add(handler);
    }
    removeEventListener(name, handler) { this.listeners.get(name)?.delete(handler); }
    dispatch(name) { for (const handler of this.listeners.get(name) || []) handler({ type: name }); }
}

class FakeVideo extends EventTarget {
    constructor() {
        super();
        this.paused = true;
        this.hidden = true;
        this.src = '';
        this.playCalls = 0;
        this.pauseCalls = 0;
        this.loadCalls = 0;
        this.playImpl = () => Promise.resolve();
    }
    load() { this.loadCalls++; }
    play() { this.playCalls++; this.paused = false; return this.playImpl(); }
    pause() { this.pauseCalls++; this.paused = true; this.dispatch('pause'); }
    startRendering() { this.dispatch('playing'); }
}

function fixture({ reducedMotion = false, visible = false, source = '/media/home/test.mp4' } = {}) {
    const video = new FakeVideo();
    const poster = { hidden: false };
    const button = Object.assign(new EventTarget(), {
        hidden: true,
        textContent: '',
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; }
    });
    const controller = createMediaController({ video, poster, button, source, reducedMotion, visible, playLabel: 'Reproducir', pauseLabel: 'Pausar' });
    return { video, poster, button, controller };
}

test('static fallback stays visible until eligible playback actually emits playing', async () => {
    const f = fixture();
    assert.equal(f.video.src, '');
    assert.equal(f.video.playCalls, 0);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
    assert.equal(f.button.hidden, false);
    await f.controller.setVisible(true);
    assert.equal(f.video.src, '/media/home/test.mp4');
    assert.equal(f.video.muted, true);
    assert.equal(f.video.defaultMuted, true);
    assert.equal(f.video.loop, true);
    assert.equal(f.video.playsInline, true);
    assert.equal(f.video.preload, 'none');
    assert.equal(f.video.hidden, true, 'A resolved play promise alone must not hide the accessible poster.');
    assert.equal(f.poster.hidden, false);
    assert.equal(f.button.textContent, 'Reproducir');
    f.video.startRendering();
    assert.equal(f.video.hidden, false);
    assert.equal(f.poster.hidden, true);
    assert.equal(f.button.textContent, 'Pausar');
    assert.equal(f.button.attributes['aria-pressed'], 'true');
});

test('manual button pauses, restores poster and blocks autoplay until user resumes', async () => {
    const f = fixture({ visible: true });
    await f.controller.refresh();
    f.video.startRendering();
    f.button.dispatch('click');
    assert.equal(f.video.paused, true);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
    assert.equal(f.button.textContent, 'Reproducir');
    assert.equal(f.controller.getState().userPaused, true);
    await f.controller.setVisible(false);
    await f.controller.setVisible(true);
    assert.equal(f.video.playCalls, 1, 'Visibility returning must not override the user pause.');
    f.button.dispatch('click');
    await Promise.resolve();
    assert.equal(f.video.playCalls, 2);
    f.video.startRendering();
    assert.equal(f.video.hidden, false);
});

test('reduced motion stays static until explicit manual play', async () => {
    const f = fixture({ reducedMotion: true });
    await f.controller.setVisible(true);
    assert.equal(f.video.src, '');
    assert.equal(f.video.playCalls, 0);
    f.button.dispatch('click');
    await Promise.resolve();
    assert.equal(f.video.src, '/media/home/test.mp4');
    assert.equal(f.video.playCalls, 1);
    f.video.startRendering();
    assert.equal(f.video.hidden, false);
    await f.controller.setReducedMotion(false);
    assert.equal(f.video.hidden, false);
});

test('hidden page or offscreen state pauses and restores poster', async () => {
    const f = fixture({ visible: true });
    await f.controller.refresh();
    f.video.startRendering();
    await f.controller.setVisible(false);
    assert.equal(f.video.paused, true);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
    await f.controller.setVisible(true);
    f.video.startRendering();
    await f.controller.setPageHidden(true);
    assert.equal(f.video.paused, true);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
});

test('rejected autoplay and later media errors retain the original poster', async () => {
    const f = fixture({ visible: true });
    f.video.playImpl = () => Promise.reject(new Error('autoplay rejected'));
    await f.controller.refresh();
    assert.equal(f.controller.getState().failed, true);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
    assert.equal(f.video.playCalls, 1);
    await f.controller.setVisible(true);
    assert.equal(f.video.playCalls, 1, 'A failed autoplay must not loop retrying.');
    f.video.playImpl = () => Promise.resolve();
    f.button.dispatch('click');
    await Promise.resolve();
    f.video.startRendering();
    f.video.dispatch('error');
    assert.equal(f.video.paused, true);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
});

test('stale play resolution after hide cannot restart playback', async () => {
    const f = fixture({ visible: true });
    let resolvePlay;
    f.video.playImpl = () => new Promise(resolve => { resolvePlay = resolve; });
    const stale = f.controller.refresh();
    await f.controller.setPageHidden(true);
    const pausesBeforeResolve = f.video.pauseCalls;
    resolvePlay();
    await stale;
    assert.ok(f.video.pauseCalls > pausesBeforeResolve);
    assert.equal(f.video.paused, true);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
});

test('stale resolution does not pause a newer eligible request', async () => {
    const f = fixture({ visible: true });
    const resolvers = [];
    f.video.playImpl = () => new Promise(resolve => resolvers.push(resolve));
    const old = f.controller.refresh();
    await f.controller.setPageHidden(true);
    const hiddenPauseCount = f.video.pauseCalls;
    const current = f.controller.setPageHidden(false);
    resolvers[0]();
    await old;
    assert.equal(f.video.pauseCalls, hiddenPauseCount);
    assert.equal(f.video.paused, false, 'The older promise must not cancel the current play request.');
    resolvers[1]();
    await current;
});

test('two players keep playback state independent', async () => {
    const hero = fixture({ visible: true });
    const finder = fixture();
    await hero.controller.refresh();
    hero.video.startRendering();
    assert.equal(finder.video.src, '');
    assert.equal(finder.video.playCalls, 0);
    await finder.controller.setVisible(true);
    finder.video.startRendering();
    hero.button.dispatch('click');
    assert.equal(hero.video.paused, true);
    assert.equal(finder.video.paused, false);
    assert.equal(finder.button.textContent, 'Pausar');
});
