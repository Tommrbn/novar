const test = require('node:test');
const assert = require('node:assert/strict');
const { createSelection } = require('../../src/Novar.Web/wwwroot/js/games-selection.js');

function fixture({ motion = false, waapi = true, throws = false, onSettled = () => {} } = {}) {
    const doc = { activeElement: null };
    const animations = [];
    const calls = [];
    const grid = { children: [], append(card) {
        this.children = this.children.filter(item => item !== card);
        this.children.push(card);
        if (card.contains(doc.activeElement)) doc.activeElement = null;
    } };
    const cards = ['codigo', 'intruso', 'trivia'].map(id => {
        const classes = new Set(id === 'intruso' ? ['game-card-featured'] : []);
        const badge = { textContent: id === 'intruso' ? 'Featured' : id, style: {} };
        const button = { dataset: { gameCard: id }, attributes: {}, ownerDocument: doc,
            setAttribute(key, value) { this.attributes[key] = value; },
            focus(options) { assert.equal(options.preventScroll, true); doc.activeElement = this; } };
        const descendant = { focus: button.focus };
        const card = { button, badge, descendant, contains(node) { return node === button || node === descendant; },
            classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); }, contains(name) { return classes.has(name); } },
            querySelector(selector) { return selector === '[data-game-card]' ? button : badge; },
            getBoundingClientRect() { return { left: grid.children.indexOf(this) * 100, top: 0, width: 100, height: 200 }; } };
        if (waapi) card.animate = (frames, options) => {
            if (throws) throw new Error('unavailable');
            let resolve, reject;
            const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
            const animation = { finished, frames, options, resolve, reject, cancel() { this.cancelled = true; reject(new Error('cancelled')); } };
            animations.push(animation);
            return animation;
        };
        return card;
    });
    grid.children = [...cards];
    const selection = createSelection({ grid, cards, featuredLabel: 'Featured', reducedMotion: () => !motion, onSelect: id => calls.push(id), onSettled });
    return { selection, grid, cards, doc, animations, calls, order: () => grid.children.map(card => card.button.dataset.gameCard) };
}

test('default selection and every selected center preserve actual nodes and inactive badges', async () => {
    const f = fixture();
    assert.deepEqual(f.order(), ['codigo', 'intruso', 'trivia']);
    for (const [id, order] of [['codigo', ['intruso', 'codigo', 'trivia']], ['trivia', ['codigo', 'trivia', 'intruso']], ['intruso', ['codigo', 'intruso', 'trivia']]]) {
        const button = f.cards.find(card => card.button.dataset.gameCard === id).button;
        f.doc.activeElement = button;
        await f.selection.select(id);
        assert.deepEqual(f.order(), order);
        assert.equal(f.grid.children[1].button, button);
        assert.equal(f.doc.activeElement, button);
        assert.equal(f.cards.filter(card => card.classList.contains('game-card-featured')).length, 1);
        assert.equal(f.cards.filter(card => card.button.attributes['aria-pressed'] === 'true').length, 1);
        assert.equal(f.grid.children[1].badge.textContent, 'Featured');
        for (const card of f.cards.filter(card => card.button !== button)) {
            assert.equal(card.badge.textContent, card.button.dataset.gameCard === 'intruso' ? 'Featured' : card.button.dataset.gameCard);
            assert.equal(card.badge.style.visibility, card.button.dataset.gameCard === 'intruso' ? 'hidden' : '');
        }
    }
    assert.deepEqual(f.calls, ['codigo', 'trivia', 'intruso']);
});

test('same-card activation preserves sibling order and invokes only selection callback', async () => {
    const f = fixture();
    await f.selection.select('trivia');
    const nodes = [...f.grid.children];
    await f.selection.select('trivia');
    assert.deepEqual(f.grid.children, nodes);
    assert.deepEqual(f.calls, ['trivia', 'trivia']);
});

test('squash precedes FLIP and feedback is synchronous', async () => {
    const f = fixture({ motion: true });
    const done = f.selection.select('codigo');
    assert.deepEqual(f.calls, ['codigo']);
    assert.equal(f.cards[0].badge.textContent, 'Featured');
    assert.deepEqual(f.order(), ['codigo', 'intruso', 'trivia']);
    assert.equal(f.animations[0].options.duration, 120);
    f.animations[0].resolve();
    await Promise.resolve(); await Promise.resolve();
    assert.deepEqual(f.order(), ['intruso', 'codigo', 'trivia']);
    assert.equal(f.animations[1].options.duration, 300);
    f.animations.slice(1).forEach(animation => animation.resolve());
    await done;
});

