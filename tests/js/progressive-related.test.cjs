const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Events extends EventTarget {
    emit(type, values = {}) {
        const event = new Event(type, { cancelable: true });
        for (const [key, value] of Object.entries(values)) Object.defineProperty(event, key, { value });
        this.dispatchEvent(event);
        return event;
    }
}

function setup({ fine = true } = {}) {
    const document = new Events();
    const card = new Events();
    const summary = { focusVisible: false, focus() { document.activeElement = summary; } };
    const link = { focusVisible: false };
    card.open = false;
    card.contains = target => target === summary || target === link || target === card;
    card.querySelector = selector => selector === 'summary' ? summary
        : (card.contains(document.activeElement) && document.activeElement.focusVisible ? document.activeElement : null);
    document.querySelectorAll = () => [card];
    const script = 'src/Novar.Web/wwwroot/js/progressive-related.js';
    vm.runInNewContext(fs.existsSync(script) ? fs.readFileSync(script, 'utf8') : '', {
        document, window: { matchMedia: () => ({ matches: fine }) },
    });
    return { card, document, summary, link };
}

test('mouse hover opens the choices and leaving closes them', () => {
    const { card } = setup();
    card.emit('pointerenter', { pointerType: 'mouse' });
    assert.equal(card.open, true);
    card.emit('pointerleave', { pointerType: 'mouse' });
    assert.equal(card.open, false);
});

test('touch does not synthesize hover; native disclosure controls the tap', () => {
    const { card } = setup({ fine: false });
    card.emit('pointerenter', { pointerType: 'touch' });
    assert.equal(card.open, false);
    card.open = true; // Browser's native summary click.
    card.emit('pointerleave', { pointerType: 'touch' });
    assert.equal(card.open, true);
});

test('leaving with a keyboard-focused link keeps choices usable until focus exits', () => {
    const { card, document, link } = setup();
    card.emit('pointerenter', { pointerType: 'mouse' });
    document.activeElement = link;
    link.focusVisible = true;
    card.emit('pointerleave', { pointerType: 'mouse' });
    assert.equal(card.open, true);
    card.emit('focusout', { relatedTarget: {} });
    assert.equal(card.open, false);
});

test('mouse-click focus does not keep a photo blurred after the cursor leaves', () => {
    const { card, document, summary } = setup();
    card.emit('pointerenter', { pointerType: 'mouse' });
    document.activeElement = summary;
    card.emit('pointerleave', { pointerType: 'mouse' });
    assert.equal(card.open, false);
});

test('Escape dismisses and restores focus to the photo summary', () => {
    const { card, document, link, summary } = setup();
    card.open = true;
    document.activeElement = link;
    const event = card.emit('keydown', { key: 'Escape' });
    assert.equal(card.open, false);
    assert.equal(document.activeElement, summary);
    assert.equal(event.defaultPrevented, true);
});

test('outside pointer closes choices without intercepting product navigation', () => {
    const { card, document, link } = setup();
    card.open = true;
    document.emit('pointerdown', { target: link });
    assert.equal(card.open, true);
    document.emit('pointerdown', { target: {} });
    assert.equal(card.open, false);
});
