(() => {
    'use strict';

    const visualApi = window.NovarVisualGames;
    const triviaApi = window.NovarTrivia;
    const panels = {
        intruso: document.getElementById('intruso-preview'),
        codigo: document.getElementById('codigo-panel'),
        trivia: document.getElementById('trivia-panel')
    };
    const intruso = panels.intruso;
    const triviaPanel = panels.trivia;
    const cardTriggers = [...document.querySelectorAll('[data-game-card]')];
    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const moveFocus = (target, scroll = true) => {
        if (!target) return;
        target.focus({ preventScroll: true });
        if (scroll) target.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'center' });
    };

    let activeGame = 'intruso';
    let intrusoGame = null;
    let codigoGame = null;
    let triviaGame = null;
    let triviaQuestions = [];
    const intrusoChoices = [...document.querySelectorAll('[data-intruso-choice]')];
    const codigoMatrix = document.querySelector('[data-codigo-matrix]');
    const codigoDots = [...document.querySelectorAll('[data-codigo-dot]')];
    const codigoInput = document.getElementById('codigo-answer');

    if (visualApi && panels.intruso && panels.codigo && intrusoChoices.length === 9 && codigoMatrix && codigoDots.length === 42 && codigoInput) {
        intrusoGame = visualApi.createIntruso(visualApi.createRuntimeSeed(), window.NovarText);
        codigoGame = visualApi.createCodigo(visualApi.DEFAULT_SEED, window.NovarText);
        panels.intruso.hidden = false;
        panels.codigo.hidden = true;
        renderVisual('intruso');
        renderVisual('codigo');
        cardTriggers.filter(trigger => trigger.dataset.visualGameStart).forEach(trigger => { trigger.disabled = false; });
    }

    if (triviaApi && panels.trivia) {
        triviaQuestions = [...panels.trivia.querySelectorAll('[data-trivia-question]')];
        try {
            triviaGame = triviaApi.createTrivia(triviaQuestions.map(question => ({
                options: [...question.querySelectorAll('input[type="radio"]')],
                correctIndex: Number(question.dataset.correctIndex)
            })));
            cardTriggers.filter(trigger => trigger.hasAttribute('data-trivia-start')).forEach(trigger => { trigger.disabled = false; });
        } catch {
            triviaGame = null;
        }
    }

    function active(panel) {
        return activeGame === panel && panels[panel] && !panels[panel].hidden;
    }

    function renderVisual(id) {
        const panel = panels[id];
        const game = id === 'intruso' ? intrusoGame : codigoGame;
        if (!panel || !game) return;
        const state = game.getState();
        const playing = panel.querySelector('[data-visual-play]');
        const result = panel.querySelector('[data-visual-result]');
        const canInteract = active(id) && !state.complete;
        const roundLabel = panel.querySelector('[data-visual-round]');
        const scoreLabel = panel.querySelector('[data-visual-score]');
        const feedback = panel.querySelector('[data-visual-feedback]');
        const next = panel.querySelector('[data-visual-next]');
        const resultTitle = panel.querySelector('[data-visual-result-title]');
        const retry = panel.querySelector('[data-visual-retry]');

        roundLabel.textContent = window.NovarText('game.round', 'Ronda {round} de {total}', { round: state.round, total: state.total });
        scoreLabel.textContent = window.NovarText('game.score', 'Puntaje: {score}', { score: state.score });
        playing.hidden = state.complete;
        result.hidden = !state.complete;
        resultTitle.textContent = state.complete ? window.NovarText('game.finalScore', 'Puntaje final: {score}/{total}', { score: state.score, total: state.total }) : '';
        retry.disabled = !active(id) || !state.complete;
        next.hidden = !state.checked;
        next.disabled = !canInteract || !state.checked;
        feedback.textContent = state.feedback?.message ?? '';

        if (id === 'intruso') {
            intrusoChoices.forEach((button, index) => {
                button.style.backgroundColor = state.colors[index] ?? '';
                button.disabled = !canInteract || state.checked;
            });
        } else {
            codigoDots.forEach((dot, index) => {
                const row = Math.floor(index / 7);
                const column = index % 7;
                dot.classList.toggle('is-lit', state.mask[row]?.[column] === '1');
            });
            codigoMatrix.setAttribute('aria-label', state.checked && state.feedback?.answer
                ? window.NovarText('game.digitShown', 'Número formado por puntos: {answer}', { answer: state.feedback.answer })
                : window.NovarText('game.digitImage', 'Una cifra formada por puntos'));
            codigoInput.disabled = !canInteract || state.checked;
            if (document.activeElement !== codigoInput) codigoInput.value = state.draft;
            const check = panel.querySelector('[data-codigo-check]');
            check.disabled = !canInteract || state.checked;
        }
    }

    function renderTrivia() {
        if (!triviaGame || !panels.trivia) return;
        const state = triviaGame.getState();
        const check = document.getElementById('trivia-check');
        const next = document.getElementById('trivia-next');
        const feedback = document.getElementById('trivia-feedback');
        const progress = document.getElementById('trivia-progress');
        const play = document.getElementById('trivia-play');
        const result = document.getElementById('trivia-result');
        const score = document.getElementById('trivia-score');
        const canInteract = active('trivia') && !state.complete;

        play.hidden = state.complete;
        result.hidden = !state.complete;
        triviaQuestions.forEach((question, index) => {
            question.hidden = state.complete || index !== state.index;
            question.querySelectorAll('input').forEach(input => {
                input.disabled = !canInteract || index !== state.index || state.checked;
                input.checked = index === state.index && Number(input.value) === state.selected;
            });
        });
        check.disabled = !canInteract || state.selected === null || state.checked;
        check.hidden = state.checked;
        next.hidden = !state.checked;
        next.disabled = !active('trivia') || !state.checked;
        next.textContent = state.index === state.total - 1 ? window.NovarText('game.viewResult', 'Ver resultado') : window.NovarText('game.next', 'Siguiente');
        progress.textContent = window.NovarText('game.questionProgress', 'Pregunta {index} de {total}', { index: state.index + 1, total: state.total });
        score.textContent = state.complete ? window.NovarText('game.correctCount', 'Aciertos: {score}/{total}', { score: state.score, total: state.total }) : '';
        if (state.checked && !state.complete) {
            const correct = triviaQuestions[state.index].querySelectorAll('.trivia-option-text')[state.correctIndex].textContent;
            const letter = String.fromCharCode(65 + state.correctIndex);
            feedback.textContent = window.NovarText('game.answerFeedback', '{result} Respuesta correcta: {letter}. {answer}', {
                result: window.NovarText(state.selected === state.correctIndex ? 'game.correct' : 'game.incorrect', state.selected === state.correctIndex ? '¡Correcto!' : 'Respuesta incorrecta.'),
                letter,
                answer: correct
            });
        } else feedback.textContent = '';
    }

    function renderAll() {
        if (panels.intruso && intrusoGame) renderVisual('intruso');
        if (panels.codigo && codigoGame) renderVisual('codigo');
        renderTrivia();
    }

    function selectPanel(id) {
        if (!panels[id]) return;
        activeGame = id;
        if (id === 'trivia' && intruso) intruso.hidden = true;
        if (id !== 'trivia' && triviaPanel) triviaPanel.hidden = true;
        Object.entries(panels).forEach(([name, panel]) => { if (panel) panel.hidden = name !== id; });
        renderAll();
    }

    function focusSelectedPanel(id) {
        if (!active(id)) return;
        const game = id === 'trivia' ? triviaGame : id === 'intruso' ? intrusoGame : codigoGame;
        if (!game) return;
        const state = game.getState();
        const target = id === 'trivia'
            ? state.complete ? document.getElementById('trivia-score') : triviaQuestions[state.index]?.querySelector('legend')
            : panels[id].querySelector(state.complete ? '[data-visual-result-title]' : '.games-arena-heading h2');
        moveFocus(target);
    }

    const cardGrid = document.querySelector('.games-cards');
    const selection = window.NovarGamesSelection && cardGrid
        ? window.NovarGamesSelection.createSelection({
            grid: cardGrid,
            cards: cardTriggers.map(trigger => trigger.closest('.game-card')),
            featuredLabel: cardGrid.dataset.featuredLabel,
            reducedMotion,
            onSelect: selectPanel,
            onSettled: focusSelectedPanel
        }) : null;

    cardTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            if (trigger.disabled) return;
            const id = trigger.dataset.visualGameStart ?? (trigger.hasAttribute('data-trivia-start') ? 'trivia' : null);
            if (id) {
                if (selection) selection.select(id);
                else {
                    selectPanel(id);
                    focusSelectedPanel(id);
                }
            }
        });
    });

    intrusoChoices.forEach((button, index) => button.addEventListener('click', () => {
        if (!active('intruso') || !intrusoGame?.choose(index)) return;
        renderVisual('intruso');
        moveFocus(panels.intruso.querySelector('[data-visual-next]'), false);
    }));

    document.querySelectorAll('[data-visual-game-panel]').forEach(panel => {
        const id = panel.dataset.visualGamePanel;
        const next = panel.querySelector('[data-visual-next]');
        const retry = panel.querySelector('[data-visual-retry]');
        next.addEventListener('click', () => {
            if (!active(id)) return;
            const game = id === 'intruso' ? intrusoGame : codigoGame;
            if (!game?.next()) return;
            renderVisual(id);
            const state = game.getState();
            moveFocus(state.complete
                ? panel.querySelector('[data-visual-result-title]')
                : id === 'codigo' ? codigoInput : intrusoChoices[0]);
        });
        retry.addEventListener('click', () => {
            if (!active(id)) return;
            if (id === 'intruso') intrusoGame?.restart(visualApi.createRuntimeSeed());
            else codigoGame?.restart();
            if (id === 'codigo') codigoInput.value = '';
            renderVisual(id);
            moveFocus(id === 'codigo' ? codigoInput : intrusoChoices[0]);
        });
    });

    const codigoCheck = panels.codigo?.querySelector('[data-codigo-check]');
    if (codigoCheck) codigoCheck.addEventListener('click', () => {
        if (!active('codigo') || !codigoGame?.check(codigoInput.value)) {
            if (active('codigo')) {
                renderVisual('codigo');
                moveFocus(codigoInput, false);
            }
            return;
        }
        renderVisual('codigo');
        moveFocus(panels.codigo.querySelector('[data-visual-next]'), false);
    });

    codigoInput?.addEventListener('input', () => {
        if (!active('codigo') || !codigoGame?.setDraft(codigoInput.value)) return;
        renderVisual('codigo');
    });
    codigoInput?.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || !active('codigo')) return;
        event.preventDefault();
        codigoCheck?.click();
    });

    if (triviaGame) {
        const game = triviaGame;
        triviaQuestions.forEach((question, questionIndex) => {
            question.addEventListener('change', event => {
                if (!active('trivia') || questionIndex !== game.getState().index || !event.target.matches('input[type="radio"]')) return;
                if (game.select(Number(event.target.value))) renderTrivia();
            });
        });
        document.getElementById('trivia-check').addEventListener('click', () => {
            if (!active('trivia')) return;
            if (!game.check()) return;
            renderTrivia();
            document.getElementById('trivia-next').focus({ preventScroll: true });
        });
        document.getElementById('trivia-next').addEventListener('click', () => {
            if (!active('trivia')) return;
            if (!game.next()) return;
            renderTrivia();
            const state = game.getState();
            moveFocus(state.complete ? document.getElementById('trivia-score') : triviaQuestions[state.index].querySelector('legend'));
        });
        document.getElementById('trivia-retry').addEventListener('click', () => {
            if (!active('trivia')) return;
            game.restart();
            renderTrivia();
            moveFocus(triviaQuestions[0].querySelector('legend'));
        });
    }

    renderAll();
})();
