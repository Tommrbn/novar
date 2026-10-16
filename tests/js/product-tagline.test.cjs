const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = 'src/Novar.Web/wwwroot/js/product-tagline.js';

class Events extends EventTarget {
    emit(type, values = {}) {
        this.dispatchEvent(Object.assign(new Event(type), values));
    }
}

function setup({ reduced = false, scroll = 0, top = 950, heroHeight = 950, hasHero = true, supported = true, loading = false } = {}) {
    const attributes = new Map();
    let position = top;
    let height = heroHeight;
    const band = {
        setAttribute: (name, value) => attributes.set(name, value),
        getBoundingClientRect: () => ({ top: position, bottom: position + 117 }),
        previousElementSibling: hasHero ? {
            getBoundingClientRect: () => ({ top: position - height, bottom: position, height }),
        } : null,
    };
    const preference = new Events();
    preference.matches = reduced;
    const window = new Events();
    Object.assign(window, { innerHeight: 1000, scrollY: scroll });
    const frames = new Map();
    let frameId = 0;
    if (supported) {
        window.matchMedia = () => preference;
        window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
        window.cancelAnimationFrame = id => frames.delete(id);
    }
    const rootAttributes = new Map();
    const document = new Events();
    Object.assign(document, {
        readyState: loading ? 'loading' : 'complete',
        documentElement: {
            setAttribute: (name, value) => rootAttributes.set(name, value),
            removeAttribute: name => rootAttributes.delete(name),
        },
        querySelectorAll: () => document.readyState === 'loading' ? [] : [band],
    });
    vm.runInNewContext(fs.existsSync(script) ? fs.readFileSync(script, 'utf8') : '', { window, document });
    function flush() {
        const callbacks = [...frames.values()];
        frames.clear();
        callbacks.forEach(callback => callback());
    }
    return {
        state: () => attributes.get('data-tagline-state'),
        hiddenFromReading: () => attributes.has('aria-hidden'),
        beforePaintCover: () => rootAttributes.has('data-tagline-pending'),
        ready() { document.readyState = 'interactive'; document.emit('DOMContentLoaded'); flush(); },
        frames,
        move(y, nextTop) { window.scrollY = y; position = nextTop; window.emit('scroll'); flush(); },
        motion(value) { preference.matches = value; preference.emit('change'); flush(); },
        resize(nextHeight = height, nextTop = position) { height = nextHeight; position = nextTop; window.emit('resize'); flush(); },
        pageHide(persisted) { window.emit('pagehide', { persisted }); flush(); },
        flush,
    };
}

test('head initialization covers upcoming bands before parsing, then hands off without a gap', () => {
    const page = setup({ loading: true, top: 700, heroHeight: 700 });
    assert.equal(page.beforePaintCover(), true);
    assert.equal(page.state(), undefined);
    page.ready();
    assert.equal(page.state(), 'covered');
    assert.equal(page.beforePaintCover(), false);
    page.move(100, 600);
    assert.equal(page.state(), 'covered');
    page.move(350, 350);
    assert.equal(page.state(), 'revealed');
});

test('unsupported head initialization never hides the upcoming content', () => {
    const page = setup({ loading: true, supported: false });
    page.ready();
    assert.equal(page.beforePaintCover(), false);
    assert.notEqual(page.state(), 'covered');
});

test('the band begins covered, even when visible at the top of a tall screen', () => {
    const page = setup({ top: 700 });
    page.flush();
    assert.equal(page.state(), 'covered');
    assert.equal(page.hiddenFromReading(), false);
});

test('the band reveals at the hero midpoint, before the following intro; scrolling back covers again', () => {
    const page = setup();
    page.move(30, 920);
    assert.equal(page.state(), 'covered');
    page.move(200, 750);
    assert.equal(page.state(), 'covered');
    page.move(474, 476);
    assert.equal(page.state(), 'covered');
    page.move(475, 475);
    assert.equal(page.state(), 'revealed');
    page.move(476, 474);
    assert.equal(page.state(), 'revealed');
    page.move(474, 476);
    assert.equal(page.state(), 'covered');
    page.move(0, 950);
    assert.equal(page.state(), 'covered');
    page.resize();
    assert.equal(page.frames.size, 0);
});

test('the midpoint follows actual banner height on desktop and mobile, not a fixed scroll distance', () => {
    for (const heroHeight of [761, 1006.74, 1200]) {
        const page = setup({ top: heroHeight, heroHeight });
        page.move(heroHeight * 0.49, heroHeight * 0.51);
        assert.equal(page.state(), 'covered');
        page.move(heroHeight * 0.51, heroHeight * 0.49);
        assert.equal(page.state(), 'revealed');
    }
});

test('headers above a banner do not shift its halfway trigger', () => {
    const page = setup({ top: 880, heroHeight: 800 });
    page.move(479, 401);
    assert.equal(page.state(), 'covered');
    page.move(480, 400);
    assert.equal(page.state(), 'revealed');
});

test('resize recalculates the hero midpoint without another scroll', () => {
    const page = setup({ top: 800, heroHeight: 800 });
    page.move(450, 350);
    assert.equal(page.state(), 'revealed');
    page.resize(1200, 750);
    assert.equal(page.state(), 'covered');
    page.resize(800, 350);
    assert.equal(page.state(), 'revealed');
});

test('a missing or collapsed banner never leaves the content covered', () => {
    assert.equal(setup({ hasHero: false }).state(), 'revealed');
    assert.equal(setup({ heroHeight: 0 }).state(), 'revealed');
});

test('restored scroll and jumps past the band cannot leave an unreadable cover', () => {
    const restored = setup({ scroll: 500, top: 450 });
    restored.flush();
    assert.equal(restored.state(), 'revealed');
    const jump = setup();
    jump.move(2000, -1000);
    assert.equal(jump.state(), 'revealed');
});

test('reduced motion preserves the scroll threshold without a spatial transition', () => {
    const initial = setup({ reduced: true });
    initial.flush();
    assert.equal(initial.state(), 'covered');
    initial.move(475, 475);
    assert.equal(initial.state(), 'revealed');
    const changed = setup();
    changed.motion(true);
    assert.equal(changed.state(), 'covered');
    changed.motion(false);
    assert.equal(changed.state(), 'covered');
});

test('unsupported enhancement leaves the original band visible', () => {
    const page = setup({ supported: false });
    assert.notEqual(page.state(), 'covered');
});

test('bfcache preserves pending reveal while ordinary page exit releases listeners', () => {
    const cached = setup();
    cached.pageHide(true);
    cached.move(950, 0);
    assert.equal(cached.state(), 'revealed');
    const exited = setup();
    exited.pageHide(false);
    exited.move(950, 0);
    assert.equal(exited.state(), 'covered');
    assert.equal(exited.frames.size, 0);
});
