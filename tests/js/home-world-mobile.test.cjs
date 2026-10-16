const test = require('node:test');
const assert = require('node:assert/strict');
const { createMediaController } = require('../../src/Novar.Web/wwwroot/js/home-media.js');
const { initHomeWorldMobile } = require('../../src/Novar.Web/wwwroot/js/home-world-mobile.js');
class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(n, f) { if (!this.listeners.has(n)) this.listeners.set(n, new Set()); this.listeners.get(n).add(f); }
    removeEventListener(n, f) { this.listeners.get(n)?.delete(f); }
    fire(n, data = {}) {
        const event = { detail: 1, pointerType: 'touch', pointerId: 1, clientX: 20, clientY: 20,
            preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...data };
        for (const f of Array.from(this.listeners.get(n) || [])) { f(event); if (event.stopped) break; }
        return event;
    }
}
function fixture({ reduced = false, coarse = true, phone = true, playing = true, broken = false, autoInit = true } = {}) {
    const doc = { activeElement: null };
    const region = new Target(); region.scrollLeft = 0;
    const classes = new Set(); region.classList = { add: n => classes.add(n), remove: n => classes.delete(n) };
    const tiles = Array.from({ length: 3 }, () => {
        const tile = new Target(); const attrs = new Set();
        tile.setAttribute = n => attrs.add(n); tile.removeAttribute = n => attrs.delete(n); tile.hasAttribute = n => attrs.has(n);
        tile.video = Object.assign(new Target(), { paused: !playing, hidden: !playing, muted: true, error: null });
        tile.contains = target => target === tile.button;
        tile.closest = () => tile;
        tile.button = Object.assign(new Target(), { hidden: true, attributes: { 'data-home-media-toggle': '' },
            closest: s => s === 'button' ? tile.button : tile,
            setAttribute(n, v) { this.attributes[n] = v; },
            getAttribute(n) { return this.attributes[n] ?? null; },
            hasAttribute(n) { return Object.hasOwn(this.attributes, n); } });
        tile.surface = { closest: s => s === 'button' ? null : tile };
        tile.querySelector = s => s === 'video' ? (broken ? null : tile.video) : s === '[data-home-media-toggle]' ? tile.button : {};
        return tile;
    });
    region.querySelectorAll = () => tiles; doc.querySelector = () => region;
    const queries = Object.fromEntries([['(max-width: 767px)', phone], ['(pointer: coarse)', coarse],
        ['(prefers-reduced-motion: reduce)', reduced]].map(([key, matches]) => [key, Object.assign(new Target(), { matches })]));
    const win = Object.assign(new Target(), { PointerEvent: function () {}, scrollY: 0, matchMedia: q => queries[q],
        queueMicrotask: f => f() });
    let id = 0; const timers = new Map();
    win.setTimeout = (f, delay) => { assert.equal(delay, 3000); timers.set(++id, f); return id; };
    win.clearTimeout = n => timers.delete(n);
    const api = autoInit ? initHomeWorldMobile(doc, win) : null;
    const revealed = tile => tile.hasAttribute('data-world-controls-revealed');
    const tap = (target = tiles[0].surface, dx = 0, dy = 0, cancel = false) => {
        region.fire('pointerdown', { target });
        region.fire(cancel ? 'pointercancel' : 'pointerup', { target, clientX: 20 + dx, clientY: 20 + dy });
        return region.fire('click', { target });
    };
    return { doc, region, tiles, win, queries, api, revealed, tap, timers, classes,
        tick() { const tasks = Array.from(timers.values()); timers.clear(); for (const f of tasks) f(); } };
}
test('first surface tap only reveals; following explicit button click remains native', () => {
    const f = fixture(); assert.equal(f.revealed(f.tiles[0]), false);
    assert.equal(f.tap().prevented, true); assert.equal(f.revealed(f.tiles[0]), true);
    assert.equal(f.tap(f.tiles[0].button).prevented, undefined);
});
test('a first tap landing on a hidden button never activates playback or audio', () => {
    const f = fixture(); assert.equal(f.tap(f.tiles[0].button).prevented, true);
});
for (const [name, x, y, cancel] of [['horizontal', 30, 0, false], ['vertical', 0, 30, false], ['cancelled', 0, 0, true]])
    test(`${name} gesture cannot reveal or activate controls`, () => {
        const f = fixture(); assert.equal(f.tap(f.tiles[0].button, x, y, cancel).prevented, true);
        assert.equal(f.revealed(f.tiles[0]), false);
    });
