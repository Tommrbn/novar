const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = path.join(__dirname, '../../src/Novar.Web/wwwroot/js/home-treatment-collage.js');
const { REST, DURATION, SLOTS, slotFor, createCycle, init } = require(source);
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function events(properties = {}) {
    const listeners = new Map();
    return Object.assign({
        addEventListener(type, fn) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(fn);
        },
        removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
        emit(type, event = {}) { for (const fn of [...(listeners.get(type) || [])]) fn(event); },
        get listenerCount() { return [...listeners.values()].reduce((n, set) => n + set.size, 0); }
    }, properties);
}

function fixture({ ready = true, reducedMotion = false, hidden = false } = {}) {
    let timer = null;
    let observer;
    const animations = [];
    const reduced = events({ matches: reducedMotion });
    const win = events({
        matchMedia: () => reduced,
        setTimeout(callback, delay) {
            assert.equal(delay, 2000);
            assert.equal(timer, null, 'At most one dwell timer');
            timer = callback;
            return 1;
        },
        clearTimeout() { timer = null; },
        IntersectionObserver: class {
            constructor(callback) { this.callback = callback; observer = this; }
            observe(root) { this.root = root; }
            disconnect() { this.disconnected = true; }
        }
    });
    const photos = Array.from({ length: 3 }, (_, i) => events({
        complete: ready, naturalWidth: ready ? 500 : 0, style: {}, src: ['woman', 'girl', 'man'][i],
        animate(keyframes, options) {
            let resolve, reject;
            const animation = {
                keyframes, options, canceled: false,
                finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
                finish() { resolve(); },
                reject() { reject(new Error('Playback failure')); },
                cancel() { this.canceled = true; reject(new Error('Canceled')); }
            };
            animations.push(animation);
            return animation;
        }
    }));
    const toggle = events({ hidden: true, textContent: '' });
    const root = events({
        dataset: { pauseLabel: 'Pausar imágenes', resumeLabel: 'Reanudar imágenes' },
        querySelectorAll: () => photos,
        querySelector: () => toggle,
        contains: element => element === toggle || photos.includes(element)
    });
    const doc = events({ hidden, querySelectorAll: () => [root] });
    return {
        root, win, doc, photos, toggle, animations, reduced,
        start: () => init(root, win, doc),
        enter(value = true) { observer.callback([{ target: root, isIntersecting: value }]); },
        get waiting() { return timer !== null; },
        get observer() { return observer; },
        tick() { assert.ok(timer); const callback = timer; timer = null; callback(); },
        async finish() { animations.slice(-3).forEach(animation => animation.finish()); await flush(); }
    };
}

test('exact original proportional slots and woman/girl/man cycle', () => {
    assert.equal(REST, 2000);
    assert.equal(DURATION, 500);
    assert.deepEqual(SLOTS, [
        { left: '12.832%', top: '0%', width: '54.13%', height: '100%' },
        { left: '54.572%', top: '7.679%', width: '36.726%', height: '35.495%' },
        { left: '54.572%', top: '46.758%', width: '36.726%', height: '44.369%' }
    ]);
    assert.deepEqual([0, 1, 2].map(state => [0, 1, 2].map(photo => slotFor(photo, state))),
        [[0, 1, 2], [2, 0, 1], [1, 2, 0]]);
});

test('production DOM entry independently initializes without Sophia', () => {
    const f = fixture();
    vm.runInNewContext(fs.readFileSync(source, 'utf8'), { window: f.win, document: f.doc });
    assert.equal(f.toggle.hidden, false);
    assert.equal(f.waiting, false);
    f.enter();
    assert.equal(f.waiting, true);
    f.win.emit('pagehide', { persisted: false });
    assert.equal(f.waiting, false);
});

test('same photo nodes morph their frames for 500ms then rest 2000ms after completion', async () => {
    const f = fixture();
    const handle = f.start();
    f.enter();
    for (const featured of [1, 2, 0]) {
        f.tick();
        assert.equal(handle.cycle.index, featured);
        assert.equal(f.waiting, false, 'No timer overlaps the transition');
        f.photos.forEach((photo, i) => {
            const destination = slotFor(i, featured);
            assert.equal(photo.style.width, SLOTS[destination].width);
            assert.equal(photo.style.zIndex, destination === 0 ? '2' : '1');
            const animation = f.animations.slice(-3)[i];
            assert.deepEqual(animation.keyframes[1], SLOTS[destination]);
            assert.equal(animation.options.duration, 500);
            assert.equal(animation.keyframes[0].transform, undefined, 'No non-uniform face scaling');
        });
        await f.finish();
        assert.equal(f.waiting, true);
    }
    assert.deepEqual(f.photos.map(photo => photo.src), ['woman', 'girl', 'man']);
    handle.destroy();
});

test('not ready, hidden, or offscreen never starts; ready load reveals localized control', () => {
    const f = fixture({ ready: false, hidden: true });
    const handle = f.start();
    assert.equal(f.toggle.hidden, true);
    f.enter();
    f.photos.forEach(photo => { photo.complete = true; photo.naturalWidth = 500; photo.emit('load'); });
    assert.equal(f.toggle.hidden, false);
    assert.equal(f.toggle.textContent, 'Pausar imágenes');
    assert.equal(f.waiting, false);
    f.doc.hidden = false;
    f.doc.emit('visibilitychange');
    assert.equal(f.waiting, true);
    f.enter(false);
    assert.equal(f.waiting, false);
    handle.destroy();
});

