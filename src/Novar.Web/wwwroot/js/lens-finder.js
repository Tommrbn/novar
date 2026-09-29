(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else {
        const element = root.document.querySelector('[data-lens-finder-revision="lens-finder-routing-v1"]');
        if (element) api.initFinder(element, root.NovarLensFinderRules);
    }
})(typeof globalThis === 'object' ? globalThis : this, function () {
    'use strict';

    function initFinder(root, rules) {
        if (!rules || root.dataset.finderReady) return false;
        const find = id => root.querySelector(`#lens-finder-${id}`);
        const data = find('data');
        const age = find('age');
        const needsField = find('needs');
        const help = find('preference-help');
        const compact = find('compact');
        const compactOption = find('compact-option');
        const reset = find('reset');
        const status = find('status');
        const results = find('results');
        const list = find('result-list');
        if (![data, age, needsField, help, compact, compactOption, reset, status, results, list].every(Boolean)) return false;
        let config;
        try { config = JSON.parse(data.textContent); } catch { return false; }
        if (!rules.validate(config) || !config.products.every(p => typeof p.name === 'string' && p.href === `/lentes/${p.slug}`)) return false;
        const needs = Array.from(root.querySelectorAll('[data-need]'));
        const preferences = Array.from(root.querySelectorAll('[data-preference]'));
        const groups = Array.from(root.querySelectorAll('[data-preference-group]'));
        const need = () => needs.find(input => input.checked)?.value || '';
        const selected = () => preferences.filter(input => input.checked && !input.disabled).map(input => input.value);

        function clearResults() {
            results.hidden = true;
            list.replaceChildren();
            status.textContent = '';
            age.removeAttribute('aria-invalid');
        }

        function updatePreferences() {
            const current = need();
            groups.forEach(group => { group.hidden = group.dataset.preferenceGroup !== current; group.disabled = group.hidden; });
            preferences.forEach(input => {
                input.disabled = input.dataset.preference !== current;
                if (input.disabled) input.checked = false;
            });
            const allowed = rules.canCompact(config, current, selected());
            compactOption.hidden = !allowed;
            compact.disabled = !allowed;
            if (!allowed) compact.checked = false;
            help.textContent = current && current !== 'unsure'
                ? 'Podés elegir una o más preferencias. Combinarlas busca una coincidencia entre todas; también podés ver la familia sin elegir ninguna.'
                : 'Elegí un tipo de lente para ver sus preferencias, o usá No sé para explorar todas las opciones.';
        }

        function ageValue() {
            if (age.validity?.badInput) return { valid: false, value: null };
            const value = age.value.trim();
            if (value === '') return { valid: true, value: null };
            const number = Number(value);
            return {
                valid: Number.isFinite(number) && Number.isInteger(number) && number >= 0,
                value: number
            };
        }

        function render(product, ageValue) {
            const doc = root.ownerDocument;
            const item = doc.createElement('li');
            item.dataset.product = product.slug;
            const title = doc.createElement('h3');
            title.textContent = product.name;
            const reason = doc.createElement('p');
            reason.textContent = product.reason;
            const link = doc.createElement('a');
            link.href = product.href;
            link.textContent = `Conocé ${product.name}`;
            item.append(title, reason);
            if (product.slug === 'first' && ageValue !== null && ageValue >= 40 && ageValue <= 45) {
                const context = doc.createElement('p');
                context.textContent = 'La ficha de First menciona personas de 40 a 45 años que comienzan con la presbicia. Es contexto del producto, no una indicación por tu edad.';
                item.append(context);
            }
            item.append(link);
            return item;
        }

        function refreshResults() {
            clearResults();
            const ageInput = ageValue();
            if (!ageInput.valid) {
                status.textContent = 'La edad es opcional. Dejala vacía o ingresá un número entero mayor o igual a cero.';
                age.setAttribute('aria-invalid', 'true');
                return;
            }
            if (!need()) return;
            const result = rules.match(config, { need: need(), preferences: selected(), compact: compact.checked });
            if (result.kind === 'unmatched' || result.kind === 'invalid-config') {
                status.textContent = 'No encontramos una coincidencia exacta para esa combinación. Cambiá las preferencias o explorá todas las fichas de abajo; no asignamos un lente por descarte.';
                return;
            }
            list.replaceChildren(...result.products.map(product => render(product, ageInput.value)));
            results.hidden = false;
            const context = result.kind === 'browse' ? 'Mostramos todo el catálogo, sin asignar una recomendación.'
                : result.kind === 'family' ? 'Son alternativas del tipo que elegiste, no una selección clínica.'
                    : 'Estas fichas describen las características que seleccionaste, no una indicación personal.';
            status.textContent = `${result.products.length} opciones para explorar. ${context}`;
        }

        root.addEventListener('change', function () {
            updatePreferences();
            refreshResults();
        });
        age.addEventListener('input', refreshResults);
        reset.addEventListener('click', function () {
            age.value = '';
            needs.forEach(input => { input.checked = false; });
            preferences.forEach(input => { input.checked = false; });
            compact.checked = false;
            updatePreferences();
            clearResults();
        });
        updatePreferences();
        needsField.disabled = false;
        age.disabled = false;
        reset.disabled = false;
        root.dataset.finderReady = 'true';
        return true;
    }

    return { initFinder };
});
