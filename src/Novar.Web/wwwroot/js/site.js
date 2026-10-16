(() => {
    'use strict';
    const translate = window.NovarText;
    const modalElement = document.getElementById('pending-modal');
    const modal = new bootstrap.Modal(modalElement);
    let returnFocus;

    function showPending(feature, trigger) {
        returnFocus = trigger;
        document.getElementById('pending-feature').textContent = translate(`feature:${feature}`, feature);
        modal.show();
    }

    document.querySelectorAll('[data-pending]').forEach(button => {
        button.addEventListener('click', () => showPending(button.dataset.pending, button));
    });
    document.querySelectorAll('[data-demo-form]').forEach(form => {
        form.addEventListener('submit', event => event.preventDefault());
        form.addEventListener('keydown', event => {
            if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
                event.preventDefault();
                showPending(form.dataset.demoForm, event.target);
            }
        });
    });
    modalElement.addEventListener('hidden.bs.modal', () => returnFocus?.focus());

    const nav = document.getElementById('main-nav');
    nav.addEventListener('keydown', event => {
        if (event.key === 'Escape' && nav.classList.contains('show')) {
            bootstrap.Collapse.getInstance(nav)?.hide();
            document.querySelector('.navbar-toggler').focus();
        }
    });

    const languageForm = document.querySelector('.language-form');
    const languageSelect = languageForm?.querySelector('[data-language-picker]');
    const preserveLanguageReturnHash = () => {
        const returnField = languageForm.querySelector('[data-language-return-url]');
        if (returnField && window.location.hash && !returnField.value.includes('#')) {
            returnField.value += window.location.hash;
        }
    };
    languageForm?.addEventListener('submit', preserveLanguageReturnHash);
    languageSelect?.addEventListener('change', () => {
        if (typeof languageForm.requestSubmit === 'function') {
            languageForm.requestSubmit();
        } else {
            preserveLanguageReturnHash();
            languageForm.submit();
        }
    });
})();
