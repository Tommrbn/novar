const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { setMaxListeners } = require('node:events');
const { INTERVAL, DURATION, layout, keyframes, createRotation, initGallery } =
    require('../../src/Novar.Web/wwwroot/js/progressive-gallery.js');

function clock() {
    let now = 0;
    let id = 0;
    const timers = new Map();
    return {
        timers,
        setTimeout(callback, delay) { timers.set(++id, { callback, at: now + delay }); return id; },
        clearTimeout(key) { timers.delete(key); },
        tick(ms) {
            const end = now + ms;
            while (true) {
                const next = [...timers].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
                if (!next) break;
                now = next[1].at;
                timers.delete(next[0]);
                next[1].callback();
            }
            now = end;
        }
    };
}

class Element {
    constructor() {
        this.events = new Map();
        this.style = {};
        this.attributes = new Map();
        this.textContent = '';
        this.children = [];
        this.hidden = true;
        this.classes = new Set();
        this.classList = { add: (x) => this.classes.add(x), remove: (x) => this.classes.delete(x) };
    }
    addEventListener(type, callback, options = {}) {
        if (!this.events.has(type)) this.events.set(type, new Set());
        this.events.get(type).add(callback);
        options.signal?.addEventListener('abort', () => this.events.get(type).delete(callback), { once: true });
    }
    emit(type, detail = {}) { [...(this.events.get(type) || [])].forEach((callback) => callback(detail)); }
    setAttribute(key, value) { this.attributes.set(key, value); }
    removeAttribute(key) { if (key === 'style') this.style = {}; else this.attributes.delete(key); }
    contains(target) { return target === this || this.children.includes(target); }
    matches() { return false; }
    focus() { throw new Error('Gallery must never steal focus'); }
    get listenerCount() { return [...this.events.values()].reduce((sum, values) => sum + values.size, 0); }
}

function fixture({ reduced = false, observers = true, animation = false, count = 4, pauseControl = true, autoInterval = null, productTrack = false, navigation = true, initiallyVisible = false, hovered = false } = {}) {
    const timer = clock();
    const win = Object.assign(new Element(), timer);
    win.innerWidth = 1920;
    win.innerHeight = 1000;
    win.AbortController = class extends AbortController {
        constructor() { super(); setMaxListeners(0, this.signal); }
    };
    const preference = Object.assign(new Element(), { matches: reduced });
    win.matchMedia = () => preference;
    const doc = Object.assign(new Element(), { hidden: false, activeElement: null });
    const root = new Element();
    root.top = initiallyVisible ? 100 : 1400;
    root.getBoundingClientRect = () => ({ top: root.top, bottom: root.top + 718, left: 0, right: 1905, width: 1905, height: 718 });
    root.matches = (selector) => selector === ':hover' && hovered;
    root.attributes.set('data-gallery-pause-control', String(pauseControl));
    if (autoInterval !== null) root.attributes.set('data-gallery-autoplay-interval', String(autoInterval));
    root.getAttribute = (key) => root.attributes.get(key) ?? null;
    const track = new Element();
    track.width = 1490;
    track.getBoundingClientRect = () => ({ width: track.width });
    const animationCalls = [];
    track.children = Array.from({ length: count }, (_, index) => {
        const card = new Element();
        card.identity = `source-${index}.png`;
        if (animation) card.animate = (frames, options) => {
            let resolve;
            let reject;
            const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
            const value = { frames, options, finished, finish: resolve, cancel: () => reject(new Error('cancelled')) };
            animationCalls.push(value);
            return value;
        };
        return card;
    });
    const controls = new Element();
    const previous = new Element();
    const next = new Element();
    const pause = new Element();
    const status = new Element();
    root.children = pauseControl ? [track, controls, previous, next, pause] : [track, controls, previous, next];
    root.querySelector = (selector) => ({
        '.prg-gallery-images': productTrack ? null : track, '[data-gallery-track]': productTrack ? track : null, '[data-gallery-controls]': navigation ? controls : null,
        '[data-gallery-previous]': navigation ? previous : null, '[data-gallery-next]': navigation ? next : null,
        '[data-gallery-pause]': pauseControl ? pause : null, '[data-gallery-status]': navigation ? status : null
    })[selector];
    const intersections = [];
    const resizes = [];
    function observer(list) {
        return class {
            constructor(callback) { this.callback = callback; this.connected = false; list.push(this); }
            observe() { this.connected = true; }
            disconnect() { this.connected = false; }
        };
    }
    if (observers) {
        win.IntersectionObserver = observer(intersections);
        win.ResizeObserver = observer(resizes);
    }
    const controller = initGallery(root, { window: win, document: doc });
    const visible = (value = true) => {
        root.top = value ? 100 : 1400;
        if (observers) intersections.at(-1)?.callback([{ isIntersecting: value, intersectionRatio: value ? 1 : 0 }]);
        else win.emit('scroll');
    };
    return { timer, win, doc, root, track, controls, previous, next, pause, status, preference,
        controller, visible, intersections, resizes, animationCalls };
}