test('rapid requests cancel previous animations and stale settlements cannot change latest order or focus', async () => {
    const f = fixture({ motion: true });
    const first = f.selection.select('codigo');
    const second = f.selection.select('trivia');
    assert.equal(f.animations[0].cancelled, true);
    f.animations[0].resolve();
    f.animations[1].resolve();
    await Promise.resolve(); await Promise.resolve();
    const elsewhere = {};
    f.doc.activeElement = elsewhere;
    f.animations.slice(2).forEach(animation => animation.resolve());
    await Promise.all([first, second]);
    assert.deepEqual(f.order(), ['codigo', 'trivia', 'intruso']);
    assert.equal(f.doc.activeElement, elsewhere);
});

test('animation rejection and throwing animation safely settle latest selection', async () => {
    const f = fixture({ motion: true });
    const done = f.selection.select('codigo');
    f.animations[0].reject(new Error('interrupted'));
    await Promise.resolve(); await Promise.resolve();
    f.animations.slice(1).forEach(animation => animation.reject(new Error('interrupted')));
    await done;
    assert.deepEqual(f.order(), ['intruso', 'codigo', 'trivia']);
    const throwing = fixture({ motion: true, throws: true });
    await throwing.selection.select('trivia');
    assert.deepEqual(throwing.order(), ['codigo', 'trivia', 'intruso']);
});

test('reduced motion and absent WAAPI immediately reorder without animations', async () => {
    for (const options of [{ motion: false }, { motion: true, waapi: false }]) {
        const f = fixture(options);
        const done = f.selection.select('trivia');
        assert.deepEqual(f.order(), ['codigo', 'trivia', 'intruso']);
        assert.equal(f.animations.length, 0);
        await done;
    }
});

test('reorder preserves current focus moved during squash to another card or descendant, without stealing outside focus', async () => {
    for (const target of ['button', 'descendant', 'outside']) {
        const f = fixture({ motion: true });
        f.doc.activeElement = f.cards[0].button;
        const done = f.selection.select('codigo');
        const focus = target === 'outside' ? {} : f.cards[1][target];
        f.doc.activeElement = focus;
        f.animations[0].resolve();
        await Promise.resolve(); await Promise.resolve();
        f.animations.slice(1).forEach(animation => animation.resolve());
        await done;
        assert.deepEqual(f.order(), ['intruso', 'codigo', 'trivia']);
        assert.equal(f.doc.activeElement, focus, target);
    }
});

test('navigation waits until squash and travel finish for the selected game', async () => {
    const settled = [];
    const f = fixture({ motion: true, onSettled: id => settled.push(id) });
    const done = f.selection.select('codigo');
    assert.deepEqual(settled, []);
    f.animations[0].resolve();
    await Promise.resolve(); await Promise.resolve();
    assert.deepEqual(f.order(), ['intruso', 'codigo', 'trivia']);
    assert.deepEqual(settled, []);
    f.animations.slice(1).forEach(animation => animation.resolve());
    await done;
    assert.deepEqual(settled, ['codigo']);
});

test('reduced motion and missing WAAPI navigate immediately after reordering', async () => {
    for (const options of [{ motion: false }, { motion: true, waapi: false }]) {
        const settled = [];
        let f;
        f = fixture({ ...options, onSettled: id => settled.push([id, f.order()]) });
        const done = f.selection.select('trivia');
        assert.deepEqual(settled, [['trivia', ['codigo', 'trivia', 'intruso']]]);
        await done;
        assert.equal(settled.length, 1);
    }
});

test('a cancelled selection cannot navigate to an older game', async () => {
    const settled = [];
    const f = fixture({ motion: true, onSettled: id => settled.push(id) });
    const first = f.selection.select('codigo');
    f.animations[0].resolve();
    await Promise.resolve(); await Promise.resolve();
    const second = f.selection.select('trivia');
    const latestSquash = f.animations.at(-1);
    latestSquash.resolve();
    await Promise.resolve(); await Promise.resolve();
    f.animations.forEach(animation => animation.resolve());
    await Promise.all([first, second]);
    assert.deepEqual(settled, ['trivia']);
});
