(() => {
    const cards = document.querySelectorAll('.prg-related [data-related-card]');
    if (!cards.length) return;
    const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');

    for (const card of cards) {
        let hovering = false;
        const summary = card.querySelector('summary');
        card.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'mouse' || !finePointer.matches) return;
            hovering = true;
            card.open = true;
        });
        card.addEventListener('pointerleave', event => {
            if (event.pointerType !== 'mouse') return;
            hovering = false;
            if (!card.contains(document.activeElement)) card.open = false;
        });
        card.addEventListener('focusout', event => {
            if (!hovering && !card.contains(event.relatedTarget)) card.open = false;
        });
        card.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !card.open) return;
            event.preventDefault();
            card.open = false;
            summary.focus();
        });
    }

    document.addEventListener('pointerdown', event => {
        for (const card of cards) {
            if (!card.contains(event.target)) card.open = false;
        }
    });
    // Summary retains native click, Enter and Space handling, including without JS.
})();
