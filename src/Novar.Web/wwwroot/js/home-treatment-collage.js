/* Three existing photographs travel between the original overlapping frames. */
(() => {
    'use strict';
    const REST = 2000;
    const DURATION = 500;
    const SLOTS = [
        { left: '12.832%', top: '0%', width: '54.13%', height: '100%' },
        { left: '54.572%', top: '7.679%', width: '36.726%', height: '35.495%' },
        { left: '54.572%', top: '46.758%', width: '36.726%', height: '44.369%' }
    ];
    // Identity order stays woman, girl, man; only visual slots change.
    const slotFor = (photo, featured) => (photo - featured + 3) % 3;

    function createCycle(move, schedule = setTimeout, clear = clearTimeout, onFailure = () => {}) {
        let index = 0;
        let timer = null;
        let motion = null;
        let generation = 0;
        let disposed = false;
        const blockers = new Set(['offscreen', 'loading']);
        function interrupt() {
            generation++;
            if (timer !== null) clear(timer);
            timer = null;
            if (motion) motion.cancel();
            motion = null;
        }
        function arm() {
            if (disposed || blockers.size || timer !== null || motion) return;
            timer = schedule(() => {
                timer = null;
                const previous = index;
                index = (index + 1) % 3;
                const token = ++generation;
                try { motion = move(previous, index); }
                catch (_) { blockers.add('failed'); onFailure(); return; }
                Promise.resolve(motion.finished).then(() => {
                    if (disposed || token !== generation) return;
                    motion.cancel();
                    motion = null;
                    arm();
                }, () => {
                    if (disposed || token !== generation) return;
                    interrupt();
                    blockers.add('failed');
                    onFailure();
                });
            }, REST);
        }
        return {
            get index() { return index; },
            setBlocked(reason, blocked) {
                if (disposed || blockers.has(reason) === blocked) return;
                if (blocked) { blockers.add(reason); interrupt(); }
                else blockers.delete(reason);
                arm();
            },
            restart() { interrupt(); arm(); },
            destroy() { disposed = true; interrupt(); }
        };
    }

    function init(root, win, doc) {
        const photos = [...root.querySelectorAll(':scope > img')];
        const toggle = root.querySelector('.collage-motion-toggle');
        if (photos.length !== 3 || !toggle || !win.IntersectionObserver ||
            !win.matchMedia || photos.some(photo => typeof photo.animate !== 'function')) return null;
        const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
        const cleanups = [];
        let userPaused = false;
        let failed = false;
        let disposed = false;
        function listen(target, type, fn) {
            target.addEventListener(type, fn);
            cleanups.push(() => target.removeEventListener(type, fn));
        }
        function render(featured) {
            photos.forEach((photo, i) => {
                const slot = slotFor(i, featured);
                Object.assign(photo.style, SLOTS[slot], { zIndex: slot === 0 ? '2' : '1' });
            });
        }
        const cycle = createCycle((previous, next) => {
            // Bounded absolute frame interpolation preserves object-fit's uniform
            // image scale/crop, unlike non-uniform image transforms. No layout reads.
            render(next);
            const animations = [];
            try {
                photos.forEach((photo, i) => animations.push(photo.animate([
                    SLOTS[slotFor(i, previous)], SLOTS[slotFor(i, next)]
                ], { duration: DURATION, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })));
            } catch (error) {
                animations.forEach(animation => {
                    animation.finished.catch(() => {});
                    animation.cancel();
                });
                throw error;
            }
            return {
                finished: Promise.all(animations.map(animation => animation.finished)),
                cancel: () => animations.forEach(animation => animation.cancel())
            };
        }, win.setTimeout.bind(win), win.clearTimeout.bind(win), fail);
        function label() {
            toggle.textContent = userPaused ? root.dataset.resumeLabel : root.dataset.pauseLabel;
            toggle.hidden = failed || reduced.matches || !photos.every(photo => photo.complete && photo.naturalWidth > 0);
        }
        function fail() {
            failed = true;
            cycle.setBlocked('failed', true);
            toggle.hidden = true;
        }
        function loaded() {
            if (disposed || failed) return;
            if (photos.some(photo => photo.complete && photo.naturalWidth === 0)) { fail(); return; }
            const ready = photos.every(photo => photo.complete && photo.naturalWidth > 0);
            cycle.setBlocked('loading', !ready);
            label();
        }
        const observer = new win.IntersectionObserver(entries => {
            for (const entry of entries) if (entry.target === root) cycle.setBlocked('offscreen', !entry.isIntersecting);
        }, { threshold: 0 });
        observer.observe(root);
        cycle.setBlocked('hidden', doc.hidden);
        cycle.setBlocked('reduced', reduced.matches);
        listen(toggle, 'click', () => {
            userPaused = !userPaused;
            cycle.setBlocked('user', userPaused);
            label();
        });
        listen(root, 'focusin', () => cycle.setBlocked('focus', true));
        listen(root, 'focusout', event => {
            if (!root.contains(event.relatedTarget)) cycle.setBlocked('focus', false);
        });
        listen(doc, 'visibilitychange', () => cycle.setBlocked('hidden', doc.hidden));
        listen(win, 'resize', () => cycle.restart());
        const preferenceChanged = () => {
            cycle.setBlocked('reduced', reduced.matches);
            label();
        };
        if (reduced.addEventListener) listen(reduced, 'change', preferenceChanged);
        else if (reduced.addListener) {
            reduced.addListener(preferenceChanged);
            cleanups.push(() => reduced.removeListener(preferenceChanged));
        }
        function destroy() {
            if (disposed) return;
            disposed = true;
            cycle.destroy();
            observer.disconnect();
            cleanups.splice(0).forEach(cleanup => cleanup());
            toggle.hidden = true;
        }
        listen(win, 'pagehide', event => {
            if (event.persisted) cycle.setBlocked('pagehide', true);
            else destroy();
        });
        listen(win, 'pageshow', () => {
            cycle.setBlocked('hidden', doc.hidden);
            cycle.setBlocked('reduced', reduced.matches);
            cycle.setBlocked('pagehide', false);
            loaded();
        });
        photos.forEach(photo => {
            listen(photo, 'load', loaded);
            listen(photo, 'error', fail);
        });
        loaded();
        return { cycle, destroy };
    }
    if (typeof module !== 'undefined') module.exports = { REST, DURATION, SLOTS, slotFor, createCycle, init };
    if (typeof document === 'undefined') return;
    document.querySelectorAll('[data-treatment-collage]').forEach(root => init(root, window, document));
})();