test('persistent user pause composes focus, hidden, offscreen and reduced motion', () => {
    const f = fixture();
    const handle = f.start();
    f.enter();
    f.root.emit('focusin');
    f.toggle.emit('click');
    assert.equal(f.toggle.textContent, 'Reanudar imágenes');
    f.root.emit('focusout', { relatedTarget: null });
    f.enter(false); f.enter();
    f.doc.hidden = true; f.doc.emit('visibilitychange');
    f.doc.hidden = false; f.doc.emit('visibilitychange');
    f.reduced.matches = true; f.reduced.emit('change');
    assert.equal(f.toggle.hidden, true);
    f.reduced.matches = false; f.reduced.emit('change');
    assert.equal(f.toggle.hidden, false);
    assert.equal(f.waiting, false);
    f.root.emit('focusin');
    f.toggle.emit('click');
    assert.equal(f.toggle.textContent, 'Pausar imágenes');
    assert.equal(f.waiting, false, 'Resume does not override focus');
    f.root.emit('focusout', { relatedTarget: f.toggle });
    assert.equal(f.waiting, false, 'Internal focus stays blocked');
    f.root.emit('focusout', { relatedTarget: null });
    assert.equal(f.waiting, true);
    handle.destroy();
});

for (const blocker of ['user', 'hidden', 'offscreen', 'focus', 'reduced', 'pagehide']) {
    test(`${blocker} cancels in-flight motion, ignores late promises, and resumes with full rest`, async () => {
        const f = fixture();
        const handle = f.start();
        f.enter(); f.tick();
        handle.cycle.setBlocked(blocker, true);
        assert.ok(f.animations.every(animation => animation.canceled));
        assert.equal(f.waiting, false);
        await flush();
        assert.equal(f.waiting, false);
        handle.cycle.setBlocked(blocker, false);
        assert.equal(f.waiting, true);
        f.tick();
        assert.equal(handle.cycle.index, 2, 'No catch-up or duplicate transition');
        handle.destroy(); await flush();
    });
}

test('resize interruption settles target in responsive percentages and restarts dwell', async () => {
    const f = fixture();
    const handle = f.start();
    f.enter(); f.tick();
    f.win.emit('resize');
    await flush();
    assert.equal(handle.cycle.index, 1);
    assert.equal(f.photos[1].style.height, '100%');
    assert.equal(f.waiting, true);
    handle.destroy();
});

test('bfcache retains user pause, regular pagehide cleans listeners and observer', async () => {
    const f = fixture();
    f.start(); f.enter(); f.tick();
    f.win.emit('pagehide', { persisted: true });
    await flush();
    assert.equal(f.waiting, false);
    f.win.emit('pageshow');
    assert.equal(f.waiting, true);
    f.toggle.emit('click');
    f.win.emit('pagehide', { persisted: true }); f.win.emit('pageshow');
    assert.equal(f.waiting, false);
    f.win.emit('pagehide', { persisted: false });
    assert.equal(f.observer.disconnected, true);
    assert.equal(f.win.listenerCount + f.doc.listenerCount + f.root.listenerCount + f.toggle.listenerCount, 0);
    assert.ok(f.photos.every(photo => photo.listenerCount === 0));
    assert.equal(f.reduced.listenerCount, 0);
    f.win.emit('pageshow');
    assert.equal(f.waiting, false);
});

test('reduced-motion default remains original static composition', () => {
    const f = fixture({ reducedMotion: true });
    const handle = f.start(); f.enter();
    assert.equal(f.waiting, false);
    assert.equal(f.toggle.hidden, true);
    assert.ok(f.photos.every(photo => Object.keys(photo.style).length === 0));
    handle.destroy();
});

test('missing image, load error, missing APIs or WAAPI failure remain static', async () => {
    for (const fault of ['missing', 'error', 'observer', 'animation', 'matchMedia', 'throws']) {
        const f = fixture();
        if (fault === 'missing') f.photos[1].naturalWidth = 0;
        if (fault === 'observer') delete f.win.IntersectionObserver;
        if (fault === 'animation') delete f.photos[1].animate;
        if (fault === 'matchMedia') delete f.win.matchMedia;
        if (fault === 'throws') f.photos[1].animate = () => { throw new Error('WAAPI unavailable'); };
        const handle = f.start();
        if (fault === 'error') f.photos[0].emit('error');
        if (fault === 'throws') { f.enter(); f.tick(); await flush(); }
        else if (handle) f.enter();
        assert.equal(f.waiting, false, fault);
        assert.equal(f.toggle.hidden, true, fault);
        handle?.destroy();
    }
});

test('controller initializes gated and ignores events after disposal', () => {
    let count = 0;
    const cycle = createCycle(() => { count++; }, () => { throw new Error('Unexpected timer'); });
    cycle.setBlocked('loading', false);
    cycle.destroy();
    cycle.setBlocked('offscreen', false);
    assert.equal(count, 0);
});

test('unexpected finished rejection hides controls and does not retry the failed loop', async () => {
    const f = fixture();
    const handle = f.start();
    f.enter(); f.tick();
    f.animations[0].reject();
    await flush();
    assert.equal(f.toggle.hidden, true);
    assert.equal(f.waiting, false);
    assert.ok(f.animations.every(animation => animation.canceled));
    f.enter(false); f.enter();
    assert.equal(f.waiting, false);
    handle.destroy();
});
