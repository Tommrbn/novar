(function (root) {
    'use strict';

    function createTrivia(questions) {
        if (!Array.isArray(questions) || questions.length === 0 || questions.some(question =>
            !Array.isArray(question.options) || question.options.length !== 4 ||
            !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3)) {
            throw new TypeError('Trivia requires questions with four options and a valid answer key.');
        }
        const key = questions.map(question => question.correctIndex);
        let index, selected, answers, score, complete;

        function restart() {
            index = 0;
            selected = null;
            answers = Array(key.length).fill(null);
            score = 0;
            complete = false;
        }
        function getState() {
            return Object.freeze({
                index, selected, score, complete, total: key.length,
                checked: answers[index] !== null,
                correctIndex: answers[index] !== null ? key[index] : null,
                answers: Object.freeze([...answers])
            });
        }
        function select(optionIndex) {
            if (complete || answers[index] !== null || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) return false;
            selected = optionIndex;
            return true;
        }
        function check() {
            if (complete || answers[index] !== null || selected === null) return false;
            answers[index] = selected;
            if (selected === key[index]) score += 1;
            return true;
        }
        function next() {
            if (complete || answers[index] === null) return false;
            if (index === key.length - 1) complete = true;
            else { index += 1; selected = null; }
            return true;
        }
        restart();
        return Object.freeze({ getState, select, check, next, restart });
    }

    const api = Object.freeze({ createTrivia });
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.NovarTrivia = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
