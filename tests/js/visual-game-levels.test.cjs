'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ROUND_COUNT, LEVEL_COUNT, intrusoLevels, codigoLevels, createIntruso, createCodigo } = require('../../src/Novar.Web/wwwroot/js/visual-games-state.js');

const glyphs = [
    '0111110/1100011/1100011/1100011/1100011/0111110',
    '0001000/0011000/0001000/0001000/0001000/0011100',
    '0111110/1100011/0000011/0001110/0110000/1111111',
    '0111110/1100011/0000011/0001110/1100011/0111110',
    '0000110/0001110/0010110/0100110/1111111/0000110',
    '1111111/1100000/1111110/0000011/1100011/0111110',
    '0011110/0110000/1100000/1111110/1100011/0111110',
    '0000000/0111100/0001100/0001000/0010000/0100000',
    '0111110/1100011/1100011/0111110/1100011/0111110',
    '0111110/1100011/1100011/0111111/0000011/0111110'
];
function decode(state) {
    return Array.from({ length: state.digits }, (_, digit) => {
        const pattern = state.mask.map(row => row.slice(digit * 8, digit * 8 + 7)).join('/');
        const answer = glyphs.indexOf(pattern);
        assert.notEqual(answer, -1, 'each signal must retain an unambiguous original glyph');
        return String(answer);
    }).join('');
}
function odd(state) {
    return state.colors.findIndex(color => state.colors.indexOf(color) === state.colors.lastIndexOf(color));
}
function finish(game, correct = true) {
    for (let round = 0; round < ROUND_COUNT; round++) {
        const state = game.getState();
        if (game.choose) game.choose(correct ? odd(state) : (odd(state) + 1) % state.colors.length);
        else {
            const answer = decode(state);
            game.check(correct ? answer : String((Number(answer) + 1) % (10 ** state.digits)).padStart(state.digits, '0'));
        }
        assert.equal(game.next(), true);
    }
    assert.equal(game.getState().complete, true);
}

test('Five difficulty presets increase search load and subtlety without a timer', () => {
    assert.equal(LEVEL_COUNT, 5);
    assert.equal(ROUND_COUNT, 3);
    assert.deepEqual(intrusoLevels.map(x => x.columns), [3, 3, 4, 4, 5]);
    assert.deepEqual(codigoLevels.map(x => x.digits), [1, 1, 2, 2, 3]);
    intrusoLevels.slice(1).forEach((x, i) => {
        assert.ok(x.hueDelta < intrusoLevels[i].hueDelta);
        assert.ok(x.lightnessDelta < intrusoLevels[i].lightnessDelta);
    });
    codigoLevels.slice(1).forEach((x, i) => assert.ok(x.noise >= codigoLevels[i].noise));
    assert.ok(Object.isFrozen(intrusoLevels) && Object.isFrozen(intrusoLevels[0]));
    assert.ok(Object.isFrozen(codigoLevels) && Object.isFrozen(codigoLevels[0]));
});

test('Every Intruso level has exactly one odd circle and three distinct target positions', () => {
    for (let seed = 1; seed <= 100; seed++) {
        const game = createIntruso(seed);
        for (let level = 1; level <= LEVEL_COUNT; level++) {
            game.selectLevel(level);
            const positions = [];
            for (let round = 0; round < ROUND_COUNT; round++) {
                const state = game.getState();
                assert.equal(state.colors.length, intrusoLevels[level - 1].columns ** 2);
                assert.equal(new Set(state.colors).size, 2);
                const target = odd(state);
                assert.ok(target >= 0);
                positions.push(target);
                assert.equal(game.choose(state.colors.length), false);
                assert.equal(game.choose(target), true);
                assert.equal(game.choose(target), false);
                game.next();
            }
            assert.equal(new Set(positions).size, ROUND_COUNT);
            assert.equal(game.getState().score, 3);
        }
    }
});