test('scroll movement without pointer coordinates blocks synthetic click', () => {
    const f = fixture(); const target = f.tiles[0].surface;
    f.region.fire('pointerdown', { target }); f.region.scrollLeft = 20;
    assert.equal(f.region.fire('click', { target }).prevented, true);
});
test('native pointer scrolling is neither prevented nor captured', () => {
    const f = fixture(); const e = f.region.fire('pointerdown', { target: f.tiles[0].surface });
    assert.equal(e.prevented, undefined); assert.equal(e.stopped, undefined);
});
test('keyboard focus reveals and detail-zero button activation bypasses tap guard', () => {
    const f = fixture(); f.doc.activeElement = f.tiles[0].button; f.tiles[0].fire('focusin');
    assert.equal(f.revealed(f.tiles[0]), true); f.tick(); assert.equal(f.revealed(f.tiles[0]), true);
    assert.equal(f.region.fire('click', { target: f.tiles[0].button, detail: 0 }).prevented, undefined);
});
test('three-second idle hide applies only to actually visible muted playback', () => {
    const f = fixture(); f.tap(); assert.equal(f.timers.size, 1); f.tick(); assert.equal(f.revealed(f.tiles[0]), false);
});
test('initial pending autoplay remains hidden while an explicitly revealed pending tile stays visible', () => {
    const f = fixture({ playing: false }); f.tiles[0].video.paused = false; f.tiles[0].video.fire('waiting'); f.tick();
    assert.equal(f.revealed(f.tiles[0]), false);
    f.tap(); f.tiles[0].video.fire('waiting'); f.tick();
    assert.equal(f.revealed(f.tiles[0]), true); assert.equal(f.timers.size, 0);
});
for (const state of ['paused', 'audible', 'error', 'poster'])
    test(`${state} controls persist and cannot be hidden by another tile`, () => {
        const f = fixture(); f.tap(); const video = f.tiles[0].video;
        if (state === 'paused') video.paused = true;
        if (state === 'audible') video.muted = false;
        if (state === 'error') video.error = {};
        if (state === 'poster') video.hidden = true;
        video.fire('volumechange'); f.tap(f.tiles[1].surface); f.tick();
        assert.equal(f.revealed(f.tiles[0]), true);
    });
test('reduced motion initializes discoverable controls and never auto-hides', () => {
    const f = fixture({ reduced: true }); f.tick(); assert.ok(f.tiles.every(f.revealed)); assert.equal(f.timers.size, 0);
});
test('only one nonpersistent user-engaged tile remains revealed', () => {
    const f = fixture(); f.tap(); f.tap(f.tiles[1].surface);
    assert.equal(f.revealed(f.tiles[0]), false); assert.equal(f.revealed(f.tiles[1]), true);
});
test('input and phone-query changes restore ordinary fallback and clear timers', () => {
    const f = fixture(); f.tap(); f.queries['(pointer: coarse)'].matches = false; f.queries['(pointer: coarse)'].fire('change');
    assert.equal(f.classes.size, 0); assert.equal(f.timers.size, 0);
    f.queries['(pointer: coarse)'].matches = true; f.queries['(max-width: 767px)'].matches = false;
    f.queries['(max-width: 767px)'].fire('change'); assert.equal(f.classes.size, 0);
});
test('pagehide cleans interaction listeners and bfcache pageshow reinitializes once', () => {
    const f = fixture(); f.tap(); f.win.fire('pagehide'); assert.equal(f.timers.size, 0); assert.equal(f.classes.size, 0);
    assert.equal(f.region.listeners.get('click').size, 0);
    f.win.fire('pageshow'); assert.equal(f.region.listeners.get('click').size, 1); assert.equal(f.classes.size, 1);
    f.api.destroy(); assert.equal(f.region.listeners.get('pointerdown').size, 0); assert.equal(f.win.listeners.get('pageshow').size, 0);
});
test('missing DOM or PointerEvent leaves usable unenhanced fallback', () => {
    const f = fixture({ broken: true }); assert.equal(f.api, null); assert.equal(f.classes.size, 0);
    assert.equal(initHomeWorldMobile({ querySelector: () => null }, {}), null);
    assert.equal(initHomeWorldMobile({ querySelector: () => ({}) }, { matchMedia() {}, PointerEvent: undefined }), null);
});
test('hybrid first touch gesture is tracked even while enabling enhancement', () => {
    const f = fixture({ coarse: false }); assert.equal(f.classes.size, 0);
    const target = f.tiles[0].surface;
    f.region.fire('pointerdown', { target });
    f.region.fire('pointerup', { target, clientY: 60 });
    assert.equal(f.region.fire('click', { target }).prevented, true);
    assert.equal(f.revealed(f.tiles[0]), false);
});
test('primary mouse input exits touch mode without intercepting ordinary buttons', () => {
    const f = fixture(); f.tap(); f.region.fire('pointerdown', { target: f.tiles[0].button, pointerType: 'mouse' });
    assert.equal(f.classes.size, 0); assert.equal(f.timers.size, 0);
    assert.equal(f.region.fire('click', { target: f.tiles[0].button }).prevented, undefined);
});
test('motion preference changes keep visible controls and cancel pending hide timers', () => {
    const f = fixture(); f.tap(); f.queries['(prefers-reduced-motion: reduce)'].matches = true;
    f.queries['(prefers-reduced-motion: reduce)'].fire('change'); f.tick();
    assert.ok(f.tiles.every(f.revealed)); assert.equal(f.timers.size, 0);
});
test('listener setup failure removes its enhancement gate and restores fallback', () => {
    const f = fixture({ coarse: false });
    f.tiles[0].video.addEventListener = () => { throw new Error('Unavailable event surface'); };
    f.queries['(pointer: coarse)'].matches = true;
    f.queries['(pointer: coarse)'].fire('change');
    assert.equal(f.classes.size, 0); assert.equal(f.timers.size, 0);
    assert.equal(f.region.fire('click', { target: f.tiles[0].button }).prevented, undefined);
    f.api.destroy();
});
for (const [axis, dx, dy] of [['horizontal', 10, 0], ['vertical', 0, 10]])
    test(`exact ten-pixel ${axis} drag on revealed buttons is not activation; next tap resets`, () => {
        const f = fixture(); f.tap();
        assert.equal(f.tap(f.tiles[0].button, dx, dy).prevented, true);
        assert.equal(f.tap(f.tiles[0].button).prevented, undefined);
        assert.equal(f.region.fire('click', { target: f.tiles[0].button, detail: 0 }).prevented, undefined);
    });
