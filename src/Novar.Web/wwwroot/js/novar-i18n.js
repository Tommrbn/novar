(() => {
    'use strict';
    let messages = {};
    try {
        messages = JSON.parse(document.getElementById('novar-messages')?.textContent || '{}');
    } catch {
        // A malformed local catalog leaves the application usable with its Spanish source copy.
    }

    window.NovarText = (key, fallback, values = {}) => {
        let value = Object.prototype.hasOwnProperty.call(messages, key) ? messages[key] : fallback;
        for (const [name, replacement] of Object.entries(values)) {
            value = value.replaceAll(`{${name}}`, String(replacement));
        }
        return value;
    };
})();
