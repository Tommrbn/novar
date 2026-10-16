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
    const controller = createMediaController({ video, poster, button, source, reducedMotion, visible, playLabel: 'Reproducir' });
    return { video, poster, button, controller };
}

test('static fallback stays visible until eligible playback actually emits playing', async () => {
    const f = fixture();
    assert.equal(f.video.src, '');
    assert.equal(f.video.playCalls, 0);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
    assert.equal(f.button.hidden, true);
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
    assert.equal(f.button.hidden, true);
    f.video.startRendering();
    assert.equal(f.video.hidden, false);
    assert.equal(f.poster.hidden, true);
    assert.equal(f.button.hidden, true);
    assert.equal(f.button.attributes['aria-label'], 'Reproducir');
    assert.equal(f.button.attributes['aria-pressed'], undefined);
});

test('autoplay has no pause action and restores the poster when offscreen', async () => {
    const f = fixture({ visible: true });
    await f.controller.refresh();
    f.video.startRendering();
    f.button.dispatch('click');
    assert.equal(f.video.paused, false);
    assert.equal(f.video.hidden, false);
    assert.equal(f.button.hidden, true);
    await f.controller.setVisible(false);
    assert.equal(f.video.paused, true);
    assert.equal(f.video.hidden, true);
    assert.equal(f.poster.hidden, false);
    await f.controller.setVisible(true);
    assert.equal(f.video.playCalls, 2);
    f.video.startRendering();
    assert.equal(f.video.hidden, false);
});

test('reduced motion stays static until explicit manual play', async () => {
    const f = fixture({ reducedMotion: true });
    await f.controller.setVisible(true);
    assert.equal(f.video.src, '');
    assert.equal(f.video.playCalls, 0);
    assert.equal(f.button.hidden, false);
    f.button.dispatch('click');
    await Promise.resolve();
    assert.equal(f.video.src, '/media/home/test.mp4');
    assert.equal(f.video.playCalls, 1);
    assert.equal(f.button.hidden, true);
    f.video.startRendering();
    assert.equal(f.video.hidden, false);
    assert.equal(f.button.hidden, true);
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
    assert.equal(f.button.hidden, false, 'A failed autoplay leaves a play-only fallback.');
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
    assert.equal(f.button.hidden, false);
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
    assert.equal(hero.video.paused, false);
    assert.equal(finder.video.paused, false);
    assert.equal(hero.button.hidden, true);
    assert.equal(finder.button.hidden, true);
});

function worldFixture(options = {}) {
    const f = fixture(options);
    f.controller.destroy();
    const soundButton = Object.assign(new EventTarget(), { hidden: true, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } });
    f.controller = createMediaController({ ...options, ...f, source: '/media/home/world.mp4', controls: true,
        soundButton: options.audio === false ? null : soundButton, playLabel: 'Play', pauseLabel: 'Pause', soundLabel: 'Sound', muteLabel: 'Mute' });
    f.soundButton = soundButton;
    return f;
}

test('World controls remain available during playback and manual pause survives reentry', async () => {
    const f = worldFixture({ visible: true });
    await f.controller.refresh();
    assert.equal(f.video.muted, true);
    assert.equal(f.poster.hidden, false);
    f.video.startRendering();
    assert.equal(f.button.hidden, false);
    assert.equal(f.button.attributes['aria-label'], 'Pause');
    f.button.dispatch('click');
    assert.equal(f.video.paused, true);
    assert.equal(f.button.attributes['aria-label'], 'Play');
    await f.controller.setVisible(false);
    assert.equal(f.button.hidden, true);
    await f.controller.setVisible(true);
    await f.controller.setPageHidden(true);
    await f.controller.setPageHidden(false);
    assert.equal(f.video.playCalls, 1);
    f.button.dispatch('click');
    await Promise.resolve();
    f.video.startRendering();
    assert.equal(f.video.playCalls, 2);
});

test('World sound requires a click and persists independently through pause and visibility', async () => {
    const f = worldFixture({ visible: true });
    const other = worldFixture({ visible: true });
    await f.controller.refresh();
    await other.controller.refresh();
    f.video.startRendering();
    f.soundButton.dispatch('click');
    assert.equal(f.video.muted, false);
    assert.equal(f.soundButton.attributes['aria-label'], 'Mute');
    assert.equal(other.video.muted, true);
    f.button.dispatch('click');
    f.button.dispatch('click');
    await Promise.resolve();
    assert.equal(f.video.muted, false);
    f.video.startRendering();
    await f.controller.setVisible(false);
    f.soundButton.dispatch('click');
    assert.equal(f.video.muted, false, 'An invisible sound control must not change state.');
    await f.controller.setVisible(true);
    assert.equal(f.video.muted, false);
    f.soundButton.dispatch('click');
    assert.equal(f.video.muted, true);
});

test('World reduced motion needs manual opt-in; no-audio player stays muted', async () => {
    const f = worldFixture({ visible: true, reducedMotion: true, audio: false });
    await f.controller.refresh();
    assert.equal(f.video.src, '');
    assert.equal(f.button.hidden, false);
    f.button.dispatch('click');
    await Promise.resolve();
    f.video.startRendering();
    assert.equal(f.video.muted, true);
    assert.equal(f.button.attributes['aria-label'], 'Pause');
    f.button.dispatch('click');
    await f.controller.setReducedMotion(false);
    assert.equal(f.video.playCalls, 1);
});

