(function (scope, build) {
    const api = build();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (scope && scope.document && scope.window) {
        const start = () => api.initHomeMedia(scope.document, scope.window);
        if (scope.document.readyState === 'loading') {
            scope.document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
    'use strict';

    function createMediaController(options) {
        const { video, poster, button, source } = options;
        if (!video || !poster || !button || !source) throw new TypeError('A Home media player requires video, poster, button and source elements.');

        let visible = Boolean(options.visible);
        let pageHidden = Boolean(options.pageHidden);
        let reducedMotion = Boolean(options.reducedMotion);
        let manualOptIn = false;
        let userPaused = false;
        let playing = false;
        let pending = false;
        let sourceAttached = false;
        let failed = false;
        let destroyed = false;
        let requestVersion = 0;
        const removeListeners = [];
        const playLabel = options.playLabel || 'Reproducir video';
        const pauseLabel = options.pauseLabel || 'Pausar video';

        function listen(target, name, handler) {
            if (!target || typeof target.addEventListener !== 'function') return;
            target.addEventListener(name, handler);
            removeListeners.push(() => target.removeEventListener(name, handler));
        }

        function updateButton() {
            button.hidden = false;
            button.textContent = playing ? pauseLabel : playLabel;
            if (typeof button.setAttribute === 'function') {
                button.setAttribute('aria-label', playing ? pauseLabel : playLabel);
                button.setAttribute('aria-pressed', String(playing));
            }
        }

        function showPoster() {
            playing = false;
            video.hidden = true;
            poster.hidden = false;
            updateButton();
        }

        function eligible() {
            return !destroyed && visible && !pageHidden && !userPaused && (!reducedMotion || manualOptIn) && !failed;
        }

        function attachSource() {
            if (sourceAttached) return;
            video.muted = true;
            video.defaultMuted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'none';
            video.src = source;
            sourceAttached = true;
            if (typeof video.load === 'function') video.load();
        }

        function pauseAndRestorePoster() {
            requestVersion++;
            pending = false;
            if (typeof video.pause === 'function' && (playing || video.paused === false)) video.pause();
            showPoster();
        }

        function requestPlay() {
            if (!eligible() || playing || pending) return Promise.resolve(false);
            attachSource();
            video.muted = true;
            video.defaultMuted = true;
            pending = true;
            const version = ++requestVersion;
            let result;
            try {
                if (typeof video.play !== 'function') throw new Error('Video playback is unavailable.');
                result = video.play();
            } catch {
                result = Promise.reject(new Error('Video playback failed.'));
            }
            return Promise.resolve(result).then(() => {
                if (version !== requestVersion) {
                    if (!eligible() && typeof video.pause === 'function') video.pause();
                    return false;
                }
                if (!eligible()) {
                    pauseAndRestorePoster();
                    return false;
                }
                // Visibility and controls change only after the actual `playing` event.
                return true;
            }, () => {
                if (version !== requestVersion) {
                    if (!eligible() && typeof video.pause === 'function') video.pause();
                    return false;
                }
                failed = true;
                manualOptIn = false;
                pauseAndRestorePoster();
                return false;
            });
        }

        function refresh() {
            if (!eligible()) {
                pauseAndRestorePoster();
                return Promise.resolve(false);
            }
            return requestPlay();
        }

        function onPlaying() {
            if (!eligible()) {
                pauseAndRestorePoster();
                return;
            }
            pending = false;
            playing = true;
            video.hidden = false;
            poster.hidden = true;
            updateButton();
        }

        function onPause() {
            playing = false;
            pending = false;
            updateButton();
        }

        function onError() {
            failed = true;
            manualOptIn = false;
            pauseAndRestorePoster();
        }

        function onToggle() {
            if (playing || pending) {
                userPaused = true;
                manualOptIn = false;
                pauseAndRestorePoster();
                return;
            }
            userPaused = false;
            manualOptIn = true;
            failed = false;
            refresh();
        }

        listen(video, 'playing', onPlaying);
        listen(video, 'pause', onPause);
        listen(video, 'error', onError);
        listen(button, 'click', onToggle);
        button.hidden = false;
        poster.hidden = false;
        video.hidden = true;
        updateButton();

        return {
            setVisible(value) { visible = Boolean(value); return refresh(); },
            setPageHidden(value) { pageHidden = Boolean(value); return refresh(); },
            setReducedMotion(value) { reducedMotion = Boolean(value); return refresh(); },
            refresh,
            destroy() {
                destroyed = true;
                pauseAndRestorePoster();
                for (const remove of removeListeners.splice(0)) remove();
                button.hidden = true;
            },
            getState() { return { visible, pageHidden, reducedMotion, manualOptIn, userPaused, playing, pending, sourceAttached, failed }; }
        };
    }

    function addListener(target, name, handler) {
        if (!target) return () => {};
        if (typeof target.addEventListener === 'function') {
            target.addEventListener(name, handler, { passive: name === 'scroll' || name === 'resize' });
            return () => target.removeEventListener(name, handler);
        }
        if (typeof target.addListener === 'function') {
            target.addListener(handler);
            return () => target.removeListener(handler);
        }
        return () => {};
    }

    function initHomeMedia(documentObject, windowObject) {
        const roots = Array.from(documentObject.querySelectorAll('[data-home-media-player]'));
        const players = [];
        for (const root of roots) {
            const video = root.querySelector('[data-home-media-video]');
            const poster = root.querySelector('img');
            const button = root.querySelector('[data-home-media-toggle]');
            const source = root.getAttribute('data-home-media-source');
            const reduced = windowObject.matchMedia && windowObject.matchMedia('(prefers-reduced-motion: reduce)');
            if (!video || !poster || !button || !source) continue;

            const controller = createMediaController({
                video,
                poster,
                button,
                source,
                playLabel: button.getAttribute('data-play-label'),
                pauseLabel: button.getAttribute('data-pause-label'),
                pageHidden: Boolean(documentObject.hidden),
                reducedMotion: Boolean(reduced && reduced.matches)
            });
            players.push(controller);
            const cleanups = [];
            cleanups.push(addListener(documentObject, 'visibilitychange', () => controller.setPageHidden(Boolean(documentObject.hidden))));
            cleanups.push(addListener(windowObject, 'pagehide', () => controller.setPageHidden(true)));
            cleanups.push(addListener(windowObject, 'pageshow', () => controller.setPageHidden(Boolean(documentObject.hidden))));
            if (reduced) cleanups.push(addListener(reduced, 'change', event => controller.setReducedMotion(Boolean(event.matches))));

            if (typeof windowObject.IntersectionObserver === 'function') {
                const observer = new windowObject.IntersectionObserver(entries => {
                    for (const entry of entries) {
                        if (entry.target === root) controller.setVisible(Boolean(entry.isIntersecting && entry.intersectionRatio > 0));
                    }
                }, { threshold: [0, 0.01] });
                observer.observe(root);
                cleanups.push(() => observer.disconnect());
            } else {
                const checkVisibility = () => {
                    const rect = root.getBoundingClientRect();
                    const height = windowObject.innerHeight || documentObject.documentElement.clientHeight;
                    const width = windowObject.innerWidth || documentObject.documentElement.clientWidth;
                    controller.setVisible(Boolean(rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width));
                };
                cleanups.push(addListener(windowObject, 'scroll', checkVisibility));
                cleanups.push(addListener(windowObject, 'resize', checkVisibility));
                checkVisibility();
            }
            const originalDestroy = controller.destroy;
            controller.destroy = () => {
                originalDestroy();
                for (const cleanup of cleanups.splice(0)) cleanup();
            };
        }
        return players;
    }

    return { createMediaController, initHomeMedia };
});