test('four stable identities cycle through two outer and two inner source slots', () => {
    for (const width of [1490, 780]) {
        for (let index = 0; index < 4; index++) {
            const positions = layout(width, index);
            assert.equal(positions.filter((x) => x.opacity === .5).length, 2);
            assert.equal(positions.filter((x) => x.opacity === 1).length, 2);
            assert.deepEqual(positions.map((x) => x.slot), Array.from({ length: 4 }, (_, image) => (image - index + 4) % 4));
            const ordered = [...positions].sort((a, b) => a.slot - b.slot);
            assert.ok(Math.abs((ordered[0].x + ordered[3].x + ordered[3].width) / 2 - width / 2) < .00001);
            assert.equal(ordered[0].y, 0);
            assert.equal(ordered[1].y, width === 1490 ? 71.46 : 30);
            assert.equal(ordered[2].height, width === 1490 ? 388.952 : 235);
        }
        assert.deepEqual(layout(width, 4), layout(width, 0));
    }
});

test('Geo opts into the same carousel with a neutral track marker and preserves pause and navigation', () => {
    const f = fixture({ productTrack: true });
    assert.ok(f.controller);
    f.visible();
    f.timer.tick(2000);
    assert.equal(f.controller.rotation.index, 1);
    f.pause.emit('click');
    f.timer.tick(10000);
    assert.equal(f.controller.rotation.index, 1);
    f.next.emit('click');
    assert.equal(f.controller.rotation.index, 2);
    f.previous.emit('click');
    assert.equal(f.controller.rotation.index, 1);
    assert.equal(f.pause.attributes.get('aria-pressed'), 'true');
    f.controller.destroy();
    assert.equal(f.timer.timers.size, 0);
});

test('stationary track has a single centering rule at true desktop and small widths', () => {
    const css = fs.readFileSync(path.join(__dirname, '../../src/Novar.Web/wwwroot/css/progressive-products.css'), 'utf8');
    const rule = css.match(/\.prg-gallery-images \{[^}]+\}/)[0];
    assert.match(rule, /margin: 0;/);
    assert.doesNotMatch(rule, /auto/);
    assert.match(rule, /left: 50%; transform: translateX\(-50%\)/);
    for (const pageWidth of [1920, 1905, 1440, 1425, 1088, 768, 390, 320]) {
        const trackWidth = pageWidth < 768 ? 780 : 1490;
        const left = pageWidth * .5 - trackWidth * .5;
        assert.equal(left + trackWidth / 2, pageWidth / 2);
    }
});

