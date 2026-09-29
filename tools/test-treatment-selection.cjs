// Offline DOM-contract tests run the production enhancement; real browser proof is separate.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/Novar.Web/wwwroot/js/treatments.js', 'utf8');
const treatmentsView = fs.readFileSync('src/Novar.Web/Views/Home/Treatments.cshtml', 'utf8');
const treatmentsStyles = fs.readFileSync('src/Novar.Web/wwwroot/css/treatments.css', 'utf8');

function fixture(hash = '', availableCount = 7) {
    const document = { activeElement: null, body: { dataset: {} } };
    const element = id => ({
        id, dataset: {}, attributes: {}, listeners: {}, hidden: false, tabIndex: 0,
        setAttribute(name, value) { this.attributes[name] = value; },
        removeAttribute(name) { delete this.attributes[name]; },
        addEventListener(name, callback) { this.listeners[name] = callback; },
        focus() { document.activeElement = this; },
        contains(target) { return this === target || target?.parent === this; },
        scrollIntoView() { this.scrolled = true; }
    });
    const tabs = ['uv', 'blue-tech', 'antirraya', 'polarizado', 'hidrofobico', 'fotosensible', 'ilux'].slice(0, availableCount).map(id => Object.assign(element(`treatment-tab-${id}`), {
        hash: `#${id}`, dataset: { treatmentLink: id }
    }));
    const panels = ['uv', 'blue-tech', 'antirraya', 'polarizado', 'hidrofobico', 'fotosensible', 'ilux'].slice(0, availableCount).map(element);
    const disabled = Array.from({ length: 7 - availableCount }, (_, i) => element(`unavailable-${i}`));
    const items = Array.from({ length: 7 }, (_, i) => element(`item-${i}`));
    const list = Object.assign(element('list'), { querySelectorAll: () => items });
    const navigation = {
        querySelector: () => list,
        querySelectorAll: selector => selector === '[data-treatment-link]' ? tabs : disabled
    };
    const root = { dataset: {}, querySelector: () => navigation };
    document.querySelector = () => root;
    document.getElementById = id => panels.find(panel => panel.id === id);
    const events = {};
    const window = { location: { hash }, addEventListener: (type, callback) => { events[type] = callback; } };
    const history = { entries: [], pushState(_state, _unused, value) { this.entries.push(value); window.location.hash = value; } };
    vm.runInNewContext(source, { document, window, history, requestAnimationFrame: callback => callback() });
    const fire = (tab, type, extras = {}) => {
        const event = { button: 0, preventDefault() { this.prevented = true; }, ...extras };
        tab.listeners[type](event);
        return event;
    };
    return { root, tabs, panels, disabled, list, items, document, window, history, events, fire };
}

function selected(f, index) {
    assert.equal(f.root.dataset.activeTreatment, f.panels[index].id);
    assert.equal(f.document.body.dataset.activeTreatment, f.panels[index].id);
    f.tabs.forEach((tab, i) => {
        assert.equal(tab.attributes['aria-selected'], String(i === index));
        assert.equal(tab.attributes['aria-current'], i === index ? 'true' : undefined);
        assert.equal(tab.tabIndex, i === index ? 0 : -1);
        assert.equal(f.panels[i].hidden, i !== index);
    });
}

test('default UV enhancement has one tab stop and all seven controls available', () => {
    const f = fixture();
    selected(f, 0);
    assert.equal(f.disabled.length, 0);
    assert.equal(f.list.attributes.role, 'tablist');
    f.tabs.forEach((tab, i) => {
        assert.equal(tab.attributes.role, 'tab');
        assert.equal(tab.attributes['aria-controls'], f.panels[i].id);
        assert.equal(f.panels[i].attributes.role, 'tabpanel');
        assert.equal(f.panels[i].attributes['aria-labelledby'], tab.id);
    });
    assert.ok(f.disabled.every(tab => tab.attributes['aria-selected'] === 'false' && tab.tabIndex === -1));
    assert.equal(f.history.entries.length, 0);
});

test('Blue Tech direct hash selects and reaches the correct panel', () => {
    const f = fixture('#blue-tech');
    selected(f, 1);
    assert.equal(f.panels[1].scrolled, true);
    assert.equal(f.history.entries.length, 0);
});

test('unknown and malformed hashes safely default without rewriting the URL', () => {
    for (const hash of ['#unknown', '#not-a-treatment', '#%E0%A4%A']) {
        const f = fixture(hash);
        selected(f, 0);
        assert.equal(f.window.location.hash, hash);
    }
});

test('click and keyboard activation update history once and keep visible focus', () => {
    const f = fixture();
    assert.equal(f.fire(f.tabs[1], 'click').prevented, true);
    selected(f, 1);
    assert.equal(f.document.activeElement, f.tabs[1]);
    f.fire(f.tabs[1], 'keydown', { key: ' ' });
    f.fire(f.tabs[1], 'keydown', { key: 'Enter' });
    assert.deepEqual(f.history.entries, ['#blue-tech']);
});

