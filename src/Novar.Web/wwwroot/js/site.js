(() => {
    'use strict';
    const modalElement = document.getElementById('pending-modal');
    const modal = new bootstrap.Modal(modalElement);
    let returnFocus;

    function showPending(feature, trigger) {
        returnFocus = trigger;
        document.getElementById('pending-feature').textContent = feature;
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
})();
