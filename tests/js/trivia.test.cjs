'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createTrivia } = require('../../src/Novar.Web/wwwroot/js/trivia-state.js');
const questions = require(path.resolve(__dirname, '../../src/Novar.Web/Content/games.json')).trivia.questions;
const key = [1, 1, 2, 1, 0, 1, 1, 3, 1, 3];

function finish(game, answer) {
    questions.forEach((question, index) => {
        assert.equal(game.getState().index, index);
        assert.equal(game.select(answer(question, index)), true);
        assert.equal(game.check(), true);
        assert.equal(game.next(), true);
    });
    return game.getState();
}

test('the single production bank has ten four-option questions and the supplied key', () => {
    assert.equal(questions.length, 10);
    assert.ok(questions.every(question => question.options.length === 4 && question.question.length > 0));
    assert.deepEqual(questions.map(question => question.correctIndex), key);
});

test('all correct yields ten aciertos only after the final next action', () => {
    const state = finish(createTrivia(questions), question => question.correctIndex);
    assert.equal(state.score, 10);
    assert.equal(state.complete, true);
});

test('all incorrect yields zero aciertos', () => {
    const state = finish(createTrivia(questions), question => (question.correctIndex + 1) % 4);
    assert.equal(state.score, 0);
    assert.equal(state.complete, true);
});

test('mixed answers yield exactly five aciertos', () => {
    const state = finish(createTrivia(questions), (question, index) => index % 2 === 0 ? question.correctIndex : (question.correctIndex + 1) % 4);
    assert.equal(state.score, 5);
    assert.deepEqual(state.answers, key.map((correct, index) => index % 2 === 0 ? correct : (correct + 1) % 4));
});

test('no selection, unchecked answers and repeated next cannot skip a question', () => {
    const game = createTrivia(questions);
    assert.equal(game.check(), false);
    assert.equal(game.next(), false);
    game.select(1);
    assert.equal(game.next(), false);
    game.check();
    assert.equal(game.next(), true);
    assert.equal(game.next(), false);
    assert.equal(game.getState().index, 1);
    assert.equal(game.getState().selected, null);
});

test('checking repeatedly or changing a checked answer cannot double-count', () => {
    const game = createTrivia(questions);
    game.select(1);
    assert.equal(game.check(), true);
    assert.equal(game.check(), false);
    assert.equal(game.select(0), false);
    assert.equal(game.getState().score, 1);
    assert.equal(game.getState().selected, 1);
    assert.equal(game.getState().correctIndex, 1);
});

test('changing an unchecked answer is allowed and only checked answer counts', () => {
    const game = createTrivia(questions);
    game.select(1);
    game.select(0);
    assert.equal(game.getState().score, 0);
    game.check();
    assert.equal(game.getState().score, 0);
    assert.equal(game.getState().answers[0], 0);
});

test('invalid indices are rejected without coercion or mutation', () => {
    const game = createTrivia(questions);
    const before = game.getState();
    for (const value of [-1, 4, 1.5, NaN, Infinity, null, undefined, '1', true, {}]) {
        assert.equal(game.select(value), false);
        assert.deepEqual(game.getState(), before);
    }
});

test('completed attempts ignore every repeated scoring and advance action', () => {
    const game = createTrivia(questions);
    finish(game, question => question.correctIndex);
    const before = game.getState();
    assert.equal(game.select(0), false);
    assert.equal(game.check(), false);
    assert.equal(game.next(), false);
    assert.deepEqual(game.getState(), before);
});

test('restart resets a partial or finished attempt and supports a different result', () => {
    const game = createTrivia(questions);
    game.select(1); game.check(); game.next(); game.select(3);
    game.restart();
    assert.deepEqual(game.getState(), createTrivia(questions).getState());
    finish(game, question => question.correctIndex);
    game.restart();
    assert.deepEqual(game.getState(), createTrivia(questions).getState());
    assert.equal(finish(game, question => (question.correctIndex + 1) % 4).score, 0);
});

test('snapshots are immutable and independent attempts do not share answers', () => {
    const game = createTrivia(questions);
    const snapshot = game.getState();
    assert.throws(() => { snapshot.answers[0] = 1; }, TypeError);
    assert.throws(() => { snapshot.score = 10; }, TypeError);
    game.select(1); game.check();
    assert.equal(snapshot.score, 0);
    assert.equal(createTrivia(questions).getState().score, 0);
});

test('invalid question banks fail closed before play', () => {
    for (const bank of [null, [], {}, [{ options: [], correctIndex: 0 }], [{ options: ['a', 'b', 'c', 'd'], correctIndex: 4 }]]) {
        assert.throws(() => createTrivia(bank), TypeError);
    }
});
