(() => {
    const panel = document.getElementById('ilux');
    const video = panel?.querySelector('.treatment-ilux-video');
    if (!video) return;

    const pauseWhenHidden = () => {
        if (panel.hidden) video.pause();
    };

    new MutationObserver(pauseWhenHidden).observe(panel, {
        attributes: true,
        attributeFilter: ['hidden']
    });
    pauseWhenHidden();
})();
