(() => {
    'use strict';
    const videos = [...document.querySelectorAll('[data-treatment-video]')];
    if (!videos.length) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = window.matchMedia('(max-width: 767.98px)');
    let pageHidden = false;
    let foreground = true;
    const players = videos.map(video => {
        const panel = video.closest('[data-treatment-detail]');
        const photo = video.closest('[data-treatment-media]');
        const fallback = panel.querySelector('[data-treatment-fallback]');
        const immediate = panel.id === 'blue-tech';
        const observed = Boolean(window.IntersectionObserver && photo);
        let near = false;
        let visible = false;
        let loaded = false;
        let started = false;
        let pending = false;
        let failed = false;
        let generation = 0;
        const allowed = () => !panel.hidden && !document.hidden && !pageHidden && foreground && !motion.matches && !failed;
        const eligible = () => allowed() && visible && loaded;
        const enforceSilent = () => {
            video.controls = false;
            video.removeAttribute('controls');
            video.autoplay = false; // Only this lifecycle owns playback, never native eager autoplay.
            video.muted = true;
            video.defaultMuted = true;
            video.playsInline = true;
        };
        const showPoster = () => {
            video.hidden = !eligible() || (!started && !pending);
            // Keep the authentic preview over a renderable pending player.
            if (fallback) fallback.hidden = immediate
                ? observed && !motion.matches && !failed
                : started && eligible();
        };
        const sync = () => {
            enforceSilent();
            if (allowed() && observed && (near || immediate) && !loaded) {
                // Choose once; never redownload on scroll/resize or panel reselection.
                video.src = smallScreen.matches ? video.dataset.treatmentMobile : video.dataset.treatmentDesktop;
                video.preload = immediate ? 'auto' : 'metadata';
                loaded = true;
                video.load();
            }
            showPoster();
            if (!eligible()) {
                if (pending) { generation++; pending = false; }
                video.pause();
                return;
            }
            if (pending || !video.paused || (video.ended && !video.loop)) return;
            pending = true;
            showPoster(); // Render before play(): some browsers gate hidden media.
            const request = ++generation;
            let attempt;
            try { attempt = video.play(); }
            catch (error) {
                pending = false;
                if (error?.name === 'AbortError') { video.pause(); started = false; showPoster(); return; }
                failed = true; sync(); return;
            }
            Promise.resolve(attempt).then(() => {
                if (request !== generation) { if (!eligible()) video.pause(); return; }
                pending = false;
                if (!eligible()) video.pause();
                else { started = true; showPoster(); }
            }, error => {
                if (request !== generation) return;
                pending = false;
                // External interruptions are transient: wait for a lifecycle event, never poll.
                if (error?.name === 'AbortError') { video.pause(); started = false; showPoster(); return; }
                failed = true;
                sync();
            });
        };
        video.addEventListener('error', () => { failed = true; sync(); });
        video.addEventListener('playing', () => {
            if (!eligible()) { video.pause(); showPoster(); return; }
            started = true;
            showPoster();
        });
        video.addEventListener('play', () => { enforceSilent(); if (!eligible()) video.pause(); });
        video.addEventListener('volumechange', enforceSilent);
        new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
        // Observe the always-sized photo band, not the initially hidden video.
        sync(); // Selected Blue prepares before observers; other players remain lazy.
        if (observed) {
            new window.IntersectionObserver(entries => {
                near = entries[entries.length - 1].isIntersecting;
                sync();
            }, { rootMargin: '240px 0px', threshold: 0 }).observe(photo);
            new window.IntersectionObserver(entries => {
                visible = entries[entries.length - 1].isIntersecting;
                sync();
            }, { threshold: 0.01 }).observe(photo);
        }
        // Without IntersectionObserver retain a static authentic poster, not eager downloads.
        sync();
        return sync;
    });
    const syncAll = () => players.forEach(sync => sync());
    document.addEventListener('visibilitychange', syncAll);
    window.addEventListener('blur', () => { foreground = false; syncAll(); });
    window.addEventListener('focus', () => { foreground = true; syncAll(); });
    window.addEventListener('pagehide', () => { pageHidden = true; syncAll(); });
    window.addEventListener('pageshow', () => { pageHidden = false; syncAll(); });
    if (motion.addEventListener) motion.addEventListener('change', syncAll);
    else motion.addListener(syncAll);
})();
