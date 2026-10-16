const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = 'src/Novar.Web/wwwroot/js/treatment-uv-media.js';

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
    video.paused = true; video.muted = true; video.controls = true; video.calls = 0;
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
    const elements = { '[data-uv-video]': video, '[data-uv-play]': play, '[data-uv-sound]': sound, '[data-uv-controls]': controls, '[data-uv-fallback]': fallback, '.treatment-uv-photo': photo };
    panel.querySelector = selector => elements[selector];
    play.dataset = { playLabel: 'Play', pauseLabel: 'Pause' };
    sound.dataset = { muteLabel: 'Mute', unmuteLabel: 'Unmute' };
    const document = new Element(); document.querySelector = () => panel;
    const window = new Element(); window.matchMedia = q => ({ matches: q.includes('reduced-motion') ? reduced : fine, addEventListener() {} });
    let mutation, intersection;
    vm.runInNewContext(fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '', {
        document, window,
        MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} },
        IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} }
    });
    return { panel, photo, video, play, sound, controls, fallback, document, window,
        visible: value => intersection?.([{ isIntersecting: value }]),
        hidden: () => { panel.hidden = true; mutation?.(); },
        resolve: () => resolve?.() };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('starts paused with native fallback replaced by labelled controls', () => {
    const s = setup(); assert.equal(s.video.calls, 0); assert.equal(s.controls.hidden, false);
    assert.equal(s.video.controls, false); assert.equal(s.play.attributes['aria-label'], 'Play');
});
test('visible fine-pointer hover starts muted and exits pause hover playback', () => {
    const s = setup(); s.visible(true); s.video.muted = false; s.photo.emit('pointerenter', { pointerType: 'mouse' });
    assert.equal(s.video.calls, 1); assert.equal(s.video.muted, true);
    s.photo.emit('pointerleave'); assert.equal(s.video.paused, true);
});
test('manual pause remains sticky across hover cycles', () => {
    const s = setup(); s.visible(true); s.photo.emit('pointerenter', { pointerType: 'mouse' }); s.play.emit('click');
    s.photo.emit('pointerleave'); s.photo.emit('pointerenter', { pointerType: 'mouse' });
    assert.equal(s.video.calls, 1); assert.equal(s.video.paused, true);
});
test('reduced motion and touch block automatic hover, not manual playback', () => {
    for (const options of [{ reduced: true }, { fine: false }]) {
        const s = setup(options); s.visible(true); s.photo.emit('pointerenter', { pointerType: 'mouse' });
        assert.equal(s.video.calls, 0); s.play.emit('click'); assert.equal(s.video.calls, 1);
    }
    const s = setup(); s.visible(true); s.photo.emit('pointerenter', { pointerType: 'touch' }); assert.equal(s.video.calls, 0);
});
test('manual playback survives pointer exit and sound is deliberate', () => {
    const s = setup(); s.visible(true); s.play.emit('click'); s.sound.emit('click');
    assert.equal(s.video.muted, false); s.photo.emit('pointerleave'); assert.equal(s.video.paused, false);
});
test('hidden panel, offscreen, hidden document and pagehide stop playback', () => {
    for (const stop of [s => s.hidden(), s => s.visible(false), s => { s.document.hidden = true; s.document.emit('visibilitychange'); }, s => s.window.emit('pagehide')]) {
        const s = setup(); s.visible(true); s.play.emit('click'); stop(s); assert.equal(s.video.paused, true);
    }
});
test('late play resolution cannot restart playback after exit', async () => {
    const s = setup({ deferred: true }); s.visible(true); s.photo.emit('pointerenter', { pointerType: 'mouse' });
    s.photo.emit('pointerleave'); s.video.paused = false; s.resolve(); await flush(); assert.equal(s.video.paused, true);
});
test('rejected play is caught and restores paused control state', async () => {
    const s = setup({ rejected: true }); s.visible(true); s.play.emit('click'); await flush();
    assert.equal(s.video.paused, true); assert.equal(s.play.attributes['aria-label'], 'Play'); assert.equal(s.video.calls, 1);
});
test('media failure reveals original image and disables enhanced playback', () => {
    const s = setup(); s.visible(true); s.play.emit('click'); s.video.emit('error');
    assert.equal(s.fallback.hidden, false); assert.equal(s.video.hidden, true); assert.equal(s.controls.hidden, true);
    s.play.emit('click'); assert.equal(s.video.calls, 1);
});
