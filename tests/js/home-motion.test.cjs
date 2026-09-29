const test = require('node:test');
const assert = require('node:assert/strict');
const { positions, createRotation, INTERVAL } = require('../../src/Novar.Web/wwwroot/js/home.js');

function fixture() {
    let pending = null;
    const values = [];
    const rotation = createRotation(7, value => values.push(value), (callback, delay) => {
        assert.equal(delay, 3200);
        assert.equal(pending, null, 'Only one timer may run');
        pending = callback;
        return 1;
    }, () => { pending = null; });
    return {
        rotation, values,
        get waiting() { return pending !== null; },
        tick() { assert.ok(pending); const callback = pending; pending = null; callback(); }
    };
}

test('variable-height questions stay centered and never overlap through all seven positions', () => {
    const heights = [48, 96, 48, 72, 48, 96, 96];
    for (let active = 0; active < 7; active++) {
        const layout = positions(heights, active);
        assert.equal(layout[active].top + heights[active] / 2, 0);
        const ordered = layout.map((value, index) => ({ ...value, height: heights[index] }))
            .sort((a, b) => a.distance - b.distance);
        assert.deepEqual(ordered.map(item => item.distance), [-3, -2, -1, 0, 1, 2, 3]);
        for (let i = 1; i < ordered.length; i++) {
            assert.equal(ordered[i].top - ordered[i - 1].top - ordered[i - 1].height, 24);
        }
    }
});

test('starts at the fourth question and loops without skipping a question', () => {
    const f = fixture();
    assert.equal(INTERVAL, 3200);
    assert.equal(f.rotation.index, 3);
    assert.equal(f.waiting, false, 'Must not run before intersection evidence');
    f.rotation.setBlocked('offscreen', false);
    for (let i = 0; i < 7; i++) f.tick();
    assert.deepEqual(f.values, [4, 5, 6, 0, 1, 2, 3]);
    f.rotation.destroy();
    assert.equal(f.waiting, false);
});

for (const reason of ['user', 'hover', 'focus', 'hidden', 'static', 'offscreen', 'pagehide']) {
    test(`${reason} suspends rotation until that reason is cleared`, () => {
        const f = fixture();
        f.rotation.setBlocked('offscreen', false);
        f.rotation.setBlocked(reason, true);
        assert.equal(f.waiting, false);
        assert.equal(f.rotation.index, 3);
        f.rotation.setBlocked(reason, false);
        assert.equal(f.waiting, true);
        f.tick();
        assert.deepEqual(f.values, [4]);
        f.rotation.destroy();
    });
}

test('resuming one reason never overrides user pause or reduced-motion/static mode', () => {
    const f = fixture();
    f.rotation.setBlocked('offscreen', false);
    for (const reason of ['user', 'focus', 'static']) f.rotation.setBlocked(reason, true);
    f.rotation.setBlocked('focus', false);
    f.rotation.setBlocked('user', false);
    assert.equal(f.waiting, false);
    f.rotation.setBlocked('static', false);
    assert.equal(f.waiting, true);
    f.rotation.destroy();
    f.rotation.setBlocked('hover', true);
    f.rotation.setBlocked('hover', false);
    assert.equal(f.waiting, false, 'Disposed controller never restarts');
});
