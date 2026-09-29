'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rules = require('../../src/Novar.Web/wwwroot/js/lens-finder-rules.js');
const { initFinder } = require('../../src/Novar.Web/wwwroot/js/lens-finder.js');
const source = require('../../src/Novar.Web/Content/lens-finder.json');

class Element {
    constructor(tag = 'div') {
        this.tag = tag;
        this.dataset = {};
        this.attributes = new Map();
        this.listeners = new Map();
        this.children = [];
        this.value = '';
        this.checked = false;
        this.disabled = false;
        this.hidden = false;
        this.textContent = '';
        this.validity = { badInput: false };
    }
    set innerHTML(_) { throw new Error('Unsafe HTML insertion is forbidden'); }
    addEventListener(name, callback) {
        if (!this.listeners.has(name)) this.listeners.set(name, []);
        this.listeners.get(name).push(callback);
    }
    emit(name) { for (const callback of this.listeners.get(name) || []) callback({ target: this }); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    focus() { this.ownerDocument.activeElement = this; }
    closest() { return this.panel; }
}

function fixture(config = structuredClone(source)) {
    const directory = path.resolve(__dirname, '../../src/Novar.Web/Content');
    const catalog = ['first.json', 'premium-products.json', 'progressive-products.json', 'monofocal-products.json', 'bifocal-occupational-products.json']
        .flatMap(file => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));
    config.products = config.products.map(p => ({ ...p, name: catalog.find(c => c.slug === p.slug)?.name || 'Unknown', href: `/lentes/${p.slug}` }));
    const doc = { activeElement: null, createElement(tag) { const element = new Element(tag); element.ownerDocument = doc; return element; } };
    const root = doc.createElement('section');
    const ids = {};
    for (const id of ['data', 'age', 'needs', 'preference-help', 'compact', 'compact-option', 'reset', 'status', 'results', 'result-list', 'all']) ids[id] = doc.createElement();
    ids.data.textContent = JSON.stringify(config);
    ['age', 'needs', 'compact', 'reset'].forEach(id => { ids[id].disabled = true; });
    ['compact-option', 'results'].forEach(id => { ids[id].hidden = true; });
    ids.age.panel = doc.createElement('details');
    ids.all.children = config.products.map(p => Object.assign(doc.createElement('a'), { href: p.href, textContent: p.name }));
    const needs = config.needs.map(n => Object.assign(doc.createElement('input'), { value: n.id, dataset: { need: '' } }));
    const preferences = config.preferences.map(p => Object.assign(doc.createElement('input'), { value: p.id, dataset: { preference: p.need } }));
    const groups = config.needs.filter(n => n.id !== 'unsure').map(n => Object.assign(doc.createElement('fieldset'), { dataset: { preferenceGroup: n.id }, hidden: true, disabled: true }));
    root.querySelector = selector => ids[selector.replace('#lens-finder-', '')];
    root.querySelectorAll = selector => ({ '[data-need]': needs, '[data-preference]': preferences, '[data-preference-group]': groups })[selector];
    return {
        root, ids, doc, needs, preferences, groups, config,
        init(api = rules) { return initFinder(root, api); },
        need(value) { needs.forEach(n => { n.checked = n.value === value; }); root.emit('change'); },
        choose(...values) { preferences.forEach(p => { p.checked = values.includes(p.value); }); root.emit('change'); },
        change() { root.emit('change'); },
        products() { return ids['result-list'].children.map(c => c.dataset.product); }
    };
}

test('filter changes automatically refresh results without navigation or focus movement', () => {
    const f = fixture();
    assert.equal(f.init(), true);
    assert.equal(f.ids.reset.disabled, false);
    assert.equal(f.ids.age.disabled, false);
    assert.equal(f.ids.status.textContent, '');
    f.need('bifocal');
    assert.equal(f.ids.results.hidden, false);
    assert.deepEqual(f.products(), ['kriptok-blended', 'ultex-blended', 'freeline']);
    f.choose('discreet');
    assert.deepEqual(f.products(), ['kriptok-blended', 'freeline']);
    assert.equal(f.doc.activeElement, null);
    assert.match(f.ids.status.textContent, /2 opciones/);
});

test('need is required only for matching; all catalog links remain independently usable', () => {
    const f = fixture(); f.init();
    assert.equal(f.ids.status.textContent, '');
    assert.equal(f.ids.results.hidden, true);
    assert.equal(f.doc.activeElement, null);
    assert.equal(f.ids.all.children.length, 18);
    assert.ok(f.ids.all.children.every(link => link.href.startsWith('/lentes/')));
    f.need('unsure');
    assert.equal(f.products().length, 18);
    assert.match(f.ids.status.textContent, /sin asignar una recomendación/);
});

test('changing need clears incompatible preferences and automatically refreshes results', () => {
    const f = fixture(); f.init(); f.need('progressive'); f.choose('balanced');
    assert.deepEqual(f.products(), ['precisa']);
    f.need('occupational');
    assert.equal(f.ids.results.hidden, false);
    assert.ok(f.preferences.filter(p => p.dataset.preference !== 'occupational').every(p => !p.checked && p.disabled));
    assert.ok(f.groups.every(g => g.hidden === (g.dataset.preferenceGroup !== 'occupational')));
    assert.deepEqual(f.products(), ['office', 'aiwork']);
});

