// Run only against the user's already-running preview; this never starts a server.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.NOVAR_BASE_URL || 'http://localhost:5080';
const output = path.resolve('artifacts/games-preview');
const widths = [1440, 1024, 768, 390, 320];
const triviaQuestions = require('../src/Novar.Web/Content/games.json').trivia.questions;
const visualApi = require('../src/Novar.Web/wwwroot/js/visual-games-state.js');
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

async function checkTrivia(page, width) {
    const card = page.locator('[data-trivia-start]');
    await card.focus();
    await page.keyboard.press('Enter');
    await page.locator('#trivia-panel').waitFor();
    assert.equal(await page.locator('#pending-modal').isVisible(), false, 'Trivia must not open a pending modal');
    assert.equal(await page.locator('#intruso-preview').isVisible(), false);
    assert.equal(await page.locator('#trivia-check').isDisabled(), true);
    const question = () => page.locator('[data-trivia-question]:visible');
    for (let index = 0; index < triviaQuestions.length; index++) {
        assert.equal(await question().count(), 1);
        assert.equal(await question().locator('legend').innerText(), triviaQuestions[index].question);
        assert.equal(await question().locator('legend').evaluate(el => el === document.activeElement), true);
        const correct = triviaQuestions[index].correctIndex;
        const selected = width === 1440 || index % 2 === 0 ? correct : (correct + 1) % 4;
        const radios = question().locator('input[type="radio"]');
        await radios.nth(selected).focus();
        await page.keyboard.press('Space');
        await page.locator('#trivia-check').focus();
        await page.keyboard.press('Enter');
        assert.match(await page.locator('#trivia-feedback').innerText(), selected === correct ? /¡Correcto!/ : /Respuesta incorrecta/);
        assert.equal(await question().locator('input:not([disabled])').count(), 0);
        assert.equal(await page.locator('#trivia-next').evaluate(el => el === document.activeElement), true);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Trivia overflow at ${width}, question ${index + 1}`);
        if (index === 9) await page.screenshot({ path: path.join(output, `trivia-bonus-${width}.png`), fullPage: true });
        await page.keyboard.press('Enter');
    }
    assert.equal(await page.locator('#trivia-score').innerText(), `Aciertos: ${width === 1440 ? 10 : 5}/10`);
    assert.equal(await page.locator('#trivia-score').evaluate(el => el === document.activeElement), true);
    await page.locator('#trivia-retry').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#trivia-progress').innerText(), 'Pregunta 1 de 10');
    assert.equal(await page.locator('#trivia-check').isDisabled(), true);
    assert.equal(await question().locator('input:checked').count(), 0);
    await question().locator('input').first().focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await question().locator('input:checked').count(), 1, 'Native radio arrow-key selection');
    await page.locator('[data-game-card="intruso"]').click();
    assert.equal(await page.locator('#trivia-panel').isVisible(), false);
    assert.equal(await page.locator('#intruso-preview').isVisible(), true);
    assert.equal(await page.locator('#pending-modal').isVisible(), false, 'Intruso must not open an empty pending modal');
    await card.click();
    assert.equal(await question().locator('input:checked').count(), 1, 'Switching games preserves the unsent in-memory choice');
    await page.locator('[data-game-card="intruso"]').click();
}

async function checkIntruso(page, width) {
    const card = page.locator('[data-visual-game-start="intruso"]');
    await card.focus();
    await page.keyboard.press('Enter');
    const panel = page.locator('#intruso-preview');
    assert.equal(await panel.isVisible(), true);
    assert.equal(await panel.locator('h2').evaluate(el => el === document.activeElement), true);
    let score = 0;
    let positions = [];
    for (let round = 1; round <= 5; round++) {
        assert.equal(await panel.locator('[data-visual-round]').innerText(), `Ronda ${round} de 5`);
        const choices = panel.locator('[data-intruso-choice]');
        assert.equal(await choices.count(), 9);
        const colors = await choices.evaluateAll(buttons => buttons.map(button => getComputedStyle(button).backgroundColor));
        const uniqueColors = [...new Set(colors)];
        assert.equal(uniqueColors.length, 2);
        const different = colors.indexOf(uniqueColors.find(color => colors.filter(value => value === color).length === 1));
        assert.notEqual(different, -1);
        positions.push(different);
        for (const button of await choices.all()) {
            assert.equal(await button.getAttribute('data-answer'), null);
            assert.match(await button.getAttribute('aria-label'), /^Opción [1-9]$/);
        }
        const chooseCorrect = width === 1440 || round % 2 === 1;
        if (chooseCorrect) score++;
        await choices.nth(chooseCorrect ? different : (different + 1) % 9).focus();
        await page.keyboard.press('Enter');
        assert.match(await panel.locator('[data-visual-feedback]').innerText(), chooseCorrect ? /¡Encontraste/ : /No era/);
        assert.equal(await panel.locator('[data-visual-next]').evaluate(el => el === document.activeElement), true);
        assert.equal(await panel.locator('[data-visual-score]').innerText(), `Puntaje: ${score}`);
        assert.equal(await choices.locator(':disabled').count(), 9);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Intruso overflow at ${width}, round ${round}`);
        await page.keyboard.press('Enter');
        if (round < 5) assert.equal(await choices.first().evaluate(el => el === document.activeElement), true);
    }
    assert.ok(new Set(positions).size > 1, 'Correct choice position varies by round');
    assert.equal(await panel.locator('[data-visual-result-title]').innerText(), `Puntaje final: ${score}/5`);
    assert.equal(await panel.locator('[data-visual-result-title]').evaluate(el => el === document.activeElement), true);
    await panel.locator('[data-visual-retry]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await panel.locator('[data-visual-round]').innerText(), 'Ronda 1 de 5');
    assert.equal(await panel.locator('[data-visual-score]').innerText(), 'Puntaje: 0');
}

