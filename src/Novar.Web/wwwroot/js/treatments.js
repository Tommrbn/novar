// Real fragment links and visible sections remain usable when JavaScript is unavailable.
(() => {
    const root = document.querySelector('[data-treatments-revision]');
    if (!root) return;
    const navigation = root.querySelector('.treatments-tabs');
    const list = navigation.querySelector('ul');
    const tabs = [...navigation.querySelectorAll('[data-treatment-link]')];
    const panels = tabs.map(tab => document.getElementById(tab.dataset.treatmentLink));
    if (!tabs.length || panels.some(panel => !panel)) return;

    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', window.NovarText('treatments.available', 'Tratamientos disponibles'));
    list.querySelectorAll('li').forEach(item => item.setAttribute('role', 'presentation'));
    navigation.querySelectorAll('button:disabled').forEach(button => {
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', 'false');
        button.tabIndex = -1;
    });
    tabs.forEach((tab, index) => {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', panels[index].id);
        panels[index].setAttribute('role', 'tabpanel');
        panels[index].setAttribute('aria-labelledby', tab.id);
        panels[index].tabIndex = 0;
    });

    const select = (index, focus = false) => {
        // Moving focus out of a panel that is about to be hidden avoids an invisible focus target.
        const focusedPanel = panels.find(panel => panel.contains(document.activeElement));
        tabs.forEach((tab, position) => {
            const selected = position === index;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
            if (selected) tab.setAttribute('aria-current', 'true');
            else tab.removeAttribute('aria-current');
            panels[position].hidden = !selected;
        });
        root.dataset.activeTreatment = tabs[index].dataset.treatmentLink;
        document.body.dataset.activeTreatment = root.dataset.activeTreatment;
        if (focus || (focusedPanel && focusedPanel !== panels[index])) tabs[index].focus({ preventScroll: true });
    };
    const hashIndex = () => tabs.findIndex(tab => tab.hash === window.location.hash);
    const fromLocation = () => select(Math.max(0, hashIndex()));
    const activate = index => {
        if (window.location.hash !== tabs[index].hash) history.pushState(null, '', tabs[index].hash);
        select(index, true);
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            activate(index);
        });
        tab.addEventListener('keydown', event => {
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            activate(next);
        });
    });
    window.addEventListener('hashchange', fromLocation);
    window.addEventListener('popstate', fromLocation);
    fromLocation();
    if (hashIndex() >= 0) requestAnimationFrame(() => panels[hashIndex()]?.scrollIntoView({ block: 'start' }));
})();