function integratedFixture() {
    const f = fixture({ playing: false, autoInit: false });
    const controllers = []; const resolve = []; const reject = []; const requests = [];
    for (const tile of f.tiles) {
        let ready;
        const promise = new Promise((done, fail) => { ready = done; reject.push(fail); }); resolve.push(ready);
        tile.video.load = () => {};
        tile.video.play = () => { tile.video.paused = false; return promise; };
        tile.video.pause = () => { tile.video.paused = true; tile.video.fire('pause'); };
        const controller = createMediaController({ video: tile.video, poster: { hidden: false }, button: tile.button,
            source: '/media/home/optimized/world-path.mp4', controls: true, visible: false });
        controllers.push(controller); requests.push(controller.setVisible(true));
    }
    f.api = initHomeWorldMobile(f.doc, f.win);
    f.controllers = controllers; f.resolve = resolve; f.reject = reject; f.requests = requests;
    f.activate = (index = 0, detail = 1) => {
        const target = f.tiles[index].button;
        const event = detail === 0 ? f.region.fire('click', { target, detail }) : f.tap(target);
        if (!event.stopped) target.fire('click', { detail });
        return event;
    };
    return f;
}
test('real shared controller delayed autoplay never reveals initial controls before or after playing plus three seconds', async () => {
    const f = integratedFixture();
    assert.ok(f.controllers.every(c => c.getState().pending));
    assert.ok(f.tiles.every(tile => tile.video.hidden && !f.revealed(tile)));
    f.tick(); assert.ok(f.tiles.every(tile => !f.revealed(tile)));
    f.resolve.forEach(done => done()); await Promise.all(f.requests);
    assert.ok(f.tiles.every(tile => tile.video.hidden && !f.revealed(tile)));
    f.tiles.forEach(tile => tile.video.fire('playing')); f.tick();
    assert.ok(f.tiles.every(tile => !tile.video.hidden && !f.revealed(tile)));
    f.api.destroy(); f.controllers.forEach(controller => controller.destroy());
});
test('real shared manual pause remains discoverable through offscreen poster and bfcache reentry', async () => {
    const f = integratedFixture(); f.resolve.forEach(done => done()); await Promise.all(f.requests);
    f.tiles.forEach(tile => tile.video.fire('playing'));
    assert.equal(f.activate().prevented, true); assert.equal(f.controllers[0].getState().manualPaused, false);
    f.activate(); assert.equal(f.controllers[0].getState().manualPaused, true);
    await f.controllers[0].setVisible(false); f.win.fire('pagehide');
    await f.controllers[0].setVisible(true); f.win.fire('pageshow'); f.tick();
    assert.equal(f.revealed(f.tiles[0]), true); assert.equal(f.controllers[0].getState().manualPaused, true);
    f.tap(f.tiles[1].surface); assert.equal(f.revealed(f.tiles[0]), true);
    f.activate(0, 0); await Promise.resolve(); f.tiles[0].video.fire('playing'); f.tick();
    assert.equal(f.controllers[0].getState().manualPaused, false); assert.equal(f.revealed(f.tiles[0]), false);
    f.api.destroy(); f.controllers.forEach(controller => controller.destroy());
});
test('real shared offscreen pause of an unengaged autoplay tile does not reveal it', async () => {
    const f = integratedFixture(); f.resolve.forEach(done => done()); await Promise.all(f.requests);
    f.tiles.forEach(tile => tile.video.fire('playing'));
    await f.controllers[0].setVisible(false); await f.controllers[0].setVisible(true); f.tick();
    assert.equal(f.revealed(f.tiles[0]), false); assert.equal(f.controllers[0].getState().manualPaused, false);
    f.api.destroy(); f.controllers.forEach(controller => controller.destroy());
});
test('real shared rejected autoplay reveals genuine failure fallback without revealing other pending tiles', async () => {
    const f = integratedFixture(); f.reject[0](new Error('Playback unavailable')); await f.requests[0];
    assert.equal(f.controllers[0].getState().failed, true); assert.equal(f.revealed(f.tiles[0]), true);
    assert.equal(f.revealed(f.tiles[1]), false); f.tick(); assert.equal(f.revealed(f.tiles[0]), true);
    f.api.destroy(); f.controllers.forEach(controller => controller.destroy());
});