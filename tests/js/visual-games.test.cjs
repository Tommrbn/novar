'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { ROUND_COUNT, DEFAULT_SEED, createRuntimeSeed, createIntruso, createCodigo } = require('../../src/Novar.Web/wwwroot/js/visual-games-state.js');
const digitPatterns = [
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
];

function decodeMask(mask) {
    return digitPatterns.findIndex(pattern => pattern.length === mask.length && pattern.every((row, index) => row === mask[index]));
}

function intrusoPositions(game) {
    const positions = [];
    for (let round = 0; round < ROUND_COUNT; round++) {
        const colors = game.getState().colors;
        const oddColor = colors.find(color => colors.indexOf(color) === colors.lastIndexOf(color));
        positions.push(colors.indexOf(oddColor));
        if (round < ROUND_COUNT - 1) {
            game.choose(positions.at(-1));
            game.next();
        }
    }
    return positions;
}

function runCode(seed, mode) {
    const game = createCodigo(seed);
    let score = 0;
    for (let round = 1; round <= ROUND_COUNT; round++) {
        const answer = decodeMask(game.getState().mask);
        assert.notEqual(answer, -1, `round ${round} must use one readable 0–9 glyph`);
        const correct = mode === 'all' || (mode === 'mixed' && round % 2 === 1);
        const guess = String(correct ? answer : (answer + 1) % 10);
        game.setDraft(guess);
        assert.equal(game.check(), true);
        assert.equal(game.getState().feedback.correct, correct);
        if (correct) score++;
        assert.equal(game.getState().score, score);
        assert.equal(game.next(), true);
    }
    return game.getState();
}

test('Intruso creates five repeatable nine-choice rounds with one visual odd color', () => {
    const first = createIntruso(12345);
    const second = createIntruso(12345);
    assert.equal(ROUND_COUNT, 5);
    for (let round = 1; round <= ROUND_COUNT; round++) {
        const state = first.getState();
        assert.equal(state.round, round);
        assert.equal(state.total, 5);
        assert.equal(state.colors.length, 9);
        assert.equal(new Set(state.colors).size, 2);
        assert.ok(state.colors.filter(color => state.colors.indexOf(color) === state.colors.lastIndexOf(color)).length === 1);
        assert.equal(Object.hasOwn(state, 'correctIndex'), false);
        assert.equal(Object.hasOwn(state, 'answer'), false);
        assert.deepEqual(state.colors, second.getState().colors);
        const unique = state.colors.find(color => state.colors.indexOf(color) === state.colors.lastIndexOf(color));
        const correct = state.colors.indexOf(unique);
        assert.equal(first.next(), false, 'cannot skip a scoring decision');
        assert.equal(first.choose(9), false);
        assert.equal(first.choose(correct), true);
        assert.equal(first.getState().score, round);
        assert.equal(first.choose(correct), false, 'one scoring choice per round');
        assert.ok(first.getState().feedback.correct);
        assert.equal(first.next(), true);
        assert.equal(second.choose(correct), true);
        assert.equal(second.next(), true);
    }
    assert.equal(first.getState().complete, true);
    assert.equal(first.getState().score, 5);
    assert.equal(first.choose(0), false);
    first.restart();
    assert.deepEqual(first.getState().colors, createIntruso(12345).getState().colors);
    assert.equal(first.getState().score, 0);
    assert.equal(first.getState().round, 1);
});

test('Intruso uses five distinct seeded positions and a new seed regenerates the attempt', () => {
    const observed = new Set();
    for (let seed = 1; seed <= 300; seed++) {
        const positions = intrusoPositions(createIntruso(seed));
        assert.equal(new Set(positions).size, ROUND_COUNT, `seed ${seed} must not repeat a cell in one attempt`);
        positions.forEach(position => observed.add(position));
        assert.deepEqual(positions, intrusoPositions(createIntruso(seed)), `seed ${seed} must reproduce its attempt`);
    }
    assert.deepEqual([...observed].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8]);

    const first = createIntruso(12345);
    const firstPositions = intrusoPositions(first);
    first.restart(54321);
    assert.equal(first.getState().round, 1);
    assert.equal(first.getState().score, 0);
    assert.equal(first.getState().checked, false);
    const retryPositions = intrusoPositions(first);
    assert.notDeepEqual(retryPositions, firstPositions);
    assert.deepEqual(retryPositions, intrusoPositions(createIntruso(54321)));
    first.restart();
    assert.deepEqual(intrusoPositions(first), retryPositions, 'no-argument restart remains seeded and deterministic');
});

