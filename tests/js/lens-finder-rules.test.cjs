'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../../src/Novar.Web/Content/lens-finder.json');
const { validate, canCompact, match } = require('../../src/Novar.Web/wwwroot/js/lens-finder-rules.js');
const slugs = result => result.products.map(p => p.slug);
const pick = (need, preferences = [], compact = false, age) => match(config, { need, preferences, compact, age });

const approved = [
    ['progressive', 'first-experience', ['first']],
    ['progressive', 'balanced', ['precisa']],
    ['progressive', 'amplitude', ['evolution']],
    ['progressive', 'digital', ['elife']],
    ['progressive', 'progressive-ai', ['ai-lens']],
    ['monofocal', 'one-distance', ['single-vision']],
    ['monofocal', 'personalization', ['geo']],
    ['monofocal', 'myopia-comfort', ['myolens']],
    ['monofocal', 'sport', ['outdoor']],
    ['monofocal', 'near-support', ['indoor']],
    ['monofocal', 'thickness', ['geo', 'slim']],
    ['occupational', 'desk', ['office']],
    ['occupational', 'work-ai', ['aiwork']],
    ['bifocal', 'round', ['ultex-blended']],
    ['bifocal', 'freeform', ['kriptok-blended']],
    ['bifocal', 'discreet', ['kriptok-blended', 'freeline']]
];
for (const [need, preference, expected] of approved) {
    test(`approved ${need}/${preference} returns only its described alternatives`, () => {
        const result = pick(need, [preference]);
        assert.equal(result.kind, 'matched');
        assert.deepEqual(slugs(result), expected);
    });
}

test('configuration covers exactly the existing catalog, with every product reachable', () => {
    assert.equal(validate(config), true);
    const actual = [require('../../src/Novar.Web/Content/first.json'),
        ...require('../../src/Novar.Web/Content/premium-products.json'),
        ...require('../../src/Novar.Web/Content/progressive-products.json'),
        ...require('../../src/Novar.Web/Content/monofocal-products.json'),
        ...require('../../src/Novar.Web/Content/bifocal-occupational-products.json')];
    assert.equal(actual.length, 18);
    assert.deepEqual(config.products.map(p => p.slug).sort(), actual.map(p => p.slug).sort());
    assert.deepEqual(slugs(pick('unsure')), config.products.map(p => p.slug));
    assert.deepEqual(slugs(pick('')), slugs(pick('unsure')));
    const reached = new Set(approved.flatMap(([n, p]) => slugs(pick(n, [p]))));
    ['balanced', 'amplitude'].forEach(p => slugs(pick('progressive', [p], true)).forEach(s => reached.add(s)));
    assert.equal(reached.size, 18);
});

test('optical families include the cross-presentation Premium products without duplication', () => {
    for (const [need, count] of [['progressive', 7], ['monofocal', 6], ['occupational', 2], ['bifocal', 3]]) {
        const result = pick(need);
        assert.equal(result.kind, 'family');
        assert.equal(result.products.length, count);
        assert.ok(result.products.every(p => p.need === need));
    }
});

test('compact replaces only the compatible Precisa or Evolution, never adds the base', () => {
    assert.deepEqual(slugs(pick('progressive', ['balanced'], true)), ['precisa-short']);
    assert.deepEqual(slugs(pick('progressive', ['amplitude'], true)), ['evolution-short']);
    assert.equal(canCompact(config, 'progressive', ['balanced']), true);
    for (const preferences of [[], ['first-experience'], ['digital'], ['progressive-ai']]) {
        assert.equal(pick('progressive', preferences, true).kind, 'unmatched');
    }
    assert.equal(pick('monofocal', ['balanced'], true).kind, 'unmatched');
});

test('intersection narrows honest overlaps and conflicting selections remain unmatched', () => {
    assert.deepEqual(slugs(pick('bifocal', ['freeform', 'discreet'])), ['kriptok-blended']);
    assert.deepEqual(slugs(pick('monofocal', ['thickness', 'personalization'])), ['geo']);
    for (const [need, preferences] of [['occupational', ['desk', 'work-ai']], ['bifocal', ['round', 'discreet']],
        ['progressive', ['balanced', 'digital']], ['progressive', ['balanced', 'amplitude']]]) {
        assert.deepEqual(pick(need, preferences), { kind: 'unmatched', products: [] });
    }
});

test('unknown, incompatible or malformed answers cannot silently broaden a match', () => {
    for (const selection of [null, [], 'invalid', { need: 'unknown' }, { need: 'bifocal', preferences: ['desk'] },
        { need: 'monofocal', preferences: ['bogus'] }, { need: 'unsure', preferences: ['desk'] },
        { need: '', compact: true }, { need: 'bifocal', preferences: null }, { need: 'bifocal', compact: 'yes' }]) {
        assert.equal(match(config, selection).kind, 'unmatched');
    }
});

test('every preference subset and compact state is age-invariant in identity and order', () => {
    let combinations = 0;
    for (const need of ['', ...config.needs.map(n => n.id)]) {
        const available = config.preferences.filter(p => p.need === need).map(p => p.id);
        for (let mask = 0; mask < 2 ** available.length; mask++) {
            const preferences = available.filter((_, index) => mask & (1 << index));
            for (const compact of [false, true]) {
                const expected = pick(need, preferences, compact);
                for (const age of [undefined, '', 0, 17, 39, 40, 42, 45, 46, 80, 120]) {
                    assert.deepEqual(pick(need, preferences, compact, age), expected);
                }
                combinations++;
            }
        }
    }
    assert.equal(combinations, 220);
});

test('matcher never mutates configuration or answers and honors neutral config order', () => {
    const before = JSON.stringify(config);
    const answers = Object.freeze({ need: 'monofocal', preferences: Object.freeze(['thickness']), age: 42 });
    assert.deepEqual(slugs(match(config, answers)), ['geo', 'slim']);
    const reversed = { ...config, products: [...config.products].reverse() };
    assert.deepEqual(slugs(match(reversed, answers)), ['slim', 'geo']);
    assert.equal(JSON.stringify(config), before);
});

test('invalid configuration, cross-family references and unsafe projected hrefs fail closed', () => {
    const mutations = [
        c => { c.products.push(c.products[0]); },
        c => { c.products[0].slug = '../elsewhere'; },
        c => { c.products[0].href = 'javascript:alert(1)'; },
        c => { c.preferences[0].slugs = ['office']; },
        c => { c.preferences[0].slugs = ['missing']; },
        c => { c.needs.push(c.needs[0]); },
        c => { c.preferences.push(c.preferences[0]); },
        c => { c.compact.replacements.push(null); },
        c => { c.compact.replacements[0].to = 'office'; },
        c => { c.compact.replacements.push({ from: 'precisa-short', to: 'precisa' }); }
    ];
    for (const mutate of mutations) {
        const copy = structuredClone(config);
        mutate(copy);
        assert.equal(validate(copy), false);
        assert.equal(match(copy).kind, 'invalid-config');
    }
    assert.equal(validate(null), false);
});
