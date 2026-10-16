const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '../../src/Novar.Web/wwwroot/js/treatment-ilux.js');

function fixture({ hidden = false, absent = false, missingVideo = false } = {}) {
    const video = {
        muted: false, currentTime: 2, pauseCalls: 0, playCalls: 0,
        pause() { this.pauseCalls++; },
        play() { this.playCalls++; }
    };
    const panel = {
        hidden,
        querySelector(selector) {
            assert.equal(selector, '.treatment-ilux-video');
            return missingVideo ? null : video;
        }
    };
    let observer;
    const context = {
        document: { getElementById(id) { assert.equal(id, 'ilux'); return absent ? null : panel; } },
        MutationObserver: class {
            constructor(callback) { this.callback = callback; observer = this; }
            observe(target, options) { this.target = target; this.options = options; }
        }
    };
    // An absent baseline script is a no-op, so RED reports missing behavior, not an import error.
    vm.runInNewContext(fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, 'utf8') : '', context);
    return { panel, video, get observer() { return observer; }, change() { observer?.callback(); } };
}

test('hiding the iLUX panel pauses playback without changing user audio or position', () => {
    const f = fixture();
    f.panel.hidden = true;
    f.change();
    assert.equal(f.video.pauseCalls, 1);
    assert.equal(f.video.muted, false);
    assert.equal(f.video.currentTime, 2);
    assert.equal(f.observer.target, f.panel);
    assert.equal(f.observer.options.attributes, true);
    assert.deepEqual(Array.from(f.observer.options.attributeFilter), ['hidden']);
});

test('visible panel mutations do not pause and returning never resumes automatically', () => {
    const f = fixture();
    f.change();
    assert.equal(f.video.pauseCalls, 0);
    f.panel.hidden = true;
    f.change();
    f.panel.hidden = false;
    f.change();
    assert.equal(f.video.pauseCalls, 1);
    assert.equal(f.video.playCalls, 0);
    assert.equal(f.video.muted, false);
});

test('an initially hidden iLUX panel is paused safely', () => {
    const f = fixture({ hidden: true });
    assert.equal(f.video.pauseCalls, 1);
    assert.equal(f.video.playCalls, 0);
});

test('absent panels and missing video elements are safe and need no observer', () => {
    assert.equal(fixture({ absent: true }).observer, undefined);
    assert.equal(fixture({ missingVideo: true }).observer, undefined);
});