test('arrow keys wrap through available tabs; Home and End select endpoints', () => {
    const f = fixture();
    for (const [from, key, to] of [[0, 'ArrowRight', 1], [1, 'ArrowRight', 2], [2, 'ArrowRight', 3], [3, 'ArrowRight', 4], [4, 'ArrowRight', 5], [5, 'ArrowRight', 6], [6, 'ArrowRight', 0], [0, 'ArrowLeft', 6], [6, 'ArrowLeft', 5], [5, 'ArrowLeft', 4], [4, 'ArrowLeft', 3], [3, 'ArrowLeft', 2], [2, 'ArrowLeft', 1], [1, 'Home', 0], [0, 'End', 6]]) {
        assert.equal(f.fire(f.tabs[from], 'keydown', { key }).prevented, true);
        selected(f, to);
    }
    assert.equal(f.fire(f.tabs[1], 'keydown', { key: 'Tab' }).prevented, undefined);
});

test('Back/Forward and hash edits synchronize without adding history entries', () => {
    const f = fixture();
    f.fire(f.tabs[1], 'click');
    f.window.location.hash = '#uv';
    f.events.popstate();
    selected(f, 0);
    f.window.location.hash = '#blue-tech';
    f.events.popstate();
    selected(f, 1);
    f.window.location.hash = '#uv';
    f.events.hashchange();
    selected(f, 0);
    assert.deepEqual(f.history.entries, ['#blue-tech']);
});

test('history navigation moves focus out of a panel before it becomes hidden', () => {
    const f = fixture('#blue-tech');
    f.document.activeElement = { parent: f.panels[1] };
    f.window.location.hash = '#uv';
    f.events.popstate();
    selected(f, 0);
    assert.equal(f.document.activeElement, f.tabs[0]);
});

test('modified and non-primary clicks retain native fragment-link behavior', () => {
    const f = fixture();
    for (const extras of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])
        assert.equal(f.fire(f.tabs[1], 'click', extras).prevented, undefined);
    selected(f, 0);
    assert.deepEqual(f.history.entries, []);
});

test('Antirraya direct fragment selects the third panel without adding history', () => {
    const f = fixture('#antirraya');
    selected(f, 2);
    assert.equal(f.panels[2].scrolled, true);
    assert.equal(f.history.entries.length, 0);
});

test('Antirraya activation and history preserve previous states and visible focus', () => {
    const f = fixture();
    f.fire(f.tabs[2], 'click');
    selected(f, 2);
    assert.equal(f.document.activeElement, f.tabs[2]);
    f.document.activeElement = { parent: f.panels[2] };
    f.window.location.hash = '#blue-tech';
    f.events.popstate();
    selected(f, 1);
    assert.equal(f.document.activeElement, f.tabs[1]);
    f.window.location.hash = '#antirraya';
    f.events.hashchange();
    selected(f, 2);
    assert.deepEqual(f.history.entries, ['#antirraya']);
});

test('Polarizado direct fragment selects the fourth panel without changing the production script', () => {
    const f = fixture('#polarizado');
    selected(f, 3);
    assert.equal(f.panels[3].scrolled, true);
    assert.deepEqual(f.history.entries, []);
});

test('Polarizado activation, old-state history and focus remain synchronized', () => {
    const f = fixture();
    f.fire(f.tabs[3], 'click');
    selected(f, 3);
    assert.equal(f.document.activeElement, f.tabs[3]);
    for (const [hash, index] of [['#antirraya', 2], ['#blue-tech', 1], ['#uv', 0]]) {
        f.document.activeElement = { parent: f.panels[3] };
        f.window.location.hash = hash;
        f.events.popstate();
        selected(f, index);
        assert.equal(f.document.activeElement, f.tabs[index]);
        f.window.location.hash = '#polarizado';
        f.events.hashchange();
        selected(f, 3);
    }
    assert.deepEqual(f.history.entries, ['#polarizado']);
});

test('Hidrofóbico direct fragment selects the fifth panel and retains a native URL', () => {
    const f = fixture('#hidrofobico');
    selected(f, 4);
    assert.equal(f.panels[4].scrolled, true);
    assert.equal(f.panels[4].tabIndex, 0);
    assert.deepEqual(f.history.entries, []);
    assert.equal(f.window.location.hash, '#hidrofobico');
});

test('Hidrofóbico click, Enter and Space preserve one history entry and visible focus', () => {
    const f = fixture();
    assert.equal(f.fire(f.tabs[4], 'click').prevented, true);
    selected(f, 4);
    assert.equal(f.document.activeElement, f.tabs[4]);
    for (const key of ['Enter', ' ']) {
        assert.equal(f.fire(f.tabs[4], 'keydown', { key }).prevented, true);
        selected(f, 4);
    }
    assert.deepEqual(f.history.entries, ['#hidrofobico']);
});

