(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.NovarLensFinderRules = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
    'use strict';

    function validate(config) {
        const id = value => typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);
        const text = value => typeof value === 'string' && value.trim().length > 0;
        const unique = values => new Set(values).size === values.length;
        if (!config || !text(config.notice) || !Array.isArray(config.needs)
            || !Array.isArray(config.preferences) || !Array.isArray(config.products)
            || !Array.isArray(config.compact?.replacements) || !text(config.compact.label)) return false;
        if (!config.needs.every(n => n && id(n.id) && text(n.label))
            || !unique(config.needs.map(n => n.id)) || !config.needs.some(n => n.id === 'unsure')) return false;
        const needs = new Set(config.needs.map(n => n.id));
        if (!config.products.length || !config.products.every(p => p && id(p.slug)
            && needs.has(p.need) && p.need !== 'unsure' && text(p.reason)
            && (p.href === undefined || p.href === `/lentes/${p.slug}`)
            && (p.name === undefined || text(p.name))) || !unique(config.products.map(p => p.slug))) return false;
        const products = new Map(config.products.map(p => [p.slug, p]));
        if (!config.needs.filter(n => n.id !== 'unsure').every(n => config.products.some(p => p.need === n.id))) return false;
        if (!config.preferences.every(p => p && id(p.id) && text(p.label) && needs.has(p.need)
            && p.need !== 'unsure' && Array.isArray(p.slugs) && p.slugs.length && unique(p.slugs)
            && p.slugs.every(s => products.get(s)?.need === p.need))
            || !unique(config.preferences.map(p => p.id))) return false;
        const replacements = config.compact.replacements;
        return replacements.length > 0 && replacements.every(r => r && products.has(r.from) && products.has(r.to)
            && r.from !== r.to && products.get(r.from).need === products.get(r.to).need
            && config.preferences.some(p => p.slugs.includes(r.from))
            && !replacements.some(other => other?.from === r.to))
            && unique(replacements.map(r => r.from)) && unique(replacements.map(r => r.to));
    }

    function canCompact(config, need, selected) {
        return config.preferences.some(p => p.need === need && selected.includes(p.id)
            && config.compact.replacements.some(r => p.slugs.includes(r.from)));
    }

    // Age is deliberately not read: descriptions do not establish age-based eligibility.
    function match(config, selection = {}) {
        if (!validate(config)) return { kind: 'invalid-config', products: [] };
        if (!selection || typeof selection !== 'object' || Array.isArray(selection)) return { kind: 'unmatched', products: [] };
        const { need = '', preferences = [], compact = false } = selection;
        if (!Array.isArray(preferences) || typeof compact !== 'boolean') return { kind: 'unmatched', products: [] };
        if (!need || need === 'unsure') {
            return preferences.length || compact ? { kind: 'unmatched', products: [] }
                : { kind: 'browse', products: config.products.slice() };
        }
        if (!config.needs.some(n => n.id === need)) return { kind: 'unmatched', products: [] };
        const choices = preferences.map(id => config.preferences.find(p => p.id === id && p.need === need));
        if (choices.some(p => !p) || (compact && !canCompact(config, need, preferences))) {
            return { kind: 'unmatched', products: [] };
        }
        let candidates = config.products.filter(p => p.need === need && choices.every(choice => choice.slugs.includes(p.slug)));
        if (compact) {
            const slugs = new Set(candidates.map(p => config.compact.replacements.find(r => r.from === p.slug)?.to || p.slug));
            candidates = config.products.filter(p => slugs.has(p.slug));
        }
        return { kind: candidates.length ? (choices.length ? 'matched' : 'family') : 'unmatched', products: candidates };
    }

    return { validate, canCompact, match };
});
