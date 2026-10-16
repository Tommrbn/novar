const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = 'src/Novar.Web/wwwroot/js/treatment-antirraya.js';

class Element {
    constructor() { this.events = {}; this.hidden = false; this.attributes = {}; }
    addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
    emit(name, event = {}) { for (const fn of this.events[name] || []) fn(event); }
    setAttribute(name, value) { this.attributes[name] = value; }
}
function setup({ reduced = false, fine = true, deferred = false, rejected = false } = {}) {
    const panel = new Element(), photo = new Element(), video = new Element();
    const play = new Element(), sound = new Element(), controls = new Element(), fallback = new Element();
    fallback.hidden = true; controls.hidden = true;
    video.paused = true; video.muted = false; video.controls = true; video.calls = 0;
    let resolve;
    video.play = () => {
        video.calls++; video.paused = false; video.emit('play');
        if (rejected) return Promise.reject(new Error('NotAllowedError'));
        if (deferred) return new Promise(r => { resolve = r; });
        return Promise.resolve();
    };
    video.pause = () => { video.paused = true; video.emit('pause'); };
    video.closest = () => panel;
    photo.classList = { add() {}, remove() {} };
    const elements = { '[data-antirraya-video]': video, '[data-antirraya-play]': play, '[data-antirraya-sound]': sound, '[data-antirraya-controls]': controls, '[data-antirraya-fallback]': fallback, '.treatment-antirraya-photo': photo };
    panel.querySelector = selector => elements[selector];
    play.dataset = { playLabel: 'Play', pauseLabel: 'Pause' };
    sound.dataset = { muteLabel: 'Mute', unmuteLabel: 'Unmute' };
    const document = new Element(); document.querySelector = () => panel;
    let preferenceChanged; const preference = { matches: reduced, addEventListener(name, fn) { preferenceChanged = fn; } };
    const window = new Element(); window.matchMedia = () => preference;
    let mutation, intersection;
    vm.runInNewContext(fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '', {
        document, window,
        MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} },
        IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} }
    });
    return { panel, photo, video, play, sound, controls, fallback, document, window,
        visible: value => intersection?.([{ isIntersecting: value }]),
        hidden: () => { panel.hidden = true; mutation?.(); },
        motion: value => { preference.matches = value; preferenceChanged?.(); },
        resolve: () => resolve?.() };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('visible eligible video initializes muted defaults and starts automatic loop', () => {
    const s = setup(); assert.equal(s.video.muted, true); assert.equal(s.video.defaultMuted, true);
    assert.equal(s.controls.hidden, false); assert.equal(s.video.controls, false);
    s.visible(true); assert.equal(s.video.calls, 1); assert.equal(s.video.paused, false);
});
test('manual pause survives visibility and panel changes', () => {
    const s = setup(); s.visible(true); s.play.emit('click'); s.visible(false); s.visible(true);
    s.hidden(); s.panel.hidden = false; s.visible(true);
    assert.equal(s.video.calls, 1); assert.equal(s.video.paused, true);
});
test('sound choice is preserved and never resumed automatically with audio', () => {
    const s = setup(); s.visible(true); s.sound.emit('click'); assert.equal(s.video.muted, false);
    s.visible(false); s.visible(true); assert.equal(s.video.calls, 1); assert.equal(s.video.paused, true);
    s.play.emit('click'); assert.equal(s.video.calls, 2); assert.equal(s.video.muted, false);
});
test('hidden panel, document, offscreen and pagehide stop playback', () => {
    for (const stop of [s => s.hidden(), s => s.visible(false), s => { s.document.hidden = true; s.document.emit('visibilitychange'); }, s => s.window.emit('pagehide')]) {
        const s = setup(); s.visible(true); stop(s); assert.equal(s.video.paused, true);
    }
});
test('reduced motion suppresses auto play but deliberate Play overrides it', () => {
    const s = setup({ reduced: true }); s.visible(true); assert.equal(s.video.calls, 0);
    s.play.emit('click'); assert.equal(s.video.calls, 1);
});
test('rejected autoplay is caught and manual play remains available', async () => {
    const s = setup({ rejected: true }); s.visible(true); await flush();
    assert.equal(s.video.paused, true); assert.equal(s.play.attributes['aria-label'], 'Play');
    s.play.emit('click'); await flush(); assert.equal(s.video.calls, 2);
});
test('late resolution cannot resurrect a hidden video', async () => {
    const s = setup({ deferred: true }); s.visible(true); s.hidden(); s.video.paused = false;
    s.resolve(); await flush(); assert.equal(s.video.paused, true);
});
test('decode error exposes original image fallback', () => {
    const s = setup(); s.visible(true); s.video.emit('error');
    assert.equal(s.video.hidden, true); assert.equal(s.fallback.hidden, false); assert.equal(s.controls.hidden, true);
});

test('late autoplay resolution cannot bypass a new reduced-motion preference', async () => {
    const s = setup({ deferred: true }); s.visible(true); s.motion(true);
    s.video.paused = false; s.resolve(); await flush(); assert.equal(s.video.paused, true);
});
test('autoplay rejection does not retry on subsequent visibility callbacks', async () => {
    const s = setup({ rejected: true }); s.visible(true); await flush();
    s.visible(false); s.visible(true); assert.equal(s.video.calls, 1);
});
