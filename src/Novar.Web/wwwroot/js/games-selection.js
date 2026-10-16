(function (root) {
    'use strict';

    function createSelection({ grid, cards, featuredLabel, reducedMotion, onSelect, onSettled = () => {} }) {
        const entries = cards.map(card => ({
            card,
            button: card.querySelector('[data-game-card]'),
            badge: card.querySelector('.game-card-badge'),
            originalBadge: card.querySelector('.game-card-badge').textContent
        }));
        let revision = 0;
        let animations = [];

        function highlight(id) {
            entries.forEach(({ card, button, badge, originalBadge }) => {
                const selected = button.dataset.gameCard === id;
                card.classList.toggle('game-card-featured', selected);
                button.setAttribute('aria-pressed', String(selected));
                badge.textContent = selected ? featuredLabel : originalBadge;
                // Intruso has no inactive category in the original content.
                badge.style.visibility = !selected && button.dataset.gameCard === 'intruso' ? 'hidden' : '';
            });
        }

        function animate(card, frames, duration) {
            try {
                const animation = card.animate(frames, { duration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
                animations.push(animation);
                return animation.finished.catch(() => {});
            } catch {
                return Promise.resolve();
            }
        }

        function reorder(selected, token) {
            if (token !== revision) return;
            const siblings = entries.filter(entry => entry !== selected);
            const desired = [siblings[0], selected, siblings[1]];
            const doc = selected.button.ownerDocument;
            const focused = doc.activeElement;
            const keepFocus = entries.some(entry => entry.card.contains(focused)) && typeof focused?.focus === 'function';
            if (desired.some((entry, index) => grid.children[index] !== entry.card)) {
                desired.forEach(entry => grid.append(entry.card));
                // The user may have tabbed to another card during squash. Restore only
                // that current element when moving nodes loses focus, never outside focus.
                if (token === revision && keepFocus && (doc.activeElement == null || doc.activeElement === doc.body)) {
                    focused.focus({ preventScroll: true });
                }
            }
        }

        async function select(id) {
            const selected = entries.find(entry => entry.button.dataset.gameCard === id);
            if (!selected) return;
            const token = ++revision;
            animations.forEach(animation => { try { animation.cancel(); } catch { /* Already settled. */ } });
            animations = [];
            highlight(id);
            onSelect(id);
            if (reducedMotion() || entries.some(entry => typeof entry.card.animate !== 'function')) {
                reorder(selected, token);
                if (token === revision) onSettled(id);
                return;
            }
            await animate(selected.card, [
                { transform: 'scale(1, 1)' },
                { transform: 'scale(1.025, .94)', offset: .55 },
                { transform: 'scale(1, 1)' }
            ], 120);
            if (token !== revision) return;
            const before = entries.map(entry => entry.card.getBoundingClientRect());
            reorder(selected, token);
            await Promise.all(entries.map((entry, index) => {
                const after = entry.card.getBoundingClientRect();
                const x = before[index].left - after.left;
                const y = before[index].top - after.top;
                if (!x && !y) return Promise.resolve();
                return animate(entry.card, [
                    { transform: `translate(${x}px, ${y}px)` },
                    { transform: 'translate(0, 0)' }
                ], 300);
            }));
            if (token === revision) {
                animations = [];
                onSettled(id);
            }
        }

        highlight('intruso');
        return { select };
    }

    const api = { createSelection };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.NovarGamesSelection = api;
})(typeof window === 'object' ? window : globalThis);