test('World rejected play and media error restore posters without automatic retries', async () => {
    const f = worldFixture({ visible: true });
    f.video.playImpl = () => Promise.reject(new Error('audio/play denied'));
    await f.controller.refresh();
    assert.equal(f.poster.hidden, false);
    assert.equal(f.button.hidden, false);
    await f.controller.setVisible(true);
    assert.equal(f.video.playCalls, 1);
    f.video.playImpl = () => Promise.resolve();
    f.button.dispatch('click');
    await Promise.resolve();
    f.video.startRendering();
    f.video.dispatch('error');
    assert.equal(f.poster.hidden, false);
    assert.equal(f.video.paused, true);
});

test('World stale requests and invisible clicks cannot restart a manually paused player', async () => {
    const f = worldFixture({ visible: true });
    let resolve;
    f.video.playImpl = () => new Promise(done => { resolve = done; });
    const pending = f.controller.refresh();
    f.button.dispatch('click');
    resolve();
    await pending;
    f.video.startRendering();
    assert.equal(f.video.paused, true);
    assert.equal(f.poster.hidden, false);
    await f.controller.setVisible(false);
    f.button.dispatch('click');
    await f.controller.setVisible(true);
    assert.equal(f.video.playCalls, 1);
});

test('DOM initialization opts only eight World players into translated playback and audio controls', async () => {
    const { initHomeMedia } = require('../../src/Novar.Web/wwwroot/js/home-media.js');
    const fixtures = Array.from({ length: 10 }, () => fixture());
    const roots = fixtures.map((f, index) => {
        f.controller.destroy();
        f.button.getAttribute = () => 'Legacy play';
        const world = index >= 2;
        const attributes = {
            'data-home-media-source': `/video-${index}.mp4`,
            'data-home-media-controls': world ? 'world' : null,
            'data-home-media-play-label': world ? 'Play video' : null,
            'data-home-media-pause-label': 'Pause video',
            'data-home-media-sound-label': 'Enable sound',
            'data-home-media-mute-label': 'Mute video'
        };
        const sound = world && index < 8 ? Object.assign(new EventTarget(), { setAttribute() {} }) : null;
        f.sound = sound;
        return { getAttribute: name => attributes[name] || null,
            querySelector: selector => ({ '[data-home-media-video]': f.video, 'img': f.poster, '[data-home-media-toggle]': f.button, '[data-home-media-sound]': sound })[selector] };
    });
    const observers = [];
    const doc = Object.assign(new EventTarget(), { hidden: false, querySelectorAll: () => roots });
    const win = Object.assign(new EventTarget(), { IntersectionObserver: class {
        constructor(callback) { this.callback = callback; observers.push(this); }
        observe(root) { this.root = root; }
        disconnect() { this.disconnected = true; }
    }});
    const players = initHomeMedia(doc, win);
    assert.equal(players.length, 10);
    assert.equal(fixtures[2].button.hidden, true, 'Offscreen World controls are not focusable.');
    for (const observer of observers) observer.callback([{ target: observer.root, isIntersecting: true, intersectionRatio: 0.1 }]);
    await Promise.resolve();
    for (const f of fixtures) { assert.equal(f.video.muted, true); f.video.startRendering(); }
    assert.equal(fixtures[0].button.hidden, true);
    assert.equal(fixtures[1].button.hidden, true);
    for (const f of fixtures.slice(2)) { assert.equal(f.button.hidden, false); assert.equal(f.button.attributes['aria-label'], 'Pause video'); }
    fixtures[2].sound.dispatch('click');
    assert.equal(fixtures[2].video.muted, false);
    assert.equal(fixtures[3].video.muted, true);
    assert.equal(fixtures[8].sound, null);
    assert.equal(fixtures[9].sound, null);
    for (const f of fixtures.slice(3, 8)) assert.equal(f.video.muted, true);
    fixtures[4].button.dispatch('click');
    assert.equal(fixtures[4].video.paused, true);
    assert.equal(fixtures[5].video.paused, false);
    fixtures[6].sound.dispatch('click');
    assert.equal(fixtures[6].video.muted, false);
    assert.equal(fixtures[2].video.muted, false);
    assert.equal(fixtures[5].video.muted, true);
    doc.hidden = true;
    doc.dispatch('visibilitychange');
    assert.ok(fixtures.every(f => f.poster.hidden === false && f.video.paused));
    assert.ok(fixtures.slice(2).every(f => f.button.hidden));
    for (const player of players) player.destroy();
    assert.ok(observers.every(observer => observer.disconnected));
});

test('queued World pause event cannot clear a newer pending resume', async () => {
    const f = worldFixture({ visible: true });
    await f.controller.refresh();
    f.video.startRendering();
    // Browsers queue media events; dispatch the older pause only after resume.
    f.video.pause = function () { this.pauseCalls++; this.paused = true; };
    f.button.dispatch('click');
    assert.equal(f.controller.getState().manualPaused, true);
    f.button.dispatch('click');
    assert.equal(f.video.paused, false);
    assert.equal(f.controller.getState().pending, true);
    f.video.dispatch('pause');
    assert.equal(f.controller.getState().pending, true, 'A stale pause event must not cancel the pending resume.');
    assert.equal(f.button.attributes['aria-label'], 'Pause');
    f.button.dispatch('click');
    assert.equal(f.video.playCalls, 2, 'The next click must cancel resume, not issue another play request.');
    assert.equal(f.video.paused, true);
    assert.equal(f.controller.getState().manualPaused, true);
    await Promise.resolve();
    f.video.startRendering();
    assert.equal(f.poster.hidden, false);
    assert.equal(f.video.hidden, true);
});
