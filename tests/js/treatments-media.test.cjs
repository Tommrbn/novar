const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ids = ['uv', 'blue-tech', 'antirraya', 'polarizado', 'hidrofobico', 'ilux', 'fotosensible'];
function fixture({ selected = 'uv', reduced = false, rejection = false, deferred = false, missing = false, near = true, visible = true, mobile = false, noObserver = false } = {}) {
    const events = {}, windowEvents = {}, mutations = {}, completions = [], rejections = [], intersections = {};
    const small = { matches: mobile };
    const motion = { matches: reduced, addEventListener(name, cb) { this.change = cb; } };
    const panels = {}, videos = {};
    for (const id of ids) {
        const fallback = { hidden: true };
        panels[id] = { id, photo: { id }, hidden: id !== selected, querySelector: () => fallback };
        videos[id] = { muted: false, defaultMuted: false, controls: true, paused: true,
            playsInline: false, ended: false, loop: true, currentTime: 3,
            loads: 0, dataset: { treatmentDesktop: `/${id}-desktop.mp4`, treatmentMobile: `/${id}-mobile.mp4` },
            load() { this.loads++; }, plays: 0, pauses: 0, hidden: false, removeAttribute() {},
            closest: selector => selector === '[data-treatment-detail]' ? panels[id] : panels[id].photo, handlers: {}, addEventListener(name, cb) { this.handlers[name] = cb; },
            pause() { this.pauses++; this.paused = true; },
            play() { this.renderableAtPlay = !this.hidden; this.plays++; this.paused = false;
                if (rejection) return Promise.reject(new Error('NotAllowedError'));
                if (deferred) return new Promise((resolve, reject) => { completions.push(() => { this.paused = false; resolve(); }); rejections.push(reject); });
                return Promise.resolve();
            }, fallback };
    }
    const document = { hidden: false, querySelectorAll: () => missing ? [] : Object.values(videos),
        addEventListener(name, cb) { events[name] = cb; } };
    class MutationObserver {
        constructor(cb) { this.cb = cb; }
        observe(panel) { mutations[panel.id] = this.cb; }
    }
    class IntersectionObserver {
        constructor(cb, options) { this.cb = cb; this.kind = options.rootMargin ? 'near' : 'visible'; }
        observe(photo) { videos[photo.id].loadedAtObserve = videos[photo.id].loads; (intersections[photo.id] ??= {})[this.kind] = this.cb;
            this.cb([{ isIntersecting: this.kind === 'near' ? near : visible }]); }
    }
    vm.runInNewContext(fs.readFileSync('src/Novar.Web/wwwroot/js/treatments-media.js', 'utf8'), {
        document, MutationObserver, window: { IntersectionObserver: noObserver ? undefined : IntersectionObserver,
            matchMedia: query => query.includes('reduced-motion') ? motion : small,
            addEventListener(name, cb) { windowEvents[name] = cb; } }
    });
    return { videos, panels, document, events, windowEvents, motion, mutations, completions, rejections, small,
        intersect(id, kind, value) { intersections[id][kind]([{ isIntersecting: value }]); } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
for (const id of ids) test(`${id} starts selected muted inline without controls`, async () => {
    const f = fixture({ selected: id }); await settle();
    for (const [key, video] of Object.entries(f.videos)) {
        assert.equal(video.plays, key === id ? 1 : 0);
        assert.equal(video.muted, true); assert.equal(video.defaultMuted, true);
        assert.equal(video.playsInline, true); assert.equal(video.controls, false);
        assert.equal(video.loop, true);
    }
});
test('selection pauses old panel and plays newly selected video without rewinding', async () => {
    const f = fixture(); await settle();
    f.panels.uv.hidden = true; f.mutations.uv();
    f.panels.ilux.hidden = false; f.mutations.ilux(); await settle();
    assert.equal(f.videos.uv.paused, true); assert.equal(f.videos.ilux.plays, 1);
    assert.equal(f.videos.uv.currentTime, 3);
});
test('document hide and pagehide pause; visible/pageshow resume eligible video', async () => {
    const f = fixture(); await settle();
    f.document.hidden = true; f.events.visibilitychange();
    assert.equal(f.videos.uv.paused, true);
    f.document.hidden = false; f.events.visibilitychange(); await settle();
    f.windowEvents.pagehide(); assert.equal(f.videos.uv.paused, true);
    f.events.visibilitychange(); assert.equal(f.videos.uv.plays, 2);
    f.windowEvents.pageshow(); await settle(); assert.equal(f.videos.uv.plays, 3);
});
test('reduced motion retains poster and changes stop/resume eligible playback', async () => {
    const f = fixture({ reduced: true });
    assert.equal(f.videos.uv.plays, 0); assert.equal(f.videos.uv.hidden, true);
    assert.equal(f.videos.uv.fallback.hidden, false);
    f.motion.matches = false; f.motion.change(); await settle();
    assert.equal(f.videos.uv.plays, 1); assert.equal(f.videos.uv.hidden, false);
    f.motion.matches = true; f.motion.change(); assert.equal(f.videos.uv.paused, true);
});
test('rejected autoplay keeps fallback and does not retry on lifecycle noise', async () => {
    const f = fixture({ rejection: true }); await settle();
    f.events.visibilitychange(); f.mutations.uv(); f.windowEvents.pageshow(); await settle();
    assert.equal(f.videos.uv.plays, 1); assert.equal(f.videos.uv.fallback.hidden, false);
});
test('late play completion cannot revive hidden panel or page', async () => {
    for (const hide of ['panel', 'page']) {
        const f = fixture({ deferred: true });
        if (hide === 'panel') { f.panels.uv.hidden = true; f.mutations.uv(); }
        else f.windowEvents.pagehide();
        f.completions[0](); await settle(); assert.equal(f.videos.uv.paused, true);
    }
});
test('pending play is not duplicated and native loops resume without rewinding', async () => {
    const f = fixture({ deferred: true }); f.mutations.uv(); f.events.visibilitychange();
    assert.equal(f.videos.uv.plays, 1); f.completions[0](); await settle();
    f.videos.uv.ended = true; f.videos.uv.paused = true;
    f.events.visibilitychange(); f.windowEvents.pageshow(); assert.equal(f.videos.uv.plays, 2);
    assert.equal(f.videos.uv.currentTime, 3);
});
test('media error falls back and absent videos are harmless', () => {
    const f = fixture(); f.videos.uv.handlers.error(); assert.equal(f.videos.uv.fallback.hidden, false);
    assert.doesNotThrow(() => fixture({ missing: true }));
});

test('lifecycle AbortError permits a fresh attempt without declaring asset failure', async () => {
    const f = fixture({ deferred: true });
    f.panels.uv.hidden = true; f.mutations.uv();
    f.rejections[0](Object.assign(new Error('Interrupted'), { name: 'AbortError' })); await settle();
    assert.equal(f.videos.uv.fallback.hidden, false);
    f.panels.uv.hidden = false; f.mutations.uv(); assert.equal(f.videos.uv.plays, 2);
    f.completions[1](); await settle();
});

test('offscreen initial page has no video source or playback and retains poster', () => {
    const f = fixture({ near: false, visible: false });
    for (const video of Object.values(f.videos)) {
        assert.equal(video.src, undefined); assert.equal(video.loads, 0); assert.equal(video.plays, 0);
        assert.equal(video.fallback.hidden, video === f.videos['blue-tech']);
    }
});
test('near viewport loads only selected rendition once; visible viewport starts playback', async () => {
    const f = fixture({ near: false, visible: false, mobile: true });
    f.intersect('ilux', 'near', true); assert.equal(f.videos.ilux.loads, 0);
    f.intersect('uv', 'near', true);
    assert.equal(f.videos.uv.src, '/uv-mobile.mp4'); assert.equal(f.videos.uv.loads, 1);
    assert.equal(f.videos.uv.plays, 0); assert.equal(f.videos.uv.fallback.hidden, false);
    f.intersect('uv', 'visible', true); await settle(); assert.equal(f.videos.uv.plays, 1);
    f.intersect('uv', 'visible', false); assert.equal(f.videos.uv.paused, true);
    f.small.matches = false; f.intersect('uv', 'visible', true); await settle();
    assert.equal(f.videos.uv.src, '/uv-mobile.mp4'); assert.equal(f.videos.uv.loads, 1);
});
test('reduced motion prevents all source attachment even near visible selected banner', () => {
    const f = fixture({ reduced: true });
    assert.equal(f.videos.uv.src, undefined); assert.equal(f.videos.uv.loads, 0);
});
test('missing IntersectionObserver retains authentic posters without eager original request', () => {
    const f = fixture({ noObserver: true });
    assert.equal(f.videos.uv.src, undefined); assert.equal(f.videos.uv.plays, 0);
    assert.equal(f.videos.uv.fallback.hidden, false);
});
test('late completion cannot revive an offscreen video', async () => {
    const f = fixture({ deferred: true }); f.intersect('uv', 'visible', false);
    f.completions[0](); await settle(); assert.equal(f.videos.uv.paused, true);
});

test('all seven videos are renderable before play while pending authentic preview remains visible', async () => {
    for (const id of ids) {
        const f = fixture({ selected: id, deferred: true });
        const video = f.videos[id];
        assert.equal(video.renderableAtPlay, true);
        assert.equal(video.hidden, false);
        assert.equal(video.fallback.hidden, id === 'blue-tech');
        f.completions[0](); await settle();
        assert.equal(video.fallback.hidden, true);
    }
});
test('pending renderable video is hidden again offscreen, on pagehide or reduced motion', () => {
    for (const hide of ['viewport', 'page', 'motion']) {
        const f = fixture({ deferred: true });
        assert.equal(f.videos.uv.hidden, false);
        if (hide === 'viewport') f.intersect('uv', 'visible', false);
        if (hide === 'page') f.windowEvents.pagehide();
        if (hide === 'motion') { f.motion.matches = true; f.motion.change(); }
        assert.equal(f.videos.uv.hidden, true);
        assert.equal(f.videos.uv.fallback.hidden, false);
        assert.equal(f.videos.uv.paused, true);
    }
});
test('rejection restores poster and hides the renderable video without retry', async () => {
    const f = fixture({ selected: 'fotosensible', rejection: true }); await settle();
    assert.equal(f.videos.fotosensible.hidden, true);
    assert.equal(f.videos.fotosensible.fallback.hidden, false);
    f.events.visibilitychange(); assert.equal(f.videos.fotosensible.plays, 1);
});

test("foreground focus resumes externally paused playback without duplicate pending requests", async () => {
 const f=fixture({deferred:true}); f.completions[0](); await settle();
 f.videos.uv.paused=true; f.windowEvents.focus(); f.windowEvents.focus();
 assert.equal(f.videos.uv.plays,2); assert.equal(f.videos.uv.currentTime,3);
 f.windowEvents.blur(); assert.equal(f.videos.uv.paused,true);
 f.document.hidden=true; f.windowEvents.focus(); assert.equal(f.videos.uv.plays,2);
});

test('external AbortError waits for an event then resumes without permanent failure', async () => {
 const f=fixture({deferred:true}); f.videos.uv.paused=true;
 f.rejections[0](Object.assign(new Error('External interruption'),{name:'AbortError'})); await settle();
 assert.equal(f.videos.uv.plays,1); f.windowEvents.focus(); assert.equal(f.videos.uv.plays,2);
});
test('obsolete settlements never clear or fail a newer pending request', async () => {
 for(const reject of [true,false]) {
  const f=fixture({deferred:true}); f.windowEvents.blur(); f.windowEvents.focus();
  assert.equal(f.videos.uv.plays,2);
  if(reject)f.rejections[0](new Error('Obsolete denied'));else f.completions[0]();
  await settle(); f.videos.uv.paused=true; f.windowEvents.focus();
  assert.equal(f.videos.uv.plays,2); f.completions[1](); await settle();
  assert.equal(f.videos.uv.fallback.hidden,true);
 }
});
test('focus cannot start an offscreen or hidden panel', async () => {
 const f=fixture({visible:false}); f.windowEvents.blur(); f.windowEvents.focus();
 assert.equal(f.videos.uv.plays,0);assert.equal(f.videos.ilux.plays,0);
});

test('selected Blue prepares once before intersection and has no normal startup still', async () => {
 const f=fixture({selected:'blue-tech',near:false,visible:false,mobile:true,deferred:true});
 const v=f.videos['blue-tech']; assert.equal(v.loadedAtObserve,1);assert.equal(v.loads,1);
 assert.equal(v.preload,'auto');assert.equal(v.src,'/blue-tech-mobile.mp4');
 assert.equal(v.plays,0);assert.equal(v.fallback.hidden,true);
 for(const id of ids.filter(id=>id!=='blue-tech'))assert.equal(f.videos[id].loads,0);
 f.intersect('blue-tech','visible',true);assert.equal(v.renderableAtPlay,true);
 assert.equal(v.fallback.hidden,true);f.completions[0]();await settle();
 f.small.matches=false;f.windowEvents.blur();f.windowEvents.focus();assert.equal(v.loads,1);
});
test('Blue retains authentic static fallback for motion, missing IO and denied autoplay', async () => {
 for(const options of [{reduced:true},{noObserver:true},{rejection:true}]) {
  const f=fixture({selected:'blue-tech',...options});await settle();const v=f.videos['blue-tech'];
  assert.equal(v.fallback.hidden,false);assert.equal(v.hidden,true);
  if(!options.rejection)assert.equal(v.loads,0);
  f.windowEvents.focus();assert.equal(v.plays,options.rejection?1:0);
 }
});

test('all seven source partials declare native looping without eager native autoplay', () => {
 for(const name of ['Uv','BlueTech','Antirraya','Polarizado','Hidrofobico','Fotosensible','Ilux']) {
  const html=fs.readFileSync(`src/Novar.Web/Views/Shared/_Treatment${name}.cshtml`,'utf8');
  const video=html.match(/<video\b[^>]*>/)[0];assert.match(video,/\sloop(?:\s|>)/,name);
  assert.doesNotMatch(video,/\s(?:controls|autoplay|src)=?/);
 }
});