test('Every Código level retains valid glyphs; distractors cannot overwrite signal or separators', () => {
    let leadingZeros = 0;
    for (let seed = 1; seed <= 100; seed++) {
        const game = createCodigo(seed);
        for (let level = 1; level <= LEVEL_COUNT; level++) {
            game.selectLevel(level);
            for (let round = 0; round < ROUND_COUNT; round++) {
                const state = game.getState();
                assert.equal(state.digits, codigoLevels[level - 1].digits);
                assert.equal(state.columns, state.digits * 8 - 1);
                assert.equal(state.mask.length, 6);
                assert.equal(state.noise.length, state.columns * 6);
                assert.ok(Object.isFrozen(state.mask) && Object.isFrozen(state.noise));
                state.noise.forEach((noise, index) => {
                    if (noise) {
                        assert.notEqual((index % state.columns) % 8, 7);
                        assert.equal(state.mask.join('')[index], '0');
                    }
                });
                if (level === 1) assert.ok(state.noise.every(x => !x));
                const answer = decode(state);
                if (answer.length > 1 && answer.startsWith('0')) leadingZeros++;
                assert.equal(game.check(answer), true);
                assert.equal(game.getState().feedback.correct, true);
                assert.equal(game.getState().feedback.answer, answer);
                game.next();
            }
            assert.equal(game.getState().score, 3);
        }
    }
    assert.ok(leadingZeros > 0);
});

test('Multi-digit validation rejects incomplete, non-ASCII and malformed input without consuming a round', () => {
    const game = createCodigo(300);
    game.selectLevel(5);
    for (const value of ['', '0', '01', '0123', '1.2', ' 12', '12 ', '-12', '1e2', '１２３', '١٢٣', 'NaN', 123, null]) {
        assert.equal(game.check(value), false);
        assert.equal(game.getState().round, 1);
        assert.equal(game.getState().checked, false);
        assert.equal(game.getState().score, 0);
    }
    assert.equal(game.check('000'), true, 'leading zeros are valid and never converted to a number');
    assert.equal(game.check('000'), false, 'a checked round cannot be scored twice');
});

for (const [name, factory] of [['Intruso', createIntruso], ['Código', createCodigo]]) {
    test(`${name}: free level choice preserves attempts and rejects invalid levels`, () => {
        const game = factory(111);
        for (const value of [0, 6, 2.5, '2', undefined, null, NaN]) assert.equal(game.selectLevel(value), false);
        assert.equal(game.selectLevel(1), false);
        assert.equal(game.nextLevel(), false);
        if (game.choose) game.choose(odd(game.getState()));
        else game.setDraft('7');
        const saved = game.getState();
        assert.equal(game.selectLevel(5), true);
        assert.equal(game.getState().complete, false);
        assert.equal(game.selectLevel(1), true);
        assert.deepEqual(game.getState(), saved);
    });

    test(`${name}: three rounds complete a level; all five can finish, with no sixth level`, () => {
        const game = factory(111);
        for (let level = 1; level <= LEVEL_COUNT; level++) {
            assert.equal(game.getState().level, level);
            finish(game);
            const state = game.getState();
            assert.equal(state.progress.filter(x => x.complete).length, level);
            assert.equal(state.progress[level - 1].bestScore, 3);
            assert.equal(game.next(), false);
            assert.equal(game.nextLevel(), level < LEVEL_COUNT);
        }
        assert.equal(game.getState().level, 5);
        assert.equal(game.getState().complete, true);
    });

    test(`${name}: retry regenerates only the selected level and cannot reduce its best score`, () => {
        const game = factory(12345);
        game.selectLevel(2);
        if (game.setDraft) game.setDraft('8');
        const other = game.getState();
        game.selectLevel(5);
        const pattern = game.getState();
        finish(game);
        game.restart(98765);
        const retry = game.getState();
        assert.equal(retry.round, 1);
        assert.equal(retry.score, 0);
        assert.equal(retry.complete, false);
        assert.equal(retry.progress[4].bestScore, 3);
        assert.notDeepEqual(retry.colors || retry.mask, pattern.colors || pattern.mask);
        finish(game, false);
        assert.equal(game.getState().score, 0);
        assert.equal(game.getState().progress[4].bestScore, 3);
        game.selectLevel(2);
        const restored = game.getState();
        assert.deepEqual(restored.colors || restored.mask, other.colors || other.mask);
        assert.equal(restored.draft, other.draft);
        assert.equal(restored.round, other.round);
    });
}

test('Local page sessions and the two game progress records remain independent', () => {
    const intruso = createIntruso(42), codigo = createCodigo(42);
    intruso.selectLevel(5);
    finish(intruso);
    codigo.selectLevel(3);
    codigo.setDraft('02');
    assert.equal(intruso.getState().level, 5);
    assert.ok(intruso.getState().complete);
    assert.ok(codigo.getState().progress.every(x => !x.complete));
    const fresh = createIntruso(42);
    assert.equal(fresh.getState().level, 1);
    assert.ok(fresh.getState().progress.every(x => !x.complete));
});
