const test = require('node:test');
const assert = require('node:assert/strict');
const { positions, keyframes, createRotation, reserveCardHeight, INTERVAL, DURATION } = require('../../src/Novar.Web/wwwroot/js/testimonials.js');

function fixture() {
    let pending = null;
    const changes = [];
    const rotation = createRotation((...change) => changes.push(change), (callback, delay) => {
        assert.equal(delay, INTERVAL);
        assert.equal(pending, null, 'At most one timer may run');
        pending = callback;
        return 1;
    }, () => { pending = null; });
    return {
        rotation, changes,
        get waiting() { return pending !== null; },
        tick() { assert.ok(pending); const callback = pending; pending = null; callback(); }
    };
}

test('Hernán starts centered and autoplay visits every original card before wrapping', () => {
    const f = fixture();
    assert.equal(INTERVAL, 5000);
    assert.equal(DURATION, 600);
    assert.equal(f.rotation.index, 1);
    assert.equal(f.waiting, false);
    f.rotation.setBlocked('offscreen', false);
    for (let i = 0; i < 6; i++) f.tick();
    assert.deepEqual(f.changes, [2, 0, 1, 2, 0, 1].map(index => [index, 1, false]));
    f.rotation.destroy();
    assert.equal(f.waiting, false);
});

test('manual arrows wrap in either direction while reduced motion or user pause blocks autoplay', () => {
    const f = fixture();
    f.rotation.setBlocked('reduced', true);
    f.rotation.setBlocked('user', true);
    f.rotation.setBlocked('offscreen', false);
    for (const direction of [-1, -1, -1, 1, 1, 1]) f.rotation.step(direction);
    assert.deepEqual(f.changes.map(change => change[0]), [0, 2, 1, 2, 0, 1]);
    assert.ok(f.changes.every(change => change[2]));
    assert.equal(f.waiting, false);
});

for (const reason of ['user', 'hover', 'focus', 'hidden', 'offscreen', 'reduced', 'pagehide', 'animation']) {
    test(`${reason} independently suspends autoplay and restarts only after it clears`, () => {
        const f = fixture();
        f.rotation.setBlocked('offscreen', false);
        f.rotation.setBlocked(reason, true);
        assert.equal(f.waiting, false);
        f.rotation.setBlocked(reason, false);
        assert.equal(f.waiting, true);
        f.tick();
        assert.equal(f.rotation.index, 2);
        f.rotation.destroy();
    });
}

test('clearing focus/visibility or bfcache pause never overrides user/reduced-motion blockers', () => {
    const f = fixture();
    for (const reason of ['user', 'focus', 'hidden', 'reduced', 'pagehide']) f.rotation.setBlocked(reason, true);
    for (const reason of ['offscreen', 'focus', 'hidden', 'pagehide']) f.rotation.setBlocked(reason, false);
    assert.equal(f.waiting, false);
    f.rotation.setBlocked('user', false);
    assert.equal(f.waiting, false);
    f.rotation.setBlocked('reduced', false);
    assert.equal(f.waiting, true);
    f.rotation.destroy();
    f.rotation.step(1);
    f.rotation.setBlocked('offscreen', true);
    f.rotation.setBlocked('offscreen', false);
    assert.equal(f.waiting, false);
    assert.deepEqual(f.changes, [], 'Disposed page never changes or restarts');
});

test('every card centers within responsive viewports without scaling typography', () => {
    for (const viewport of [280, 350, 620, 704, 976, 1264]) {
        for (let active = 0; active < 3; active++) {
            const layout = positions(viewport, active);
            assert.equal(layout[active].left + layout[active].width / 2, viewport / 2);
            assert.ok(layout.every(card => card.width > 0));
            const ordered = layout.toSorted((a, b) => a.distance - b.distance);
            assert.deepEqual(ordered.map(card => card.distance), [-1, 0, 1]);
            for (let i = 1; i < 3; i++) assert.ok(ordered[i].left - ordered[i - 1].left - ordered[i - 1].width >= 19.99);
            if (viewport >= 640) {
                assert.equal(ordered[0].left, 12);
                assert.equal(ordered[2].left + ordered[2].width, viewport - 12);
            }
        }
    }
});

test('both wrap directions reset outside the viewport only while fully invisible', () => {
    for (const viewport of [280, 704, 1264]) {
        for (let active = 0; active < 3; active++) {
            for (const direction of [-1, 1]) {
                const before = positions(viewport, active);
                const after = positions(viewport, (active + direction + 3) % 3);
                let wraps = 0;
                before.forEach((card, i) => {
                    const frames = keyframes(card, after[i], viewport, direction);
                    assert.ok(frames.every(frame => !frame.transform.includes('scale')));
                    if (frames.length === 2) return;
                    wraps++;
                    assert.equal(frames[1].opacity, 0);
                    assert.equal(frames[2].opacity, 0);
                    const exit = Number(frames[1].transform.match(/translate\(([-\d.]+)px/)[1]);
                    const enter = Number(frames[2].transform.match(/translate\(([-\d.]+)px/)[1]);
                    assert.ok(direction > 0 ? exit + card.width < 0 && enter > viewport
                        : exit > viewport && enter + after[i].width < 0);
                });
                assert.equal(wraps, 1);
            }
        }
    }
});

test('all three testimonial boxes reserve the tallest measured content at both responsive widths', () => {
    const cards = [
        { style: { width: '', minHeight: '300px', height: '300px', removeProperty(name) { delete this[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]; } }, get offsetHeight() { return this.style.width === '280px' ? 126 : 154; } },
        { style: { width: '', minHeight: '300px', height: '300px', removeProperty(name) { delete this[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]; } }, get offsetHeight() { return this.style.width === '280px' ? 178 : 202; } },
        { style: { width: '', minHeight: '300px', height: '300px', removeProperty(name) { delete this[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]; } }, get offsetHeight() { return this.style.width === '280px' ? 142 : 166; } }
    ];
    const height = reserveCardHeight(cards, [280, 704]);
    assert.equal(height, 202);
    assert.ok(cards.every(card => card.style.minHeight === '202px'));
    assert.ok(cards.every(card => !('height' in card.style)), 'Fixed height is cleared before measuring content');
});
