(() => {
    if (typeof window.matchMedia !== 'function' ||
        typeof window.requestAnimationFrame !== 'function' ||
        typeof window.cancelAnimationFrame !== 'function') return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (typeof motion.addEventListener !== 'function') return;

    const pending = new Set();
    let frame = null;

    function cleanup() {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        window.removeEventListener('pagehide', onPageHide);
        motion.removeEventListener('change', check);
        if (frame !== null) window.cancelAnimationFrame(frame);
        frame = null;
    }

    function check() {
        for (const band of pending) {
            // Every product band immediately follows its hero. Reveal once half
            // of that banner has scrolled past, not when the whole hero is gone.
            // Measure again on resize so tall mobile and wide desktop heroes agree.
            const hero = band.previousElementSibling?.getBoundingClientRect();
            const pastMidpoint = window.scrollY > 0 && hero && hero.top + hero.height * 0.5 <= 0;
            const reveal = !hero || hero.height <= 0 || pastMidpoint;
            band.setAttribute('data-tagline-state', reveal ? 'revealed' : 'covered');
        }
    }

    function schedule() {
        if (frame !== null) return;
        frame = window.requestAnimationFrame(() => {
            frame = null;
            check();
        });
    }

    function onPageHide(event) {
        if (!event.persisted) cleanup();
    }

    function initialize() {
        try {
            for (const band of document.querySelectorAll('[data-product-tagline]')) {
                pending.add(band);
                band.setAttribute('data-tagline-state', 'covered');
            }
            window.addEventListener('scroll', schedule, { passive: true });
            window.addEventListener('resize', schedule);
            window.addEventListener('pagehide', onPageHide);
            motion.addEventListener('change', check);
            check();
        } finally {
            document.documentElement.removeAttribute('data-tagline-pending');
        }
    }

    // This small local script runs in the head before the bands can paint.
    // Missing/unsupported scripts never opt in, so the original remains visible.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
        document.documentElement.setAttribute('data-tagline-pending', '');
    } else {
        initialize();
    }
})();
