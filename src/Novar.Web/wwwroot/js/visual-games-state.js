(function (root) {
    'use strict';

    const ROUND_COUNT = 5;
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

    function shuffledPositions(random) {
        const positions = Array.from({ length: 9 }, (_, index) => index);
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

    function makePalette(random, round) {
        const hue = 244 + Math.floor(random() * 22);
        const saturation = 55 + Math.floor(random() * 12);
        const lightness = 45 + Math.floor(random() * 8);
        const delta = 25 - (round - 1) * 3;
        return [
            `hsl(${hue} ${saturation}% ${lightness}%)`,
            `hsl(${hue + delta} ${saturation}% ${lightness}%)`
        ];
    }

    function createIntruso(seed = DEFAULT_SEED) {
        let attemptSeed = normalizeSeed(seed);
        function makeRounds(currentSeed) {
            const random = randomFrom(currentSeed);
            const positions = shuffledPositions(random);
            return Array.from({ length: ROUND_COUNT }, (_, index) => {
                const correctIndex = positions[index];
                const palette = makePalette(random, index + 1);
                const baseFirst = random() < 0.5;
                return Object.freeze({
                    colors: Object.freeze(Array.from({ length: 9 }, (_, choice) =>
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
                colors: complete ? Object.freeze([]) : rounds[index].colors,
                feedback: feedback && Object.freeze({ ...feedback })
            });
        }
        function choose(choice) {
            if (complete || checked || !Number.isInteger(choice) || choice < 0 || choice >= 9) return false;
            const colors = rounds[index].colors;
            const correctColor = colors.find((color, colorIndex) => colors.indexOf(color) === colorIndex && colors.lastIndexOf(color) === colorIndex);
            const correct = colors[choice] === correctColor;
            checked = true;
            score += correct ? 1 : 0;
            feedback = { correct, message: correct ? '¡Encontraste el intruso!' : 'No era ese color.' };
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

    function createCodigo(seed = DEFAULT_SEED) {
        const random = randomFrom(normalizeSeed(seed) ^ 0x9e3779b9);
        const answers = Array.from({ length: ROUND_COUNT }, () => Math.floor(random() * 10));
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
                mask: complete ? Object.freeze([]) : glyphs[answers[index]],
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
            if (value.length !== 1 || value.charCodeAt(0) < 48 || value.charCodeAt(0) > 57) {
                feedback = { kind: 'invalid', message: 'Ingresá una sola cifra del 0 al 9.' };
                return false;
            }
            const correct = Number(value) === answers[index];
            checked = true;
            score += correct ? 1 : 0;
            feedback = {
                kind: 'answer', correct,
                answer: String(answers[index]),
                message: correct ? '¡Número correcto!' : `El número era ${answers[index]}.`
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

    const api = Object.freeze({ ROUND_COUNT, DEFAULT_SEED, createRuntimeSeed, createIntruso, createCodigo });
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.NovarVisualGames = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