test('Runtime seed uses local crypto with a bounded non-crypto fallback; app uses it for Intruso start and retry', () => {
    let cryptoCalls = 0;
    const seed = createRuntimeSeed({ getRandomValues(values) { cryptoCalls++; values[0] = 987654; return values; } });
    assert.equal(seed, 987654);
    assert.equal(cryptoCalls, 1);
    assert.equal(createRuntimeSeed({ getRandomValues() { throw new Error('unavailable'); } }, () => 0.25), 0x40000000);

    const gamesSource = fs.readFileSync(path.join(__dirname, '../../src/Novar.Web/wwwroot/js/games.js'), 'utf8');
    assert.match(gamesSource, /createIntruso\(visualApi\.createRuntimeSeed\(\),\s*window\.NovarText\)/);
    assert.match(gamesSource, /intrusoGame\?\.restart\(visualApi\.createRuntimeSeed\(\)\)/);
    assert.match(gamesSource, /else codigoGame\?\.restart\(\)/, 'Código retry remains unchanged');
});

test('Intruso awards no point for a wrong choice and guards next until choice', () => {
    const game = createIntruso(9);
    const colors = game.getState().colors;
    const correct = colors.find(color => colors.indexOf(color) === colors.lastIndexOf(color));
    const wrong = (colors.indexOf(correct) + 1) % 9;
    assert.equal(game.choose(wrong), true);
    assert.equal(game.getState().score, 0);
    assert.equal(game.getState().feedback.correct, false);
    assert.equal(game.next(), true);
    assert.equal(game.getState().checked, false);
});

test('Código masks form digits 0–9 and keeps expected answer out of the pre-check snapshot', () => {
    const game = createCodigo(2222);
    let expectedScore = 0;
    for (let round = 1; round <= ROUND_COUNT; round++) {
        const state = game.getState();
        assert.equal(state.round, round);
        assert.equal(state.mask.length, 6);
        assert.ok(state.mask.every(row => /^[01]{7}$/.test(row)));
        assert.equal(Object.hasOwn(state, 'answer'), false);
        assert.equal(Object.hasOwn(state, 'correctIndex'), false);
        assert.equal(state.checked, false);
        assert.equal(game.next(), false);
        for (const invalid of ['', ' 2', '2 ', '+2', '-2', '2.0', '10', 'x', '2\n']) {
            assert.equal(game.check(invalid), false, `${JSON.stringify(invalid)} must not consume a round`);
            assert.equal(game.getState().checked, false);
            assert.equal(game.getState().score, expectedScore);
            assert.equal(game.getState().feedback.kind, 'invalid');
        }
        const guess = '0';
        game.setDraft(guess);
        assert.equal(game.getState().draft, guess);
        assert.equal(game.check(), true);
        const checked = game.getState();
        assert.equal(checked.checked, true);
        assert.match(checked.feedback.answer, /^[0-9]$/);
        assert.equal(checked.feedback.correct, checked.feedback.answer === guess);
        expectedScore += checked.feedback.correct ? 1 : 0;
        assert.equal(checked.score, expectedScore);
        assert.equal(game.check(guess), false, 'no duplicate score');
        assert.equal(game.next(), true);
    }
    assert.equal(game.getState().complete, true);
    assert.equal(game.getState().score, expectedScore);
    assert.equal(game.check('0'), false);
    game.restart();
    assert.equal(game.getState().round, 1);
    assert.equal(game.getState().score, 0);
    assert.equal(game.getState().draft, '');
});

test('Código reference 7 matches the card subset in the full 7×6 matrix', () => {
    const referenceSeven = ['0000000', '0111100', '0001100', '0001000', '0010000', '0100000'];
    assert.deepEqual(digitPatterns[7], referenceSeven);
    let found = false;
    for (let seed = 1; seed <= 1000 && !found; seed++) {
        const game = createCodigo(seed);
        for (let round = 0; round < ROUND_COUNT; round++) {
            if (decodeMask(game.getState().mask) === 7) {
                assert.deepEqual(game.getState().mask, referenceSeven);
                assert.equal(game.getState().mask.join('').length, 42);
                found = true;
                break;
            }
            game.setDraft('0');
            game.check();
            game.next();
        }
    }
    assert.ok(found, 'a deterministic seed reaches digit 7');
});

