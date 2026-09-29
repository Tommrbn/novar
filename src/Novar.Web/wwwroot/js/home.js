/* User-requested motion; durations are implementation defaults, not a Figma timeline. */
(() => {
    'use strict';
    const INTERVAL = 3200;

    function positions(heights, active, gap = 24) {
        const count = heights.length;
        const result = Array(count);
        result[active] = { top: -heights[active] / 2, distance: 0 };
        let above = result[active].top;
        let below = above + heights[active];
        for (let distance = 1; distance <= Math.floor(count / 2); distance++) {
            const previous = (active - distance + count) % count;
            const next = (active + distance) % count;
            above -= heights[previous] + gap;
            result[previous] = { top: above, distance: -distance };
            result[next] = { top: below + gap, distance };
            below += heights[next] + gap;
        }
        return result;
    }

    function createRotation(count, onChange, schedule = setTimeout, cancel = clearTimeout) {
        let index = 3;
        let timer = null;
        let disposed = false;
        const blockers = new Set(['offscreen']);
        function sync() {
            if (timer !== null) cancel(timer);
            timer = null;
            if (disposed || blockers.size) return;
            timer = schedule(() => {
                timer = null;
                index = (index + 1) % count;
                onChange(index);
                sync();
            }, INTERVAL);
        }
        return {
            get index() { return index; },
            setBlocked(reason, blocked) {
                if (blockers.has(reason) === blocked) return;
                if (blocked) blockers.add(reason); else blockers.delete(reason);
                sync();
            },
            destroy() { disposed = true; sync(); }
        };
    }

    if (typeof module !== 'undefined') module.exports = { positions, createRotation, INTERVAL };
    if (typeof document === 'undefined') return;
    const root = document.querySelector('[data-sophia-carousel]');
    if (!root || !window.IntersectionObserver || !window.ResizeObserver) return;
    const list = root.querySelector('.sophia-question-list');
    const items = [...list.children];
    const toggle = root.querySelector('.sophia-motion-toggle');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = window.matchMedia('(max-width: 991px)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const events = new AbortController();
    let userPaused = false;
    let frame = 0;

    function render(index, animate = true) {
        const previousIndex = Number(root.dataset.activeIndex);
        const selectionChanged = Number.isInteger(previousIndex) && previousIndex !== index;
        items.forEach((item, i) => item.classList.toggle('selected', i === index));
        root.dataset.activeIndex = String(index);
        if (!animate) items.forEach(item => item.classList.remove('sophia-glint'));
        else if (selectionChanged) {
            const selected = items[index];
            selected.classList.remove('sophia-glint');
            void selected.offsetWidth;
            selected.classList.add('sophia-glint');
        }
        if (!root.classList.contains('is-enhanced')) {
            items.forEach(item => {
                item.style.removeProperty('transform');
                item.style.removeProperty('opacity');
                delete item.dataset.distance;
            });
            return;
        }
        const layout = positions(items.map(item => item.offsetHeight), index);
        layout.forEach(({ top, distance }, i) => {
            const item = items[i];
            const wrapped = Math.abs(Number(item.dataset.distance) - distance) > 1;
            item.classList.toggle('is-resetting', !animate || wrapped);
            item.style.transform = `translateY(${list.clientHeight / 2 + top}px)`;
            item.style.opacity = String([1, .8, .4, 0][Math.abs(distance)]);
            item.dataset.distance = String(distance);
        });
        // Commit wrapped, invisible edge items without sliding them across the center.
        void list.offsetHeight;
        items.forEach(item => item.classList.remove('is-resetting'));
    }

    const rotation = createRotation(items.length, render);
    function refresh() {
        const enhanced = !reducedMotion.matches && !smallScreen.matches;
        root.classList.toggle('is-enhanced', enhanced);
        toggle.hidden = !enhanced;
        rotation.setBlocked('static', !enhanced);
        render(rotation.index, false);
    }
    function listen(target, type, handler) {
        target.addEventListener(type, handler, { signal: events.signal });
    }
    listen(toggle, 'click', () => {
        userPaused = !userPaused;
        toggle.textContent = userPaused ? 'Reanudar preguntas' : 'Pausar preguntas';
        rotation.setBlocked('user', userPaused);
    });
    listen(root, 'animationend', event => {
        if (event.animationName === 'sophia-selection-glint') event.target.classList.remove('sophia-glint');
    });
    listen(root, 'pointerenter', () => rotation.setBlocked('hover', pointer.matches));
    listen(root, 'pointerleave', () => rotation.setBlocked('hover', false));
    listen(root, 'focusin', () => rotation.setBlocked('focus', true));
    listen(root, 'focusout', event => rotation.setBlocked('focus', root.contains(event.relatedTarget)));
    listen(document, 'visibilitychange', () => rotation.setBlocked('hidden', document.hidden));
    listen(reducedMotion, 'change', refresh);
    listen(smallScreen, 'change', refresh);
    const visible = new IntersectionObserver(entries => {
        rotation.setBlocked('offscreen', !entries[0].isIntersecting || entries[0].intersectionRatio < .2);
    }, { threshold: .2 });
    const resize = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => render(rotation.index, false));
    });
    rotation.setBlocked('hidden', document.hidden);
    refresh();
    visible.observe(root);
    resize.observe(list);
    document.fonts.ready.then(() => render(rotation.index, false));
    listen(window, 'pagehide', event => {
        rotation.setBlocked('pagehide', true);
        if (event.persisted) return;
        rotation.destroy();
        visible.disconnect();
        resize.disconnect();
        cancelAnimationFrame(frame);
        events.abort();
    });
    listen(window, 'pageshow', () => rotation.setBlocked('pagehide', false));
})();
