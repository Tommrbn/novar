/* Shared product motion: a new composition every 2000 ms; no visible navigation. */
(function () {
    "use strict";

    const INTERVAL = 2000;
    const DURATION = 650;
    const mounted = new WeakMap();
    const modulo = (value) => (value % 4 + 4) % 4;
    const translate = typeof window !== "undefined" && typeof window.NovarText === "function"
        ? window.NovarText
        : (_key, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);

    // Positions belong to visual slots; the four original DOM/image identities never move.
    function layout(width, index, sharpOuter = false) {
        const compact = width < 1000;
        const widths = compact ? [155, 175, 175, 155] : [305.364, 344.462, 344.462, 305.364];
        const gap = compact ? 40 : 63.37;
        let x = (width - widths.reduce((sum, item) => sum + item, 0) - gap * 3) / 2;
        const slots = widths.map((item, slot) => {
            const outer = slot === 0 || slot === 3;
            const position = {
                slot, x, y: outer ? 0 : compact ? 30 : 71.46,
                width: item, height: compact ? (outer ? 210 : 235) : (outer ? 345.136 : 388.952),
                opacity: outer ? .5 : 1, filter: outer && !sharpOuter ? "blur(1.5px)" : "blur(0px)"
            };
            x += item + gap;
            return position;
        });
        return widths.map((_, identity) => slots[modulo(identity - index)]);
    }

    function style(position) {
        return {
            transform: `translate(${position.x}px, ${position.y}px)`,
            width: `${position.width}px`, height: `${position.height}px`,
            opacity: position.opacity, filter: position.filter
        };
    }

    function keyframes(from, to, width) {
        if (Math.abs(from.slot - to.slot) !== 3) return [style(from), style(to)];
        const leftward = from.slot === 0;
        const exit = { ...from, x: leftward ? -from.width : width, opacity: 0 };
        const entry = { ...to, x: leftward ? width : -to.width, opacity: 0 };
        return [
            { ...style(from), offset: 0 }, { ...style(exit), offset: .4 },
            { ...style(entry), offset: .6 }, { ...style(to), offset: 1 }
        ];
    }

    function createRotation(clock, onChange, interval = INTERVAL) {
        const blockers = new Set(["offscreen"]);
        let index = 0;
        let timer = null;
        let destroyed = false;
        function schedule() {
            if (timer !== null) clock.clearTimeout(timer);
            timer = null;
            if (!destroyed && blockers.size === 0) {
                timer = clock.setTimeout(() => advance(1, false), interval);
            }
        }
        function advance(direction, manual = true) {
            if (destroyed) return;
            index = modulo(index + direction);
            onChange(index, manual);
            schedule();
        }
        return {
            advance,
            block(reason, active) {
                if (destroyed || blockers.has(reason) === active) return;
                if (active) blockers.add(reason); else blockers.delete(reason);
                schedule();
            },
            get index() { return index; },
            isBlocked: (reason) => blockers.has(reason),
            destroy() {
                destroyed = true;
                if (timer !== null) clock.clearTimeout(timer);
                timer = null;
            }
        };
    }

    function initGallery(root, env) {
        if (mounted.has(root)) return mounted.get(root);
        const win = env.window;
        const doc = env.document;
        const track = root.querySelector("[data-gallery-track]") || root.querySelector(".prg-gallery-images");
        const controls = root.querySelector("[data-gallery-controls]");
        const pause = root.querySelector("[data-gallery-pause]");
        const pauseEnabled = root.getAttribute("data-gallery-pause-control") !== "false";
        const previous = root.querySelector("[data-gallery-previous]");
        const next = root.querySelector("[data-gallery-next]");
        const status = root.querySelector("[data-gallery-status]");
        const cards = track ? Array.from(track.children) : [];
        if (cards.length !== 4) return null;

        const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
        const lifecycle = new win.AbortController();
        let activeEvents;
        let intersection;
        let resize;
        let animations = [];
        let pendingDirection = 0;
        let width = track.getBoundingClientRect().width;
        let positions = layout(width, 0);
        let destroyed = false;
        let suspended = false;
        let generation = 0;
        let connection = 0;
        const sharpOuter = root.getAttribute("data-gallery-sharp-outer") === "true";

        function stopAnimations() {
            generation += 1;
            animations.forEach((animation) => animation.cancel());
            animations = [];
            pendingDirection = 0;
        }
        function render(index, manual, animate = true) {
            const before = positions;
            const after = layout(width, index, sharpOuter);
            stopAnimations();
            const current = generation;
            cards.forEach((card, identity) => {
                Object.assign(card.style, style(after[identity]));
                if (animate && !reduced.matches && typeof card.animate === "function") {
                    animations.push(card.animate(keyframes(before[identity], after[identity], width), {
                        duration: DURATION, easing: "ease-in-out"
                    }));
                }
            });
            positions = after;
            if (manual && status) status.textContent = translate('gallery.composition', 'Composición {index} de 4', { index: index + 1 });
            if (animations.length) {
                Promise.all(animations.map((animation) => animation.finished)).then(() => {
                    if (destroyed || current !== generation) return;
                    animations = [];
                    const direction = pendingDirection;
                    pendingDirection = 0;
                    if (direction) rotation.advance(direction);
                }).catch(() => { /* Cancelled by lifecycle, preference or resize. */ });
            }
        }
        const configuredInterval = Number(root.getAttribute("data-gallery-autoplay-interval"));
        const rotation = createRotation(win, render, configuredInterval > 0 ? configuredInterval : INTERVAL);
        function syncPause() {
            if (!pause) return;
            const paused = rotation.isBlocked("user");
            pause.setAttribute("aria-pressed", String(paused));
            pause.textContent = translate(paused ? 'gallery.resume' : 'gallery.pause', paused ? 'Reanudar' : 'Pausar');
        }
        function preference() {
            rotation.block("reduced", reduced.matches);
            if (reduced.matches) stopAnimations();
        }
        function manual(direction) {
            // Legacy galleries without a pause control stop autoplay on manual navigation.
            if (!pauseEnabled) rotation.block("user", true);
            if (animations.length) pendingDirection = direction;
            else rotation.advance(direction);
        }
        function connect() {
            const currentConnection = ++connection;
            activeEvents = new win.AbortController();
            const listen = (target, type, listener, options = {}) => target.addEventListener(type, listener, { ...options, signal: activeEvents.signal });
            function setOffscreen(offscreen) {
                rotation.block("offscreen", offscreen);
                if (offscreen) stopAnimations();
            }
            function checkVisibility() {
                if (destroyed || suspended || currentConnection !== connection) return;
                const rect = root.getBoundingClientRect();
                const visibleWidth = Math.max(0, Math.min(rect.right, win.innerWidth) - Math.max(rect.left, 0));
                const visibleHeight = Math.max(0, Math.min(rect.bottom, win.innerHeight) - Math.max(rect.top, 0));
                const area = rect.width * rect.height;
                setOffscreen(area <= 0 || visibleWidth * visibleHeight / area < .2);
            }
            if (previous) listen(previous, "click", () => manual(-1));
            if (next) listen(next, "click", () => manual(1));
            if (pause) listen(pause, "click", () => {
                const pausing = !rotation.isBlocked("user");
                rotation.block("user", pausing);
                // Explicit resume must work without moving keyboard focus off its button.
                if (!pausing) rotation.block("focus", false);
                stopAnimations();
                syncPause();
            });
            // These portraits have no pointer actions. Scrolling beneath a stationary
            // mouse (or a touch-generated pointerenter) must not silently pause them.
            listen(root, "focusin", () => {
                rotation.block("focus", true);
                stopAnimations();
            });
            listen(root, "focusout", (event) => rotation.block("focus", root.contains(event.relatedTarget)));
            listen(doc, "visibilitychange", () => {
                rotation.block("hidden", doc.hidden);
                if (doc.hidden) stopAnimations();
                else checkVisibility();
            });
            listen(reduced, "change", preference);
            rotation.block("hidden", doc.hidden);
            rotation.block("focus", root.contains(doc.activeElement));
            preference();
            if (win.IntersectionObserver) {
                intersection = new win.IntersectionObserver((entries) => {
                    if (destroyed || suspended || currentConnection !== connection) return;
                    entries.forEach((entry) => {
                        setOffscreen(!entry.isIntersecting || entry.intersectionRatio < .2);
                    });
                }, { threshold: .2 });
                intersection.observe(root);
            } else listen(win, "scroll", checkVisibility, { passive: true });
            function fit() {
                if (destroyed || suspended || currentConnection !== connection) return;
                const nextWidth = track.getBoundingClientRect().width;
                if (nextWidth !== width) {
                    width = nextWidth;
                    render(rotation.index, false, false);
                }
                checkVisibility();
            }
            if (win.ResizeObserver) {
                resize = new win.ResizeObserver(fit);
                resize.observe(track);
            } else listen(win, "resize", fit);
            // Seed visibility immediately, including reloads/history restores midway
            // down the page; do not wait indefinitely for an observer's first delivery.
            fit();
        }
        function disconnect() {
            connection += 1;
            activeEvents.abort();
            intersection?.disconnect();
            resize?.disconnect();
            stopAnimations();
        }
        function destroy() {
            if (destroyed) return;
            destroyed = true;
            disconnect();
            lifecycle.abort();
            rotation.destroy();
            cards.forEach((card) => card.removeAttribute("style"));
            root.classList.remove("is-enhanced");
            if (controls) controls.hidden = true;
            mounted.delete(root);
        }

        // Missing observers use a passive scroll fallback; missing JS keeps the original grid.
        root.classList.add("is-enhanced");
        render(0, false, false);
        if (controls) controls.hidden = false;
        syncPause();
        connect();
        win.addEventListener("pagehide", (event) => {
            if (!event.persisted) return destroy();
            suspended = true;
            rotation.block("lifecycle", true);
            disconnect();
        }, { signal: lifecycle.signal });
        win.addEventListener("pageshow", () => {
            if (!suspended || destroyed) return;
            suspended = false;
            connect();
            rotation.block("lifecycle", false);
        }, { signal: lifecycle.signal });
        const controller = { destroy, rotation };
        mounted.set(root, controller);
        return controller;
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = { INTERVAL, DURATION, layout, keyframes, createRotation, initGallery };
    }
    if (typeof document !== "undefined") {
        document.querySelectorAll("[data-progressive-gallery], [data-product-gallery]").forEach((root) => {
            initGallery(root, { window, document });
        });
    }
}());