test('Hidrofóbico Back/Forward and hash edits restore every prior state without hidden focus', () => {
    const f = fixture();
    f.fire(f.tabs[4], 'click');
    for (const [hash, index] of [['#polarizado', 3], ['#antirraya', 2], ['#blue-tech', 1], ['#uv', 0]]) {
        f.document.activeElement = { parent: f.panels[4] };
        f.window.location.hash = hash;
        f.events.popstate();
        selected(f, index);
        assert.equal(f.document.activeElement, f.tabs[index]);
        f.document.activeElement = { parent: f.panels[index] };
        f.window.location.hash = '#hidrofobico';
        f.events.hashchange();
        selected(f, 4);
        assert.equal(f.document.activeElement, f.tabs[4]);
    }
    assert.deepEqual(f.history.entries, ['#hidrofobico']);
});

test('Fotosensible direct fragment selects the sixth panel and retains a native URL', () => {
    const f = fixture('#fotosensible');
    selected(f, 5);
    assert.equal(f.panels[5].scrolled, true);
    assert.equal(f.panels[5].tabIndex, 0);
    assert.deepEqual(f.history.entries, []);
    assert.equal(f.window.location.hash, '#fotosensible');
});

test('Fotosensible click, Enter and Space preserve one history entry and visible focus', () => {
    const f = fixture();
    assert.equal(f.fire(f.tabs[5], 'click').prevented, true);
    selected(f, 5);
    assert.equal(f.document.activeElement, f.tabs[5]);
    for (const key of ['Enter', ' ']) {
        assert.equal(f.fire(f.tabs[5], 'keydown', { key }).prevented, true);
        selected(f, 5);
    }
    assert.deepEqual(f.history.entries, ['#fotosensible']);
});

test('Fotosensible Back/Forward and hash edits restore every prior state without hidden focus', () => {
    const f = fixture();
    f.fire(f.tabs[5], 'click');
    for (const [hash, index] of [['#hidrofobico', 4], ['#polarizado', 3], ['#antirraya', 2], ['#blue-tech', 1], ['#uv', 0]]) {
        f.document.activeElement = { parent: f.panels[5] };
        f.window.location.hash = hash;
        f.events.popstate();
        selected(f, index);
        assert.equal(f.document.activeElement, f.tabs[index]);
        f.document.activeElement = { parent: f.panels[index] };
        f.window.location.hash = '#fotosensible';
        f.events.hashchange();
        selected(f, 5);
        assert.equal(f.document.activeElement, f.tabs[5]);
    }
    assert.deepEqual(f.history.entries, ['#fotosensible']);
});

// Keep the generic unavailable-branch contract even though this page now enables all seven.
test('an unavailable panel still defaults safely when a smaller state set is supplied', () => {
    const f = fixture('#ilux', 6);
    selected(f, 0);
    assert.equal(f.disabled.length, 1);
    assert.equal(f.disabled[0].attributes['aria-selected'], 'false');
    assert.equal(f.disabled[0].tabIndex, -1);
    assert.equal(f.window.location.hash, '#ilux');
});

test('iLUX direct fragment selects the seventh panel without rewriting the URL', () => {
    const f = fixture('#ilux');
    selected(f, 6);
    assert.equal(f.panels[6].scrolled, true);
    assert.equal(f.panels[6].tabIndex, 0);
    assert.deepEqual(f.history.entries, []);
    assert.equal(f.window.location.hash, '#ilux');
});

test('iLUX click, Enter and Space preserve one history entry and visible focus', () => {
    const f = fixture();
    assert.equal(f.fire(f.tabs[6], 'click').prevented, true);
    selected(f, 6);
    assert.equal(f.document.activeElement, f.tabs[6]);
    for (const key of ['Enter', ' ']) {
        assert.equal(f.fire(f.tabs[6], 'keydown', { key }).prevented, true);
        selected(f, 6);
    }
    assert.deepEqual(f.history.entries, ['#ilux']);
});

test('iLUX history restores every earlier state and removes focus before hiding panels', () => {
    const f = fixture();
    f.fire(f.tabs[6], 'click');
    for (let index = 5; index >= 0; index--) {
        f.document.activeElement = { parent: f.panels[6] };
        f.window.location.hash = f.tabs[index].hash;
        f.events.popstate();
        selected(f, index);
        assert.equal(f.document.activeElement, f.tabs[index]);
        f.document.activeElement = { parent: f.panels[index] };
        f.window.location.hash = '#ilux';
        f.events.hashchange();
        selected(f, 6);
        assert.equal(f.document.activeElement, f.tabs[6]);
    }
    assert.deepEqual(f.history.entries, ['#ilux']);
});

test('comparison highlight is keyed to the selected state and has no fixed first-row default', () => {
    const keys = ['uv', 'blue-tech', 'antirraya', 'polarizado', 'hidrofobico', 'fotosensible', 'ilux'];
    assert.match(treatmentsView, /<tr data-treatment-row="@treatmentRowKey">/);
    assert.doesNotMatch(treatmentsStyles, /\.treatments-table\s+tr:first-child\s*\{[^}]*background/i);
    for (const key of keys) {
        assert.ok(treatmentsStyles.includes(
            `.treatments-content[data-active-treatment="${key}"] .treatments-table tr[data-treatment-row="${key}"]`),
            `Missing selected-state highlight rule for ${key}`);
    }
});
