(function (root) {
    'use strict';

    const ROUND_COUNT = 3;
    const LEVEL_COUNT = 5;
    const intrusoLevels = Object.freeze([
        { columns: 3, hueDelta: 36, lightnessDelta: 12 },
        { columns: 3, hueDelta: 25, lightnessDelta: 8 },
        { columns: 4, hueDelta: 18, lightnessDelta: 6 },
        { columns: 4, hueDelta: 12, lightnessDelta: 4 },
        { columns: 5, hueDelta: 7, lightnessDelta: 2 }
    ].map(Object.freeze));
    const codigoLevels = Object.freeze([
        { digits: 1, noise: 0 },
        { digits: 1, noise: .15 },
        { digits: 2, noise: .15 },
        { digits: 2, noise: .3 },
        { digits: 3, noise: .4 }
    ].map(Object.freeze));
    const DEFAULT_SEED = 0x6d2b79f5;
    const glyphs = Object.freeze([
        ['0111110', '1100011', '1100011', '1100011', '1100011', '0111110'],
        ['0001000', '0011000', '0001000', '0001000', '0001000', '0011100'],
        ['0111110', '1100011', '0000011', '0001110', '0110000', '1111111'],
        ['0111110', '1100011', '0000011', '0001110', '1100011', '0111110'],
        ['0000110', '0001110', '0010110', '0100110', '1111111', '0000110'],
        ['1111111', '1100000', '1111110', '0000011', '1100011', '0111110'],
        ['0011110', '0110000', '1100000', '1111110', '1100011', '0111110'],
        ['0000000', '0111100', '0001100', '0001000', '0010000', '0100000'],
        ['0111110', '1100011', '1100011', '0111110', '1100011', '0111110'],
        ['0111110', '1100011', '1100011', '0111111', '0000011', '0111110']
    ].map(rows => Object.freeze(rows)));

    function normalizeSeed(seed) {
        if (!Number.isInteger(seed)) return DEFAULT_SEED;
        const normalized = seed >>> 0;
        return normalized === 0 ? DEFAULT_SEED : normalized;
    }

    function randomFrom(seed) {
        let state = normalizeSeed(seed);
        return () => {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            return (state >>> 0) / 0x100000000;
        };
    }

    function createRuntimeSeed(cryptoProvider = root.crypto, fallbackRandom = Math.random) {
        try {
            if (cryptoProvider && typeof cryptoProvider.getRandomValues === 'function') {
                const value = cryptoProvider.getRandomValues(new Uint32Array(1))[0];
                if (value !== 0) return value;
            }
        } catch {
            // Randomness here is only for variety, not a security boundary.
        }
        const fallback = Math.floor(fallbackRandom() * 0x100000000) >>> 0;
        return fallback === 0 ? DEFAULT_SEED : fallback;
    }

    function shuffledPositions(random, count) {
        const positions = Array.from({ length: count }, (_, index) => index);
        for (let index = positions.length - 1; index > 0; index--) {
            const range = index + 1;
            const limit = Math.floor(0x100000000 / range) * range;
            let value;
            do { value = Math.floor(random() * 0x100000000); } while (value >= limit);
            const swapIndex = value % range;
            [positions[index], positions[swapIndex]] = [positions[swapIndex], positions[index]];
        }
        return positions;
    }

    function makePalette(random, settings) {
        const hue = 244 + Math.floor(random() * 22);
        const saturation = 55 + Math.floor(random() * 12);
        const lightness = 45 + Math.floor(random() * 8);
        return [
            `hsl(${hue} ${saturation}% ${lightness}%)`,
            `hsl(${hue + settings.hueDelta} ${saturation}% ${lightness + settings.lightnessDelta}%)`
        ];
    }

    function createIntrusoAttempt(seed, translate, level) {
        const settings = intrusoLevels[level - 1];
        const choiceCount = settings.columns ** 2;
        let attemptSeed = normalizeSeed(seed);
        function makeRounds(currentSeed) {
            const random = randomFrom(currentSeed);
            const positions = shuffledPositions(random, choiceCount);
            return Array.from({ length: ROUND_COUNT }, (_, index) => {
                const correctIndex = positions[index];
                const palette = makePalette(random, settings);
                const baseFirst = random() < 0.5;
                return Object.freeze({
                    colors: Object.freeze(Array.from({ length: choiceCount }, (_, choice) =>
                        choice === correctIndex ? palette[baseFirst ? 1 : 0] : palette[baseFirst ? 0 : 1]))
                });
            });
        }
        let rounds = makeRounds(attemptSeed);
        let index, score, checked, complete, feedback;

        function restart(nextSeed = attemptSeed) {
            attemptSeed = normalizeSeed(nextSeed);
            rounds = makeRounds(attemptSeed);
            index = 0;
            score = 0;
            checked = false;
            complete = false;
            feedback = null;
        }
        function getState() {
            return Object.freeze({
                index, round: index + 1, total: ROUND_COUNT, score, checked, complete,
                columns: settings.columns,
                colors: complete ? Object.freeze([]) : rounds[index].colors,
                feedback: feedback && Object.freeze({ ...feedback })
            });
        }
        function choose(choice) {
            if (complete || checked || !Number.isInteger(choice) || choice < 0 || choice >= choiceCount) return false;
            const colors = rounds[index].colors;
            const correctColor = colors.find((color, colorIndex) => colors.indexOf(color) === colorIndex && colors.lastIndexOf(color) === colorIndex);
            const correct = colors[choice] === correctColor;
            checked = true;
            score += correct ? 1 : 0;
            feedback = {
                correct,
                message: translate(correct ? 'game.intruderCorrect' : 'game.intruderWrong', correct ? '¡Encontraste el intruso!' : 'No era ese color.')
            };
            return true;
        }
        function next() {
            if (!checked || complete) return false;
            if (index === ROUND_COUNT - 1) complete = true;
            else index += 1;
            checked = false;
            feedback = null;
            return true;
        }
        restart();
        return Object.freeze({ getState, choose, next, restart });
    }

    function createCodigoAttempt(seed, translate, level) {
        const settings = codigoLevels[level - 1];
        const random = randomFrom(normalizeSeed(seed) ^ 0x9e3779b9);
        const answers = Array.from({ length: ROUND_COUNT }, () => Array.from({ length: settings.digits }, () => Math.floor(random() * 10)).join(''));
        const masks = answers.map(answer => Object.freeze(Array.from({ length: 6 }, (_, row) => [...answer].map(digit => glyphs[Number(digit)][row]).join('0'))));
        // Distractors never erase a signal dot or fill the separator between digits.
        const noise = masks.map(mask => Object.freeze(mask.join('').split('').map((dot, index) =>
            dot === '0' && (index % mask[0].length) % 8 !== 7 && random() < settings.noise)));
        let index, score, checked, complete, feedback, draft;

        function restart() {
            index = 0;
            score = 0;
            checked = false;
            complete = false;
            feedback = null;
            draft = '';
        }
        function getState() {
            return Object.freeze({
                index, round: index + 1, total: ROUND_COUNT, score, checked, complete, draft,
                digits: settings.digits, columns: settings.digits * 8 - 1,
                mask: complete ? Object.freeze([]) : masks[index],
                noise: complete ? Object.freeze([]) : noise[index],
                feedback: feedback && Object.freeze({ ...feedback })
            });
        }
        function setDraft(value) {
            if (checked || complete || typeof value !== 'string') return false;
            draft = value;
            if (feedback?.kind === 'invalid') feedback = null;
            return true;
        }
        function clearError() {
            if (feedback?.kind === 'invalid') feedback = null;
        }
        function check(value = draft) {
            if (checked || complete || typeof value !== 'string') return false;
            draft = value;
            if (value.length !== settings.digits || !/^[0-9]+$/.test(value)) {
                feedback = { kind: 'invalid', message: settings.digits === 1
                    ? translate('game.codeInvalid', 'Ingresá una sola cifra del 0 al 9.')
                    : translate('game.codeInvalidMany', 'Ingresá exactamente {count} cifras, incluidos los ceros iniciales.', { count: settings.digits }) };
                return false;
            }
            const correct = value === answers[index];
            checked = true;
            score += correct ? 1 : 0;
            feedback = {
                kind: 'answer', correct,
                answer: String(answers[index]),
                message: correct
                    ? translate('game.codeCorrect', '¡Número correcto!')
                    : translate('game.codeWrong', 'El número era {answer}.', { answer: answers[index] })
            };
            return true;
        }
        function next() {
            if (!checked || complete) return false;
            if (index === ROUND_COUNT - 1) complete = true;
            else index += 1;
            checked = false;
            feedback = null;
            draft = '';
            return true;
        }
        restart();
        return Object.freeze({ getState, setDraft, clearError, check, next, restart });
    }

    function defaultTranslate(key, fallback, values = {}) {
        return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), fallback);
    }

    // Each level keeps its own attempt, draft and best result for this page visit.
    // Selecting another difficulty or game never discards progress or writes user data.
    function createLevels(factory, seed, translate) {
        const baseSeed = normalizeSeed(seed);
        let level = 1;
        const attempts = new Map();
        const best = new Map();
        const current = () => {
            if (!attempts.has(level)) attempts.set(level, factory(normalizeSeed(baseSeed ^ Math.imul(level - 1, 0x9e3779b9)), translate, level));
            return attempts.get(level);
        };
        function selectLevel(value) {
            if (!Number.isInteger(value) || value < 1 || value > LEVEL_COUNT || value === level) return false;
            level = value;
            current();
            return true;
        }
        function getState() {
            return Object.freeze({ ...current().getState(), level, levelCount: LEVEL_COUNT,
                progress: Object.freeze(Array.from({ length: LEVEL_COUNT }, (_, index) => Object.freeze({
                    level: index + 1, complete: best.has(index + 1), bestScore: best.get(index + 1) ?? null
                }))) });
        }
        const forward = method => (...args) => current()[method](...args);
        return Object.freeze({
            getState, selectLevel,
            ...(factory === createIntrusoAttempt ? { choose: forward('choose') }
                : { setDraft: forward('setDraft'), clearError: forward('clearError'), check: forward('check') }),
            next() {
                if (!current().next()) return false;
                const state = current().getState();
                if (state.complete) best.set(level, Math.max(best.get(level) ?? 0, state.score));
                return true;
            },
            nextLevel() { return current().getState().complete && selectLevel(level + 1); },
            restart(nextSeed) {
                if (nextSeed === undefined) current().restart();
                else attempts.set(level, factory(normalizeSeed(nextSeed), translate, level));
            }
        });
    }
    const createIntruso = (seed = DEFAULT_SEED, translate = defaultTranslate) => createLevels(createIntrusoAttempt, seed, translate);
    const createCodigo = (seed = DEFAULT_SEED, translate = defaultTranslate) => createLevels(createCodigoAttempt, seed, translate);
    const api = Object.freeze({ ROUND_COUNT, LEVEL_COUNT, DEFAULT_SEED, intrusoLevels, codigoLevels, createRuntimeSeed, createIntruso, createCodigo });
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.NovarVisualGames = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