async function checkCodigo(page, width) {
    const card = page.locator('[data-visual-game-start="codigo"]');
    await card.focus();
    await page.keyboard.press('Enter');
    const panel = page.locator('#codigo-panel');
    const input = panel.locator('#codigo-answer');
    assert.equal(await panel.isVisible(), true);
    assert.equal(await panel.locator('h2').evaluate(el => el === document.activeElement), true);
    assert.equal(await input.getAttribute('inputmode'), 'numeric');
    assert.equal(await input.getAttribute('data-answer'), null);
    assert.equal(await panel.locator('[data-codigo-dot]').count(), 42);

    // A draft survives switching to another panel; invisible controls are inert.
    await input.fill('4');
    await page.locator('[data-game-card="intruso"]').click();
    assert.equal(await input.isDisabled(), true);
    assert.equal(await input.inputValue(), '4');
    await card.click();
    assert.equal(await input.inputValue(), '4');

    let score = 0;
    for (let round = 1; round <= 5; round++) {
        assert.equal(await panel.locator('[data-visual-round]').innerText(), `Ronda ${round} de 5`);
        const mask = await panel.locator('[data-codigo-dot]').evaluateAll(dots => {
            const rows = [];
            for (let row = 0; row < 6; row++) rows.push(dots.slice(row * 7, row * 7 + 7).map(dot => dot.classList.contains('is-lit') ? '1' : '0').join(''));
            return rows;
        });
        assert.equal(await panel.locator('[data-codigo-matrix]').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(13, 13, 13)');
        const visibleColors = await panel.locator('[data-codigo-dot]').evaluateAll(dots => dots.map(dot => getComputedStyle(dot).backgroundColor));
        assert.equal(visibleColors.filter(color => color === 'rgb(131, 171, 233)').length, 42 - mask.join('').replaceAll('0', '').length);
        assert.ok(visibleColors.includes('rgb(0, 101, 255)'), 'the digit subset uses vivid blue');
        const answer = digitPatterns.findIndex(pattern => pattern.every((row, index) => row === mask[index]));
        assert.notEqual(answer, -1, `Round ${round} dots represent one readable digit`);
        assert.equal(await panel.locator('[data-visual-feedback]').innerText(), '');
        await input.fill(' 2');
        await panel.locator('[data-codigo-check]').click();
        assert.match(await panel.locator('[data-visual-feedback]').innerText(), /una sola cifra del 0 al 9/);
        assert.equal(await panel.locator('[data-visual-round]').innerText(), `Ronda ${round} de 5`);
        assert.equal(await panel.locator('[data-visual-score]').innerText(), `Puntaje: ${score}`);
        await input.fill('10');
        await panel.locator('[data-codigo-check]').click();
        assert.match(await panel.locator('[data-visual-feedback]').innerText(), /una sola cifra del 0 al 9/);
        const correct = width === 1440 || round % 2 === 1;
        if (correct) score++;
        await input.fill(String(correct ? answer : (answer + 1) % 10));
        await page.keyboard.press('Enter');
        assert.match(await panel.locator('[data-visual-feedback]').innerText(), correct ? /¡Número correcto/ : /El número era/);
        assert.equal(await panel.locator('[data-visual-next]').evaluate(el => el === document.activeElement), true);
        assert.equal(await panel.locator('[data-visual-score]').innerText(), `Puntaje: ${score}`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Código overflow at ${width}, round ${round}`);
        await page.keyboard.press('Enter');
        if (round < 5) {
            assert.equal(await input.evaluate(el => el === document.activeElement), true);
            assert.equal(await input.inputValue(), '');
        }
    }
    assert.equal(await panel.locator('[data-visual-result-title]').innerText(), `Puntaje final: ${score}/5`);
    assert.equal(await panel.locator('[data-visual-result-title]').evaluate(el => el === document.activeElement), true);
    await panel.locator('[data-visual-retry]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await panel.locator('[data-visual-round]').innerText(), 'Ronda 1 de 5');
    assert.equal(await panel.locator('[data-visual-score]').innerText(), 'Puntaje: 0');
    assert.equal(await input.inputValue(), '');
}

async function main() {
    fs.mkdirSync(output, { recursive: true });
    let browser;
    try { browser = await chromium.launch({ headless: true }); }
    catch { browser = await chromium.launch({ headless: true, channel: 'msedge' }); }
    const evidence = [];
    const errors = [];
    try {
        for (const width of widths) {
            const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
            const page = await context.newPage();
            page.on('pageerror', error => errors.push(error.message));
            page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
            page.on('requestfailed', request => errors.push(`Failed request: ${request.url()}`));
            page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
            assert.equal((await page.goto(`${base}/juegos`, { waitUntil: 'networkidle' })).status(), 200);
            assert.equal(await page.locator('[data-games-revision="games-v1"]').count(), 1,
                'Stale preview: the user must restart their app before Games runtime verification');
            assert.equal(await page.locator('[data-trivia-revision="trivia-v1"]').count(), 1,
                'Stale Trivia: the user must restart their app before verification');
            assert.equal(await page.locator('[data-visual-games-revision="visual-games-v1"]').count(), 1,
                'Stale visual games: the user must restart their app before verification');
            await page.evaluate(async () => {
                await Promise.all([...document.images].map(image => image.decode()));
                await document.fonts.ready;
            });
            const metrics = await page.evaluate(() => {
                const rect = selector => {
                    const r = document.querySelector(selector).getBoundingClientRect();
                    return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
                };
                const type = selector => {
                    const style = getComputedStyle(document.querySelector(selector));
                    return { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize, line: style.lineHeight };
                };
                return {
                    viewport: innerWidth, document: document.documentElement.scrollWidth,
                    heading: type('.games-intro h1'), number: type('.game-card-number'),
                    thinLoaded: [...document.fonts].some(font => font.family === 'Poppins' && font.weight === '100' && font.status === 'loaded'),
                    header: rect('.site-header'), cards: rect('.games-cards'), how: rect('.games-how-badge'),
                    arena: rect('.games-arena'), footer: rect('.games-footer'),
                    assets: [...document.querySelectorAll('.games-content img, .games-footer img, .site-header img')].map(image => {
                        const r = image.getBoundingClientRect();
                        return { file: image.src.split('/').pop(), naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
                            width: r.width, height: r.height, x: r.x, y: r.y + scrollY,
                            inCollapsedMenu: !!image.closest('#main-nav') && innerWidth < 1200 };
                    }),
                    colors: [...document.querySelectorAll('.games-color')].map(button => ({
                        size: button.getBoundingClientRect().width, color: getComputedStyle(button).backgroundColor
                    }))
                };
            });
            assert.ok(metrics.document <= width, `Horizontal overflow at ${width}: ${metrics.document}`);
            assert.equal(await page.locator('h1').count(), 1);
            assert.equal(await page.locator('[data-game-card]').count(), 3);
            assert.equal(await page.locator('.game-dot').count(), 125);
            assert.equal(await page.locator('.games-color').count(), 9);
            assert.equal(metrics.number.weight, '100');
            assert.ok(metrics.thinLoaded, 'Poppins Thin100 must load, not synthesize');
            assert.ok(metrics.assets.every(asset => asset.naturalWidth > 0 && (asset.width > 0 || asset.inCollapsedMenu)));
            assert.equal(new Set(metrics.assets.map(asset => asset.file)).size, 13);
            assert.ok(metrics.colors.every(color => color.size >= 44));
            assert.equal(new Set(metrics.colors.map(color => color.color)).size, 2);
            if (width === 1440) {
                const near = (actual, expected, label, tolerance = 3) => assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual}, expected ${expected}`);
                assert.equal(metrics.heading.size, '52px');
                assert.equal(metrics.heading.line, '57.2px');
                assert.equal(metrics.heading.weight, '300');
                near(metrics.header.x, 208, 'Header x');
                near(metrics.cards.y, 485, 'Cards y');
                near(metrics.how.y, 1059, 'How badge y');
                near(metrics.arena.x, 232, 'Arena x');
                near(metrics.arena.y, 1535, 'Arena y');
                near(metrics.footer.y, 2318, 'Footer y');
                for (const asset of metrics.assets) {
                    near(asset.width, asset.naturalWidth, `${asset.file} intrinsic width`, 1);
                    near(asset.height, asset.naturalHeight, `${asset.file} intrinsic height`, 1);
                }
            }
            await page.screenshot({ path: path.join(output, `games-${width}.png`), fullPage: true });
            await checkIntruso(page, width);
            await checkCodigo(page, width);
            await checkTrivia(page, width);
            if (width < 1200) {
                const menu = page.locator('.navbar-toggler');
                await menu.focus();
                await page.keyboard.press('Enter');
                await page.locator('#main-nav.show').waitFor();
                await page.locator('#main-nav a').first().focus();
                await page.keyboard.press('Escape');
                await page.locator('#main-nav.show').waitFor({ state: 'hidden' });
                await page.waitForFunction(() => document.querySelector('.navbar-toggler') === document.activeElement);
                assert.equal(await menu.evaluate(el => el === document.activeElement), true);
            }
            evidence.push({ width, metrics, keyboard: 'passed', visualGames: 'five rounds, score, retry and draft switching passed' });
            await context.close();
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, 'checks.json'), JSON.stringify({ evidence, errors }, null, 2));
        console.log(`Games runtime checks passed at ${widths.join(', ')}; screenshots and metrics: ${output}`);
    } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
