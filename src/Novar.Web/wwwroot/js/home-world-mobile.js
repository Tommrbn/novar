(function (scope, build) {
    const api = build();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (scope && scope.document && scope.window) {
        const start = () => api.initHomeWorldMobile(scope.document, scope.window);
        if (scope.document.readyState === 'loading') scope.document.addEventListener('DOMContentLoaded', start, { once: true });
        else start();
    }
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
    'use strict';
    function initHomeWorldMobile(doc, win) {
        const region = doc.querySelector('.home-page .world-visual');
        if (!region || typeof win.matchMedia !== 'function' || !win.PointerEvent) return null;
        const phone = win.matchMedia('(max-width: 767px)');
        const coarse = win.matchMedia('(pointer: coarse)');
        const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
        const tiles = Array.from(region.querySelectorAll('[data-home-media-controls="world"]'));
        if (!tiles.length || tiles.some(tile => !tile.querySelector('video') || !tile.querySelector('.world-media-actions'))) return null;
        let cleanup = [];
        let timers = new Map();
        let gesture = null;
        let active = false;
        let pageAway = false;
        let touchMode = coarse.matches;
        const lifecycle = [];
        const manualPauses = new Set();
        const videoOf = tile => tile.querySelector('video');
        const revealed = tile => tile.hasAttribute('data-world-controls-revealed');
        const focused = tile => tile.contains(doc.activeElement);
        const playingMuted = tile => {
            const video = videoOf(tile);
            // Shared data-media-playing also includes unresolved play promises.
            return video.paused === false && video.hidden === false && video.muted === true && !video.error;
        };
        function listen(target, name, fn, options, bag = cleanup) {
            target.addEventListener(name, fn, options);
            bag.push(() => target.removeEventListener(name, fn, options));
        }
        function clearTimer(tile) {
            if (timers.has(tile)) win.clearTimeout(timers.get(tile));
            timers.delete(tile);
        }
        function requiredControls(tile) {
            const video = videoOf(tile);
            const toggle = tile.querySelector('[data-home-media-toggle]');
            const failedFallback = video.hidden && toggle && !toggle.hidden &&
                toggle.getAttribute && toggle.getAttribute('data-media-playing') === 'false';
            return reduced.matches || focused(tile) || video.muted === false || Boolean(video.error) ||
                manualPauses.has(tile) || failedFallback;
        }
        function persistent(tile) {
            // An unengaged, initially hidden or offscreen video is not a manual pause.
            return requiredControls(tile) || (revealed(tile) && !playingMuted(tile));
        }
        function recordActivation(tile, button) {
            if (!button || !button.hasAttribute || !button.hasAttribute('data-home-media-toggle')) return;
            if (button.getAttribute('data-media-playing') === 'true' || playingMuted(tile)) manualPauses.add(tile);
            else manualPauses.delete(tile);
        }
        function schedule(tile) {
            clearTimer(tile);
            if (!active || persistent(tile) || !playingMuted(tile) || !revealed(tile)) return;
            timers.set(tile, win.setTimeout(() => {
                timers.delete(tile);
                if (active && playingMuted(tile) && !persistent(tile)) tile.removeAttribute('data-world-controls-revealed');
            }, 3000));
        }
        function reveal(tile) {
            for (const other of tiles) {
                if (other !== tile && !persistent(other)) {
                    clearTimer(other);
                    other.removeAttribute('data-world-controls-revealed');
                }
            }
            tile.setAttribute('data-world-controls-revealed', '');
            schedule(tile);
        }
        function refresh(tile) {
            if (requiredControls(tile)) {
                clearTimer(tile);
                tile.setAttribute('data-world-controls-revealed', '');
            } else schedule(tile);
        }
        function tileOf(target) {
            const tile = target && target.closest && target.closest('[data-home-media-controls="world"]');
            return tiles.includes(tile) ? tile : null;
        }
        function beginGesture(event) {
            const tile = tileOf(event.target);
            gesture = { id: event.pointerId, tile, x: event.clientX, y: event.clientY,
                scroll: region.scrollLeft, pageY: win.scrollY, moved: false, cancelled: false,
                wasRevealed: tile && revealed(tile) };
        }
        function stopEnhancement() {
            active = false;
            for (const remove of cleanup.splice(0)) remove();
            for (const tile of tiles) { clearTimer(tile); tile.removeAttribute('data-world-controls-revealed'); }
            region.classList.remove('is-touch-enhanced');
            gesture = null;
        }
        function reconcile() {
            stopEnhancement();
            if (pageAway || !phone.matches || !touchMode) return;
            try {
                for (const tile of tiles) {
                    const video = videoOf(tile);
                    for (const event of ['playing', 'pause', 'ended', 'error', 'volumechange', 'emptied', 'waiting'])
                        listen(video, event, () => refresh(tile));
                    if (win.MutationObserver) {
                        const observer = new win.MutationObserver(() => { if (active) refresh(tile); });
                        observer.observe(tile, { subtree: true, attributes: true, attributeFilter: ['hidden', 'data-media-playing'] });
                        cleanup.push(() => observer.disconnect());
                    }
                    listen(tile, 'focusin', () => reveal(tile));
                    listen(tile, 'focusout', () => win.queueMicrotask(() => { if (active) refresh(tile); }));
                }
                listen(region, 'pointerdown', event => {
                    if (event.pointerType === 'mouse') return;
                    beginGesture(event);
                }, { passive: true });
                const move = event => {
                    if (!gesture || gesture.id !== event.pointerId) return;
                    if (Math.abs(event.clientX - gesture.x) >= 10 || Math.abs(event.clientY - gesture.y) >= 10 ||
                        Math.abs(region.scrollLeft - gesture.scroll) > 2 || Math.abs(win.scrollY - gesture.pageY) > 2) gesture.moved = true;
                };
                listen(region, 'pointermove', move, { passive: true });
                listen(region, 'pointerup', move, { passive: true });
                listen(region, 'pointercancel', () => { if (gesture) gesture.cancelled = true; }, { passive: true });
                listen(region, 'click', event => {
                    if (event.detail === 0) {
                        const tile = tileOf(event.target);
                        if (tile) recordActivation(tile, event.target.closest && event.target.closest('button'));
                        return; // Keyboard activation remains native.
                    }
                    const tile = tileOf(event.target);
                    if (!tile) return;
                    const tap = gesture;
                    gesture = null;
                    if (tap && (tap.moved || tap.cancelled || tap.tile !== tile ||
                        Math.abs(region.scrollLeft - tap.scroll) > 2 || Math.abs(win.scrollY - tap.pageY) > 2)) {
                        event.preventDefault(); event.stopImmediatePropagation(); return;
                    }
                    const wasRevealed = tap ? tap.wasRevealed : revealed(tile);
                    const button = event.target.closest && event.target.closest('button');
                    if (!wasRevealed || !button) {
                        event.preventDefault(); event.stopImmediatePropagation(); reveal(tile); return;
                    }
                    recordActivation(tile, button);
                    reveal(tile);
                    // The shared controller receives this explicit button click unchanged.
                    win.queueMicrotask(() => { if (active) refresh(tile); });
                }, true);
                active = true;
                region.classList.add('is-touch-enhanced');
                for (const tile of tiles) refresh(tile);
            } catch {
                stopEnhancement(); // Initialization failure leaves ordinary controls usable.
            }
        }
        const modeChange = () => { touchMode = coarse.matches; reconcile(); };
        listen(phone, 'change', modeChange, undefined, lifecycle);
        listen(coarse, 'change', modeChange, undefined, lifecycle);
        listen(reduced, 'change', () => { if (active) for (const tile of tiles) refresh(tile); }, undefined, lifecycle);
        // A hybrid device can opt into touch without changing the primary pointer query.
        listen(region, 'pointerdown', event => {
            const next = event.pointerType === 'touch' || event.pointerType === 'pen';
            if (next !== touchMode) { touchMode = next; reconcile(); if (active) beginGesture(event); }
        }, { passive: true }, lifecycle);
        listen(win, 'pagehide', () => { pageAway = true; stopEnhancement(); }, undefined, lifecycle);
        listen(win, 'pageshow', () => { pageAway = false; touchMode = coarse.matches; reconcile(); }, undefined, lifecycle);
        reconcile();
        return { destroy() { stopEnhancement(); for (const remove of lifecycle.splice(0)) remove(); } };
    }
    return { initHomeWorldMobile };
});