(() => {
    'use strict';

    const panel = document.querySelector('#uv[data-treatment-detail="uv"]');
    if (!panel) return;
    const video = panel.querySelector('[data-uv-video]');
    const photo = panel.querySelector('.treatment-uv-photo');
    const controls = panel.querySelector('[data-uv-controls]');
    const playButton = panel.querySelector('[data-uv-play]');
    const soundButton = panel.querySelector('[data-uv-sound]');
    const fallback = panel.querySelector('[data-uv-fallback]');
    // Leave native controls intact when the complete enhancement cannot initialize.
    if (!video || !photo || !controls || !playButton || !soundButton || !fallback ||
        typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let onscreen = false;
    let owner = null;
    let manualPause = false;
    let failed = false;
    let generation = 0;
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
    const stop = () => {
        generation++;
        owner = null;
        video.pause();
        sync();
    };
    const start = requestedOwner => {
        if (!eligible()) return;
        owner = requestedOwner;
        if (owner === 'hover') video.muted = true;
        const ticket = ++generation;
        const rejected = () => { if (ticket === generation) stop(); };
        try {
            const pending = video.play();
            if (pending && typeof pending.then === 'function') {
                pending.then(() => {
                    // A late promise never resurrects cancelled playback; a newer valid request owns it.
                    if (!owner || !eligible()) stop();
                    else sync();
                }, rejected);
            }
        } catch { rejected(); }
        sync();
    };
    photo.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch' || !finePointer.matches || reducedMotion.matches || manualPause || owner === 'manual') return;
        start('hover');
    });
    photo.addEventListener('pointerleave', () => { if (owner === 'hover') stop(); });
    playButton.addEventListener('click', () => {
        if (failed) return;
        if (owner || !video.paused) { manualPause = true; stop(); }
        else { manualPause = false; start('manual'); }
    });
    soundButton.addEventListener('click', () => { if (!failed) { video.muted = !video.muted; sync(); } });
    for (const event of ['play', 'pause', 'volumechange']) video.addEventListener(event, sync);
    video.addEventListener('ended', () => { owner = null; generation++; sync(); });
    const mediaError = () => {
        failed = true;
        stop();
        video.hidden = true;
        fallback.hidden = false;
        controls.hidden = true;
    };
    video.addEventListener('error', mediaError);
    video.querySelector?.('source')?.addEventListener('error', mediaError);
    new IntersectionObserver(entries => {
        onscreen = entries[0].isIntersecting;
        if (!eligible()) stop();
    }).observe(photo);
    new MutationObserver(() => { if (!eligible()) stop(); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    document.addEventListener('visibilitychange', () => { if (!eligible()) stop(); });
    window.addEventListener('pagehide', stop);
    const preferenceChanged = () => { if (owner === 'hover' && (reducedMotion.matches || !finePointer.matches)) stop(); };
    reducedMotion.addEventListener?.('change', preferenceChanged);
    finePointer.addEventListener?.('change', preferenceChanged);

    video.muted = true;
    video.controls = false;
    photo.classList.add('treatment-uv-enhanced');
    controls.hidden = false;
    sync();
})();
