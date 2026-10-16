(() => {
    'use strict';
    const panel = document.querySelector('#antirraya[data-treatment-detail="antirraya"]');
    if (!panel) return;
    const video = panel.querySelector('[data-antirraya-video]');
    const photo = panel.querySelector('.treatment-antirraya-photo');
    const controls = panel.querySelector('[data-antirraya-controls]');
    const playButton = panel.querySelector('[data-antirraya-play]');
    const soundButton = panel.querySelector('[data-antirraya-sound]');
    const fallback = panel.querySelector('[data-antirraya-fallback]');
    // Native controls remain usable if this complete enhancement cannot initialize.
    if (!video || !photo || !controls || !playButton || !soundButton || !fallback ||
        typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let onscreen = false;
    let manualPause = false;
    let autoBlocked = false;
    let failed = false;
    let manualPlaying = false;
    let generation = 0;
    let requested = false;
    const eligible = () => !failed && onscreen && !panel.hidden && !document.hidden;
    const sync = () => {
        const playing = !video.paused;
        const playLabel = playing ? playButton.dataset.pauseLabel : playButton.dataset.playLabel;
        const soundLabel = video.muted ? soundButton.dataset.unmuteLabel : soundButton.dataset.muteLabel;
        playButton.textContent = playLabel;
        playButton.setAttribute('aria-label', playLabel);
        playButton.setAttribute('aria-pressed', String(playing));
        soundButton.textContent = soundLabel;
        soundButton.setAttribute('aria-label', soundLabel);
        soundButton.setAttribute('aria-pressed', String(!video.muted));
    };
    const stop = () => { generation++; requested = false; manualPlaying = false; video.pause(); sync(); };
    const start = manual => {
        if (!eligible()) return;
        manualPlaying = manual;
        requested = true;
        const ticket = ++generation;
        const rejected = () => {
            if (ticket !== generation) return;
            autoBlocked = true;
            stop();
        };
        try {
            const pending = video.play();
            if (pending && typeof pending.then === 'function') pending.then(() => {
                // Late completion cannot resurrect playback after a lifecycle cancellation.
                if (!eligible() || !requested || (ticket !== generation && manualPause)) stop();
                else sync();
            }, rejected);
        } catch { rejected(); }
        sync();
    };
    const reconcile = () => {
        if (!eligible()) stop();
        else if (video.paused && video.muted && !manualPause && !autoBlocked && !reducedMotion.matches) start(false);
    };
    playButton.addEventListener('click', () => {
        if (failed) return;
        if (!video.paused) { manualPause = true; stop(); }
        else { manualPause = false; autoBlocked = false; start(true); }
    });
    soundButton.addEventListener('click', () => { if (!failed) { video.muted = !video.muted; sync(); } });
    for (const event of ['play', 'pause', 'volumechange']) video.addEventListener(event, sync);
    const mediaError = () => {
        failed = true;
        stop();
        video.hidden = true;
        fallback.hidden = false;
        controls.hidden = true;
    };
    video.addEventListener('error', mediaError);
    video.querySelector?.('source')?.addEventListener('error', mediaError);
    // Disable browser-owned autoplay only after enhancement takes ownership, so reduced motion
    // and lifecycle gates cannot be bypassed. The loop and original audio bytes are retained.
    video.autoplay = false;
    video.defaultMuted = true;
    video.muted = true;
    stop();
    new IntersectionObserver(entries => { onscreen = entries[0].isIntersecting; reconcile(); }).observe(photo);
    new MutationObserver(reconcile).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    document.addEventListener('visibilitychange', reconcile);
    window.addEventListener('pagehide', stop);
    reducedMotion.addEventListener?.('change', () => {
        if (reducedMotion.matches && !manualPlaying) stop();
        else reconcile();
    });
    video.controls = false;
    controls.hidden = false;
    sync();
})();