test('Código preserves a valid draft, clears invalid status, and guards state inputs', () => {
    const game = createCodigo(DEFAULT_SEED);
    assert.equal(game.setDraft('4'), true);
    assert.equal(game.setDraft(4), false);
    assert.equal(game.getState().draft, '4');
    assert.equal(game.check(''), false);
    assert.equal(game.setDraft('7'), true);
    assert.equal(game.getState().feedback, null);
    assert.equal(game.check(null), false);
    assert.equal(game.getState().checked, false);
    game.clearError();
    assert.equal(game.getState().feedback, null);
});

test('Código scores all-correct, all-wrong, and mixed five-round attempts', () => {
    assert.equal(runCode(1201, 'all').score, 5);
    assert.equal(runCode(1201, 'none').score, 0);
    assert.equal(runCode(1201, 'mixed').score, 3);
});

test('Intruso scores all-correct, all-wrong, and mixed five-round attempts', () => {
    for (const [mode, expected] of [['all', 5], ['none', 0], ['mixed', 3]]) {
        const game = createIntruso(1202);
        let score = 0;
        for (let round = 1; round <= ROUND_COUNT; round++) {
            const colors = game.getState().colors;
            const unique = colors.find(color => colors.indexOf(color) === colors.lastIndexOf(color));
            const correctIndex = colors.indexOf(unique);
            const correct = mode === 'all' || (mode === 'mixed' && round % 2 === 1);
            assert.equal(game.choose(correct ? correctIndex : (correctIndex + 1) % 9), true);
            if (correct) score++;
            assert.equal(game.getState().score, score);
            assert.equal(game.next(), true);
        }
        assert.equal(game.getState().score, expected);
        assert.equal(game.getState().complete, true);
    }
});

test('Seed normalization is safe and Código glyph rows cannot be mutated across attempts', () => {
    const reference = createIntruso(DEFAULT_SEED).getState().colors;
    for (const seed of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0x100000000, -0x100000000]) {
        assert.deepEqual(createIntruso(seed).getState().colors, createIntruso(seed).getState().colors);
    }
    assert.deepEqual(createIntruso(0).getState().colors, reference);
    assert.deepEqual(createIntruso(0x100000000).getState().colors, reference);

    const first = createCodigo(87);
    const second = createCodigo(87);
    const mask = first.getState().mask;
    assert.throws(() => mask.push('00000'), TypeError);
    assert.throws(() => { mask[0][0] = '0'; }, TypeError);
    assert.deepEqual(second.getState().mask, mask);
});

test('Seeded Código rounds render a legible representative of every digit 0–9', () => {
    const seen = new Set();
    for (let seed = 1; seed <= 1000 && seen.size < 10; seed++) {
        const game = createCodigo(seed);
        for (let round = 0; round < ROUND_COUNT && seen.size < 10; round++) {
            const digit = decodeMask(game.getState().mask);
            assert.notEqual(digit, -1);
            seen.add(digit);
            game.setDraft('0');
            game.check();
            game.next();
        }
    }
    assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('Intruso and Código attempts are independent and defaults are deterministic', () => {
    const intruso = createIntruso();
    const codigo = createCodigo();
    const otherIntruso = createIntruso(0);
    assert.equal(intruso.getState().round, 1);
    assert.equal(codigo.getState().round, 1);
    const unique = intruso.getState().colors.find(color => intruso.getState().colors.indexOf(color) === intruso.getState().colors.lastIndexOf(color));
    assert.equal(intruso.choose(intruso.getState().colors.indexOf(unique)), true);
    assert.equal(intruso.getState().score, 1);
    assert.equal(codigo.getState().score, 0);
    assert.deepEqual(intruso.getState().colors, createIntruso(DEFAULT_SEED).getState().colors);
    assert.deepEqual(otherIntruso.getState().colors, intruso.getState().colors);
});