test('preference and age edits automatically refresh while age stays contextual only', () => {
    const f = fixture(); f.init(); f.need('monofocal'); f.choose('personalization');
    f.choose('sport');
    assert.deepEqual(f.products(), ['outdoor']);
    f.ids.age.value = '42'; f.ids.age.emit('input');
    assert.deepEqual(f.products(), ['outdoor']);
    assert.equal(f.ids.results.hidden, false);
});

test('compact appears only for compatible preferences, replaces the base and clears when incompatible', () => {
    const f = fixture(); f.init(); f.need('progressive');
    assert.equal(f.ids['compact-option'].hidden, true);
    f.choose('balanced');
    assert.equal(f.ids.compact.disabled, false);
    f.ids.compact.checked = true; f.change();
    assert.deepEqual(f.products(), ['precisa-short']);
    f.choose('digital');
    assert.equal(f.ids.compact.checked, false);
    assert.equal(f.ids['compact-option'].hidden, true);
    assert.deepEqual(f.products(), ['elife']);
});

test('multiple preferences intersect and incompatible selections show catalog fallback, not a winner', () => {
    const f = fixture(); f.init(); f.need('bifocal'); f.choose('freeform', 'discreet');
    assert.deepEqual(f.products(), ['kriptok-blended']);
    f.choose('round', 'discreet');
    assert.deepEqual(f.products(), []);
    assert.match(f.ids.status.textContent, /No encontramos una coincidencia exacta/);
    assert.equal(f.ids.all.children.length, 18);
});

test('optional nonnegative whole age is contextual only, including empty and large values', () => {
    const f = fixture(); f.init(); f.need('progressive'); f.choose('first-experience');
    for (const age of ['', '0', '17', '39', '40', '45', '46', '9999']) {
        f.ids.age.value = age; f.ids.age.emit('input');
        assert.deepEqual(f.products(), ['first']);
        const paragraphs = f.ids['result-list'].children[0].children.filter(c => c.tag === 'p');
        assert.equal(paragraphs.length, age === '40' || age === '45' ? 2 : 1);
    }
    f.ids.age.value = '42'; f.ids.age.emit('input'); f.choose('digital');
    assert.deepEqual(f.products(), ['elife']);
    assert.equal(f.ids['result-list'].children[0].children.filter(c => c.tag === 'p').length, 1);
});

test('invalid age is explained accessibly and never submits or yields a recommendation', () => {
    const f = fixture(); f.init(); f.need('progressive');
    for (const age of ['-1', '1.5', 'word', 'Infinity']) {
        f.ids.age.value = age; f.ids.age.emit('input');
        assert.deepEqual(f.products(), []);
        assert.equal(f.ids.age.attributes.get('aria-invalid'), 'true');
        assert.equal(f.ids.age.panel.open, undefined);
        assert.equal(f.doc.activeElement, null);
        assert.match(f.ids.status.textContent, /edad es opcional/);
    }
    f.ids.age.value = ''; f.ids.age.validity.badInput = true; f.ids.age.emit('input');
    assert.equal(f.ids.age.attributes.get('aria-invalid'), 'true');
});

test('reset clears every answer, compact state and results while retaining catalog access', () => {
    const f = fixture(); f.init(); f.need('progressive'); f.choose('balanced');
    f.ids.age.value = '42'; f.ids.age.emit('input'); f.ids.compact.checked = true; f.change();
    f.ids.reset.emit('click');
    assert.equal(f.ids.age.value, '');
    assert.ok(f.needs.every(n => !n.checked));
    assert.ok(f.preferences.every(p => !p.checked));
    assert.equal(f.ids.compact.checked, false);
    assert.deepEqual(f.products(), []);
    assert.equal(f.ids.all.children.length, 18);
    assert.equal(f.ids.status.textContent, '');
});

test('missing rules, malformed config or missing markup keep actions disabled and catalog untouched', () => {
    for (const failure of ['rules', 'json', 'config', 'markup', 'href']) {
        const f = fixture();
        const links = f.ids.all.children.slice();
        if (failure === 'json') f.ids.data.textContent = '{';
        if (failure === 'config') f.ids.data.textContent = '{}';
        if (failure === 'markup') f.ids['result-list'] = null;
        if (failure === 'href') { f.config.products[0].href = 'https://example.invalid'; f.ids.data.textContent = JSON.stringify(f.config); }
        assert.equal(f.init(failure === 'rules' ? null : rules), false);
        assert.equal(f.ids.reset.disabled, true);
        assert.deepEqual(f.ids.all.children, links);
    }
});

test('product names and reasons use text nodes, and initialization cannot double-bind', () => {
    const f = fixture();
    f.config.products[0].name = '<img onerror=alert(1)>';
    f.config.products[0].reason = '</script><script>alert(1)</script>';
    f.ids.data.textContent = JSON.stringify(f.config);
    assert.equal(f.init(), true);
    assert.equal(f.init(), false);
    assert.equal(f.root.listeners.get('change').length, 1);
    f.need('progressive'); f.choose('first-experience');
    const children = f.ids['result-list'].children[0].children;
    assert.equal(children[0].textContent, f.config.products[0].name);
    assert.equal(children[1].textContent, f.config.products[0].reason);
    assert.equal(children.at(-1).href, '/lentes/first');
});
