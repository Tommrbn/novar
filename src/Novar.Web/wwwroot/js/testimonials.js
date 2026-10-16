/* User-requested carousel. Timing is an implementation default, not a Figma timeline. */
(() => {
    'use strict';
    const INTERVAL = 5000;
    const DURATION = 600;
    const EASING = 'cubic-bezier(.22, .61, .36, 1)';

    function positions(viewport, active) {
        const compact = viewport < 640;
        const side = compact ? viewport - 24 : (viewport - 64) / 4;
        const main = compact ? side : side * 2;
        return Array.from({ length: 3 }, (_, index) => {
            const distance = (index - active + 4) % 3 - 1;
            const width = distance === 0 ? main : side;
            const left = compact ? 12 + distance * (width + 20)
                : distance === 0 ? (viewport - width) / 2 : distance < 0 ? 12 : viewport - width - 12;
            return { distance, width, left, opacity: distance === 0 ? 1 : .3 };
        });
    }

    function keyframes(from, to, viewport, direction) {
        const frame = (layout, offset) => ({
            transform: `translate(${layout.left}px, -50%)`,
            width: `${layout.width}px`, opacity: layout.opacity, offset
        });
        if (Math.abs(from.distance - to.distance) < 2) return [frame(from, 0), frame(to, 1)];
        // Wrap outside the viewport while invisible, never through the selected card.
        const exit = direction > 0 ? -from.width - 24 : viewport + 24;
        const enter = direction > 0 ? viewport + 24 : -to.width - 24;
        return [frame(from, 0), frame({ ...from, left: exit, opacity: 0 }, .4),
            frame({ ...to, left: enter, opacity: 0 }, .5), frame(to, 1)];
    }

    function reserveCardHeight(cards, widths) {
        let height = 0;
        cards.forEach(card => {
            card.style.removeProperty('min-height');
            card.style.removeProperty('height');
            widths.forEach(width => {
                card.style.width = `${width}px`;
                height = Math.max(height, card.offsetHeight);
            });
        });
        cards.forEach(card => { card.style.minHeight = `${height}px`; });
        return height;
    }

    function createRotation(onChange, schedule = setTimeout, cancel = clearTimeout) {
        let index = 1;
        let timer = null;
        let disposed = false;
        const blockers = new Set(['offscreen']);
        function sync() {
            if (timer !== null) cancel(timer);
            timer = null;
            if (disposed || blockers.size) return;
            timer = schedule(() => { timer = null; advance(1, false); }, INTERVAL);
        }
        function advance(direction, manual) {
            if (disposed) return;
            index = (index + direction + 3) % 3;
            onChange(index, direction, manual);
            sync();
        }
        return {
            get index() { return index; },
            step(direction) { advance(direction < 0 ? -1 : 1, true); },
            setBlocked(reason, blocked) {
                if (blockers.has(reason) === blocked) return;
                if (blocked) blockers.add(reason); else blockers.delete(reason);
                sync();
            },
            destroy() { disposed = true; sync(); }
        };
    }

    if (typeof module !== 'undefined') module.exports = { positions, keyframes, createRotation, reserveCardHeight, INTERVAL, DURATION };
    if (typeof document === 'undefined') return;
    const root = document.querySelector('[data-testimonial-carousel]');
    if (!root) return;
    const stage = root.querySelector('.testimonial-grid');
    const cards = [...stage.children];
    if (cards.length !== 3) return;
    const controls = root.querySelector('.testimonial-controls');
    const toggle = root.querySelector('.testimonial-motion-toggle');
    const status = root.querySelector('[data-testimonial-status]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const events = new AbortController();
    let paused = false;
    let disposed = false;
    let layout = null;
    let animations = [];
    let generation = 0;
    let queuedDirection = 0;
    let measuredWidth = 0;

    function stopAnimations() {
        generation++;
        animations.forEach(animation => animation.cancel());
        animations = [];
        queuedDirection = 0;
        rotation.setBlocked('animation', false);
    }

    function render(index, direction = 1, manual = false, animate = true) {
        stopAnimations();
        const next = positions(stage.clientWidth, index);
        const shouldAnimate = animate && layout && !reduced.matches && typeof cards[0].animate === 'function';
        cards.forEach((card, i) => {
            const position = next[i];
            card.classList.toggle('is-active', i === index);
            card.style.width = `${position.width}px`;
            card.style.transform = `translate(${position.left}px, -50%)`;
            card.style.opacity = String(position.opacity);
            if (shouldAnimate) animations.push(card.animate(keyframes(layout[i], position, stage.clientWidth, direction),
                { duration: DURATION, easing: EASING }));
        });
        layout = next;
        root.dataset.activeIndex = String(index);
        if (manual) status.textContent = window.NovarText('testimonials.position', '{index} de {total}: {quote}', {
            index: index + 1, total: cards.length, quote: cards[index].querySelector('p').textContent
        });
        if (animations.length) {
            const current = generation;
            rotation.setBlocked('animation', true);
            Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => {
                if (disposed || current !== generation) return;
                animations = [];
                rotation.setBlocked('animation', false);
                if (queuedDirection) {
                    const direction = queuedDirection;
                    queuedDirection = 0;
                    rotation.step(direction);
                }
            });
        }
    }

    const rotation = createRotation(render);
    function measure() {
        if (disposed || stage.clientWidth === 0) return;
        stopAnimations();
        measuredWidth = stage.clientWidth;
        // Reserve the tallest possible card at either width; selecting a short card never shifts the page.
        const widths = [...new Set(positions(measuredWidth, 1).map(position => position.width))];
        const height = reserveCardHeight(cards, widths);
        stage.style.height = `${height + 32}px`;
        render(rotation.index, 1, false, false);
    }
    function refresh() {
        rotation.setBlocked('reduced', reduced.matches);
        rotation.setBlocked('hidden', document.hidden);
        rotation.setBlocked('hover', pointer.matches && root.matches(':hover'));
        rotation.setBlocked('focus', root.contains(document.activeElement));
        toggle.hidden = reduced.matches;
        measure();
    }
    function listen(target, type, handler) {
        target.addEventListener(type, handler, { signal: events.signal });
    }
    function move(direction) {
        if (animations.length) queuedDirection = direction;
        else rotation.step(direction);
    }

    root.classList.add('is-enhanced');
    root.setAttribute('aria-roledescription', 'carrusel');
    controls.hidden = false;
    listen(root.querySelector('[data-testimonial-previous]'), 'click', () => move(-1));
    listen(root.querySelector('[data-testimonial-next]'), 'click', () => move(1));
    listen(toggle, 'click', () => {
        paused = !paused;
        toggle.textContent = window.NovarText(paused ? 'testimonials.resume' : 'testimonials.pause', paused ? 'Reanudar experiencias' : 'Pausar experiencias');
        toggle.setAttribute('aria-pressed', String(paused));
        rotation.setBlocked('user', paused);
    });
    listen(root, 'pointerenter', () => rotation.setBlocked('hover', pointer.matches));
    listen(root, 'pointerleave', () => rotation.setBlocked('hover', false));
    listen(root, 'focusin', () => rotation.setBlocked('focus', true));
    listen(root, 'focusout', event => rotation.setBlocked('focus', root.contains(event.relatedTarget)));
    listen(document, 'visibilitychange', () => rotation.setBlocked('hidden', document.hidden));
    listen(reduced, 'change', refresh);
    listen(pointer, 'change', refresh);
    const visible = window.IntersectionObserver ? new IntersectionObserver(entries => {
        rotation.setBlocked('offscreen', !entries[0].isIntersecting || entries[0].intersectionRatio < .2);
    }, { threshold: .2 }) : null;
    const resize = window.ResizeObserver ? new ResizeObserver(() => {
        if (stage.clientWidth !== measuredWidth) measure();
    }) : null;
    // Without intersection evidence the manual carousel works, but autoplay stays safely blocked.
    visible?.observe(root);
    resize?.observe(stage);
    if (!resize) listen(window, 'resize', measure);
    refresh();
    document.fonts?.ready.then(() => { if (!disposed) measure(); });
    listen(window, 'pagehide', event => {
        rotation.setBlocked('pagehide', true);
        stopAnimations();
        if (event.persisted) return;
        disposed = true;
        rotation.destroy();
        visible?.disconnect();
        resize?.disconnect();
        events.abort();
    });
    listen(window, 'pageshow', () => {
        rotation.setBlocked('offscreen', true);
        refresh();
        visible?.unobserve(root);
        visible?.observe(root);
        rotation.setBlocked('pagehide', false);
    });
})();