test('650ms wrapping transition leaves through edges, never sweeps across portraits', () => {
    assert.equal(INTERVAL, 2000);
    assert.equal(DURATION, 650);
    const before = layout(1490, 0);
    const after = layout(1490, 1);
    const frames = keyframes(before[0], after[0], 1490);
    assert.equal(frames.length, 4);
    assert.equal(frames[1].opacity, 0);
    assert.equal(frames[2].opacity, 0);
    assert.match(frames[1].transform, /translate\(-305/);
    assert.match(frames[2].transform, /translate\(1490/);
    assert.equal(keyframes(before[1], after[1], 1490).length, 2);
});

test('First cadence can be shortened independently and manual navigation persistently stops autoplay without a pause control', () => {
    const time = clock();
    const changes = [];
    const rotation = createRotation(time, (index, manual) => changes.push([index, manual]), 3200);
    rotation.block('offscreen', false);
    time.tick(3199);
    assert.equal(changes.length, 0);
    time.tick(1);
    assert.deepEqual(changes, [[1, false]]);
    rotation.destroy();

    const f = fixture({ pauseControl: false, autoInterval: 3200 });
    f.visible();
    assert.equal(f.timer.timers.size, 1);
    f.timer.tick(3199);
    assert.equal(f.controller.rotation.index, 0);
    f.timer.tick(1);
    assert.equal(f.controller.rotation.index, 1);
    f.timer.tick(3200);
    assert.equal(f.controller.rotation.index, 2);
    f.next.emit('click');
    assert.equal(f.controller.rotation.index, 3);
    assert.equal(f.controller.rotation.isBlocked('user'), true);
    assert.equal(f.timer.timers.size, 0);
    f.timer.tick(12000);
    assert.equal(f.controller.rotation.index, 3);
    f.controller.destroy();
});

test('sharp outer portraits are an explicit route option while default galleries retain blur', () => {
    assert.deepEqual(layout(1490, 0).map((x) => x.filter), ['blur(1.5px)', 'blur(0px)', 'blur(0px)', 'blur(1.5px)']);
    assert.deepEqual(layout(1490, 0, true).map((x) => x.filter), ['blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)']);
});

test('cadence is exactly two seconds, never duplicates timers, wraps and cancels on destroy', () => {
    const time = clock();
    const changes = [];
    const rotation = createRotation(time, (index, manual) => changes.push([index, manual]));
    assert.equal(time.timers.size, 0);
    rotation.block('offscreen', false);
    rotation.block('offscreen', false);
    assert.equal(time.timers.size, 1);
    time.tick(1999);
    assert.equal(changes.length, 0);
    time.tick(1);
    assert.deepEqual(changes, [[1, false]]);
    time.tick(6000);
    assert.deepEqual(changes.map((x) => x[0]), [1, 2, 3, 0]);
    rotation.advance(-1);
    assert.deepEqual(changes.at(-1), [3, true]);
    assert.equal(time.timers.size, 1);
    rotation.destroy();
    rotation.advance(1);
    rotation.block('user', false);
    time.tick(20000);
    assert.equal(changes.length, 5);
    assert.equal(time.timers.size, 0);
});

test('all blocker pairs are independent, particularly persistent user pause', () => {
    const reasons = ['user', 'focus', 'hidden', 'offscreen', 'reduced', 'lifecycle'];
    for (const first of reasons) for (const second of reasons.filter((x) => x !== first)) {
        const time = clock();
        const rotation = createRotation(time, () => assert.fail('blocked carousel advanced'));
        rotation.block('offscreen', false);
        rotation.block(first, true);
        rotation.block(second, true);
        rotation.block(first, false);
        time.tick(20000);
        assert.equal(rotation.index, 0);
        assert.equal(time.timers.size, 0);
        rotation.block(second, false);
        assert.equal(time.timers.size, 1);
        rotation.destroy();
    }
});

test('mount is idempotent, auto changes are silent, originals and crops stay in place', () => {
    const f = fixture();
    const originals = [...f.track.children];
    assert.equal(initGallery(f.root, { window: f.win, document: f.doc }), f.controller);
    assert.equal(f.next.listenerCount, 1);
    assert.equal(f.controls.hidden, false);
    assert.equal(f.timer.timers.size, 0);
    f.visible();
    f.timer.tick(8000);
    assert.equal(f.controller.rotation.index, 0);
    assert.equal(f.status.textContent, '');
    f.next.emit('click');
    assert.equal(f.status.textContent, 'Composición 2 de 4');
    assert.deepEqual(f.track.children, originals);
    assert.deepEqual(f.track.children.map((x) => x.identity), ['source-0.png', 'source-1.png', 'source-2.png', 'source-3.png']);
    f.controller.destroy();
});

test('hover/focus/hidden/offscreen changes cannot erase explicit pause', () => {
    const f = fixture();
    f.visible();
    f.pause.emit('click');
    f.root.emit('pointerenter');
    f.root.emit('focusin');
    f.doc.hidden = true;
    f.doc.emit('visibilitychange');
    f.visible(false);
    f.root.emit('pointerleave');
    f.root.emit('focusout', { relatedTarget: f.next });
    assert.equal(f.controller.rotation.isBlocked('focus'), true);
    f.root.emit('focusout', { relatedTarget: null });
    f.doc.hidden = false;
    f.doc.emit('visibilitychange');
    f.visible();
    f.timer.tick(20000);
    assert.equal(f.controller.rotation.index, 0);
    assert.equal(f.pause.attributes.get('aria-pressed'), 'true');
    assert.equal(f.pause.textContent, 'Reanudar');
    f.pause.emit('click');
    f.timer.tick(2000);
    assert.equal(f.controller.rotation.index, 1);
    f.controller.destroy();
});

test('reduced motion never autoplays and manual navigation is instantaneous', () => {
    const f = fixture({ reduced: true, animation: true });
    f.visible();
    f.timer.tick(20000);
    assert.equal(f.controller.rotation.index, 0);
    f.next.emit('click');
    f.previous.emit('click');
    assert.equal(f.controller.rotation.index, 0);
    assert.equal(f.animationCalls.length, 0);
    f.preference.matches = false;
    f.preference.emit('change');
    assert.equal(f.timer.timers.size, 1);
    f.preference.matches = true;
    f.preference.emit('change');
    assert.equal(f.timer.timers.size, 0);
    f.controller.destroy();
});

test('animation uses 650ms and bounded rapid controls without extra timers', async () => {
    const f = fixture({ animation: true });
    f.visible();
    f.next.emit('click');
    f.next.emit('click');
    f.next.emit('click');
    assert.equal(f.controller.rotation.index, 1);
    assert.equal(f.animationCalls.length, 4);
    assert.ok(f.animationCalls.every((x) => x.options.duration === 650));
    f.animationCalls.forEach((x) => x.finish());
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(f.controller.rotation.index, 2);
    assert.equal(f.animationCalls.length, 8);
    assert.equal(f.timer.timers.size, 1);
    f.preference.matches = true;
    f.preference.emit('change');
    f.next.emit('click');
    assert.equal(f.controller.rotation.index, 3);
    assert.equal(f.animationCalls.length, 8);
    f.controller.destroy();
});

test('resize preserves index and source identity without changing track centering', () => {
    const f = fixture();
    f.next.emit('click');
    f.track.width = 780;
    f.resizes[0].callback();
    assert.equal(f.controller.rotation.index, 1);
    assert.equal(f.track.children[0].style.width, '155px');
    assert.equal(f.track.children[2].style.height, '235px');
    assert.deepEqual(f.track.style, {});
    f.controller.destroy();
});

test('bfcache suspends listeners/observers/timers and retains manual pause on restoration', () => {
    const f = fixture();
    f.visible();
    f.pause.emit('click');
    f.next.emit('click');
    f.win.emit('pagehide', { persisted: true });
    assert.equal(f.next.listenerCount, 0);
    assert.equal(f.doc.listenerCount, 0);
    assert.equal(f.intersections[0].connected, false);
    assert.equal(f.resizes[0].connected, false);
    assert.equal(f.timer.timers.size, 0);
    f.win.emit('pageshow', { persisted: true });
    f.win.emit('pageshow', { persisted: true });
    assert.equal(f.next.listenerCount, 1);
    f.visible();
    assert.equal(f.controller.rotation.index, 1);
    assert.equal(f.controller.rotation.isBlocked('user'), true);
    assert.equal(f.timer.timers.size, 0);
    f.intersections[0].callback([{ isIntersecting: false, intersectionRatio: 0 }]);
    assert.equal(f.controller.rotation.isBlocked('offscreen'), false, 'Ignore stale disconnected observer callbacks');
    f.win.emit('pagehide', { persisted: false });
    assert.equal(f.win.listenerCount, 0);
    assert.equal(f.next.listenerCount, 0);
    assert.equal(f.preference.listenerCount, 0);
    assert.equal(f.controls.hidden, true);
    assert.equal(f.root.classes.has('is-enhanced'), false);
    assert.ok(f.track.children.every((x) => Object.keys(x.style).length === 0));
});

test('missing observers still autoplays only onscreen and cleans up scroll fallback; malformed markup stays static', () => {
    const f = fixture({ observers: false });
    f.timer.tick(30000);
    assert.equal(f.controller.rotation.index, 0);
    f.visible();
    f.timer.tick(2000);
    assert.equal(f.controller.rotation.index, 1);
    f.visible(false);
    f.timer.tick(10000);
    assert.equal(f.controller.rotation.index, 1);
    f.track.width = 780;
    f.win.emit('resize');
    assert.equal(f.track.children[0].style.width, '155px');
    f.controller.destroy();
    assert.equal(f.win.listenerCount, 0);
    assert.equal(f.timer.timers.size, 0);
    const broken = fixture({ count: 3 });
    assert.equal(broken.controller, null);
    assert.equal(broken.controls.hidden, true);
    assert.equal(broken.root.classes.size, 0);
    assert.equal(broken.timer.timers.size, 0);
});

test('scrolling the portraits under a stationary mouse or touching them does not pause autoplay', () => {
    for (const productTrack of [false, true]) {
        const f = fixture({ hovered: true, productTrack, navigation: false });
        f.visible();
        f.root.emit('pointerenter', { pointerType: 'mouse' });
        f.timer.tick(2000);
        assert.equal(f.controller.rotation.index, 1);
        f.root.emit('pointerenter', { pointerType: 'touch' });
        f.root.emit('pointerdown', { pointerType: 'touch' });
        f.timer.tick(2000);
        assert.equal(f.controller.rotation.index, 2);
        f.root.emit('pointerleave');
        assert.equal(f.timer.timers.size, 1);
        f.controller.destroy();
    }
});

test('an initially visible gallery starts before the observer delivers its first callback', () => {
    const f = fixture({ initiallyVisible: true });
    f.timer.tick(1999);
    assert.equal(f.controller.rotation.index, 0);
    f.timer.tick(1);
    assert.equal(f.controller.rotation.index, 1);
    f.visible(); // Duplicate observation must not postpone the next tick.
    f.timer.tick(2000);
    assert.equal(f.controller.rotation.index, 2);
    f.controller.destroy();
});

test('keyboard focus pauses but an explicit resume works while its button keeps focus', () => {
    const f = fixture();
    f.visible();
    f.doc.activeElement = f.pause;
    f.root.emit('focusin');
    f.timer.tick(5000);
    assert.equal(f.controller.rotation.index, 0);
    f.pause.emit('click');
    assert.equal(f.pause.attributes.get('aria-pressed'), 'true');
    f.pause.emit('click');
    f.timer.tick(2000);
    assert.equal(f.controller.rotation.index, 1);
    assert.equal(f.doc.activeElement, f.pause);
    f.controller.destroy();
});

test('restoring a visible page restarts once without waiting for another scroll or observer event', () => {
    for (const observers of [true, false]) {
        const f = fixture({ observers, initiallyVisible: true });
        f.timer.tick(2000);
        assert.equal(f.controller.rotation.index, 1);
        f.win.emit('pagehide', { persisted: true });
        f.timer.tick(10000);
        assert.equal(f.controller.rotation.index, 1);
        f.win.emit('pageshow', { persisted: true });
        f.win.emit('pageshow', { persisted: true });
        assert.equal(f.timer.timers.size, 1);
        f.timer.tick(2000);
        assert.equal(f.controller.rotation.index, 2);
        f.controller.destroy();
    }
});

test('returning to a tab checks current visibility and never overrides reduced motion or manual pause', () => {
    const f = fixture({ initiallyVisible: true });
    f.doc.hidden = true;
    f.doc.emit('visibilitychange');
    f.root.top = 1400;
    f.doc.hidden = false;
    f.doc.emit('visibilitychange');
    f.timer.tick(5000);
    assert.equal(f.controller.rotation.index, 0);
    f.root.top = 100;
    f.doc.emit('visibilitychange');
    f.timer.tick(2000);
    assert.equal(f.controller.rotation.index, 1);
    f.preference.matches = true;
    f.preference.emit('change');
    f.doc.emit('visibilitychange');
    f.timer.tick(5000);
    assert.equal(f.controller.rotation.index, 1);
    f.preference.matches = false;
    f.preference.emit('change');
    f.pause.emit('click');
    f.doc.emit('visibilitychange');
    f.timer.tick(5000);
    assert.equal(f.controller.rotation.index, 1);
    f.controller.destroy();
});

test('static markup and image-specific selectors work without JavaScript or positional crop reassignment', () => {
    const sourceRoot = path.join(__dirname, '../../src/Novar.Web');
    const firstView = fs.readFileSync(path.join(sourceRoot, 'Views/Home/First.cshtml'), 'utf8');
    const productView = fs.readFileSync(path.join(sourceRoot, 'Views/Home/ProgressiveProduct.cshtml'), 'utf8');
    for (const view of [firstView, productView]) {
        assert.match(view, /_GalleryMotionControl/);
        assert.doesNotMatch(view, /data-gallery-previous|data-gallery-next/);
        assert.doesNotMatch(view, /is-enhanced/);
        assert.match(view, /data-gallery-image=/);
    }
    assert.doesNotMatch(firstView, /data-gallery-autoplay-interval=/);
    assert.doesNotMatch(firstView, /data-gallery-pause(?:\s|>)/);
    assert.match(productView, /_GalleryMotionControl/);
    const first = fs.readFileSync(path.join(sourceRoot, 'wwwroot/css/progressive-first.css'), 'utf8');
    const other = fs.readFileSync(path.join(sourceRoot, 'wwwroot/css/progressive-products.css'), 'utf8');
    for (const file of ['1319b.png', '2131c.png']) assert.ok(first.includes(`[data-gallery-image="${file}"] img`));
    for (const file of ['2b637.png', 'c8a26.png', '1afa3.png']) assert.ok(other.includes(`[data-gallery-image="${file}"] img`));
    assert.doesNotMatch(first + other, /prg-gallery-images > div(?::nth-child\(\d\)|:first-child|:last-child) img/);
});

 test('control-free product galleries cycle every two seconds with an accessible focus-only pause', () => {
 const f=fixture({navigation:false,productTrack:true});
 assert.ok(f.controller); f.visible(); f.timer.tick(1999); assert.equal(f.controller.rotation.index,0);
 f.timer.tick(1); assert.equal(f.controller.rotation.index,1); f.timer.tick(2000); assert.equal(f.controller.rotation.index,2);
 f.pause.emit('click'); f.timer.tick(20000); assert.equal(f.controller.rotation.index,2); f.controller.destroy();
 });
