// Optional repeatable runtime proof against the user's existing preview.
// This task syntax-checks only; current parent live inspection uses CUA.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.NOVAR_BASE_URL || 'http://localhost:5080';
const output = path.resolve('artifacts/lens-finder-routing-evidence/runtime');
const widths = [1440, 1024, 768, 390, 320];
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1, `${label}: ${actual} vs ${expected}`);

async function geometry(page) {
    return page.locator('.lens-finder-column').evaluate(column => {
        const measure = element => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
                x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                font: style.fontFamily, size: style.fontSize, weight: style.fontWeight,
                line: style.lineHeight, color: style.color, background: style.backgroundColor,
                gap: style.gap, padding: style.padding, border: style.borderBottomColor
            };
        };
        return {
            column: measure(column),
            title: measure(column.querySelector('h1')),
            titleSecond: measure(column.querySelector('h1 span')),
            description: measure(column.querySelector('.lens-finder-description')),
            emphasis: [...column.querySelectorAll('strong')].map(measure),
            filters: measure(column.querySelector('.lens-finder-filters')),
            rows: [...column.querySelectorAll('.lens-finder-filter')].map(measure),
            cta: measure(column.querySelector('.lens-finder-cta')),
            icons: [...column.querySelectorAll('img')].map(image => ({
                ...measure(image), source: image.getAttribute('src'),
                naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
                complete: image.complete
            })),
            fonts: [...document.fonts].filter(font => font.family === 'Poppins').map(font => ({ weight: font.weight, status: font.status }))
        };
    });
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
            page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
            page.on('requestfailed', request => errors.push(`${width}: ${request.url()}`));
            page.on('response', response => { if (response.status() >= 400) errors.push(`${width}: ${response.status()} ${response.url()}`); });
            const response = await page.goto(`${base}/lentes`, { waitUntil: 'networkidle' });
            assert.equal(response.status(), 200);
            const root = page.locator('[data-lens-finder-revision="lens-finder-routing-v1"]');
            assert.equal(await root.count(), 1, 'Stale Razor: the user must refresh/rebuild the preview before runtime proof');
            await page.evaluate(async () => {
                await document.fonts.ready;
                await Promise.all([...document.images].map(image => image.decode()));
            });
            assert.equal(await root.locator('.lens-finder-filter').count(), 3);
            assert.equal(await root.locator('button[data-pending], form').count(), 0);
            assert.equal(await root.locator('#lens-finder-all a').count(), 18);
            assert.equal(await root.locator('details').count(), 3);
            assert.equal(await root.getAttribute('data-finder-ready'), 'true');
            assert.deepEqual(await root.locator('.lens-finder-filter span').allTextContents(), [
                'Por edad', 'Por necesidad', 'Por actividades y preferencias'
            ]);
            assert.equal(await page.locator('.navbar a[href="/lentes"]').getAttribute('aria-current'), 'page');
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);

            const metrics = await geometry(page);
            assert.ok(metrics.column.width <= 560);
            assert.match(metrics.title.font, /Poppins/);
            assert.equal(metrics.title.size, '40px');
            assert.equal(metrics.title.weight, '300');
            assert.equal(metrics.title.color, 'rgb(9, 14, 23)');
            assert.equal(metrics.titleSecond.weight, '400');
            assert.equal(metrics.titleSecond.color, 'rgb(31, 2, 60)');
            assert.equal(metrics.description.weight, '300');
            assert.equal(metrics.description.size, '14px');
            assert.equal(metrics.description.line, '22px');
            assert.equal(metrics.description.color, 'rgb(107, 90, 138)');
            metrics.emphasis.forEach(text => {
                assert.equal(text.weight, '500');
                assert.equal(text.color, 'rgb(26, 18, 40)');
            });
            ['300', '400', '500'].forEach(weight => assert.ok(metrics.fonts.some(font => font.weight === weight && font.status === 'loaded'), `Missing loaded Poppins ${weight}`));
            near(metrics.description.y - metrics.title.y - metrics.title.height, 8, 'Heading/description gap');
            near(metrics.filters.y - metrics.description.y - metrics.description.height, 24, 'Description/filters gap');
            assert.ok(metrics.cta.y > metrics.filters.y + metrics.filters.height, 'Filters precede catalog CTA');
            metrics.rows.forEach(row => {
                assert.equal(row.weight, '500');
                assert.equal(row.size, '14px');
                assert.equal(row.line, '20px');
                assert.equal(row.border, 'rgba(123, 94, 167, 0.12)');
                assert.ok(row.height >= 53);
            });
            near(metrics.cta.width, 247, 'CTA width');
            near(metrics.cta.height, 48, 'CTA height');
            assert.equal(metrics.cta.background, 'rgb(31, 2, 60)');
            assert.equal(metrics.cta.weight, '400');
            assert.equal(metrics.cta.gap, '12px');
            if (width >= 768) {
                near(metrics.column.width, 560, 'Desktop column');
                near(metrics.title.height, 96, 'Two title lines');
                near(metrics.description.height, 44, 'Source paragraph');
                metrics.rows.forEach(row => near(row.height, 53, 'Source row'));
            }
            metrics.icons.forEach((icon, index) => {
                const size = index < 3 ? 14 : 15;
                const file = index < 3 ? 'f3d35.svg' : 'e3b22.svg';
                assert.ok(icon.complete && icon.source.endsWith(file));
                near(icon.width, size, 'Icon effective width');
                near(icon.height, size, 'Icon effective height');
                assert.equal(icon.naturalWidth, size);
                assert.equal(icon.naturalHeight, size);
                const slot = index < 3 ? metrics.rows[index] : metrics.cta;
                near(icon.y + icon.height / 2, slot.y + (slot.height - (index < 3 ? 1 : 0)) / 2, 'Icon vertical slot');
                near(icon.x + icon.width, slot.x + slot.width - (index < 3 ? 0 : 28), 'Icon right slot');
            });
            await page.screenshot({ path: path.join(output, `lens-finder-${width}.png`), fullPage: true });
            const summaries = root.locator('.lens-finder-filter');
            for (let index = 0; index < 3; index++) {
                await summaries.nth(index).focus();
                assert.equal(await summaries.nth(index).evaluate(e => e.matches(':focus-visible')), true);
                await page.keyboard.press('Enter');
                assert.equal(await root.locator('details').nth(index).evaluate(e => e.open), true);
            }
            const requests = [];
            page.on('request', request => requests.push(request.url()));
            const reset = root.locator('#lens-finder-reset');
            const cards = root.locator('#lens-finder-result-list > li');
            const resultSlugs = () => cards.evaluateAll(items => items.map(item => item.dataset.product));
            assert.equal(await root.locator('#lens-finder-status').innerText(), '');
            assert.equal(await cards.count(), 0);
            assert.equal(await root.locator('.lens-finder-notice').count(), 0);
            assert.equal(await root.locator('#lens-finder-reset').innerText(), 'Limpiar filtros');
            const cases = [
                ['progressive', 'first-experience', ['first']],
                ['progressive', 'balanced', ['precisa']],
                ['progressive', 'amplitude', ['evolution']],
                ['progressive', 'digital', ['elife']],
                ['progressive', 'progressive-ai', ['ai-lens']],
                ['monofocal', 'one-distance', ['single-vision']],
                ['monofocal', 'personalization', ['geo']],
                ['monofocal', 'myopia-comfort', ['myolens']],
                ['monofocal', 'sport', ['outdoor']],
                ['monofocal', 'near-support', ['indoor']],
                ['monofocal', 'thickness', ['geo', 'slim']],
                ['occupational', 'desk', ['office']],
                ['occupational', 'work-ai', ['aiwork']],
                ['bifocal', 'round', ['ultex-blended']],
                ['bifocal', 'freeform', ['kriptok-blended']],
                ['bifocal', 'discreet', ['kriptok-blended', 'freeline']]
            ];
            for (const [need, preference, expected] of cases) {
                await reset.click();
                await root.locator('[data-need][value="' + need + '"]').check();
                await root.locator('[data-preference][value="' + preference + '"]').check();
                assert.deepEqual(await resultSlugs(), expected, 'Filter changes refresh results automatically');
                assert.deepEqual(await resultSlugs(), expected);
                assert.equal(new URL(page.url()).pathname, '/lentes');
            }
            for (const [preference, slug] of [['balanced', 'precisa-short'], ['amplitude', 'evolution-short']]) {
                await reset.click();
                await root.locator('[data-need][value="progressive"]').check();
                await root.locator('[data-preference][value="' + preference + '"]').check();
                await root.locator('#lens-finder-compact').check();
                assert.deepEqual(await resultSlugs(), [slug]);
            }
            await reset.click();
            await root.locator('[data-need][value="bifocal"]').check();
            await root.locator('[data-preference][value="discreet"]').check();
            await root.locator('[data-preference][value="freeform"]').check();
            assert.deepEqual(await resultSlugs(), ['kriptok-blended']);
            await root.locator('[data-preference][value="round"]').check();
            assert.equal(await cards.count(), 0);
            assert.match(await root.locator('#lens-finder-status').innerText(), /No encontramos una coincidencia exacta/);
            await root.locator('[data-need][value="progressive"]').check();
            assert.equal(await root.locator('[data-preference]:checked').count(), 0);
            await root.locator('[data-preference][value="first-experience"]').check();
            for (const age of ['', '0', '42', '100']) {
                await root.locator('#lens-finder-age').fill(age);
                assert.deepEqual(await resultSlugs(), ['first']);
            }
            const ageInput = root.locator('#lens-finder-age');
            await ageInput.focus();
            const scrollBeforeInvalidAge = await page.evaluate(() => window.scrollY);
            await root.locator('#lens-finder-age').fill('1.5');
            assert.equal(await cards.count(), 0);
            assert.match(await root.locator('#lens-finder-status').innerText(), /edad es opcional/);
            assert.equal(await ageInput.evaluate(element => element === document.activeElement), true, 'Age validation does not move focus');
            assert.equal(await page.evaluate(() => window.scrollY), scrollBeforeInvalidAge, 'Age validation does not scroll');
            await reset.click();
            assert.equal(await root.locator('#lens-finder-status').innerText(), '', 'Empty reset state stays quiet');
            await root.locator('[data-need][value="unsure"]').check();
            assert.equal(await cards.count(), 18);
            await reset.click();
            assert.equal(await cards.count(), 0);
            assert.equal(await root.locator('[data-need]:checked, [data-preference]:checked').count(), 0);
            assert.equal(await root.locator('#lens-finder-age').inputValue(), '');
            await root.locator('.lens-finder-cta').press('Enter');
            assert.equal(new URL(page.url()).hash, '#lens-finder-all');
            assert.equal(await root.locator('#lens-finder-all a').count(), 18);
            assert.deepEqual(requests, [], 'No answer-related network request');
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            await page.screenshot({ path: path.join(output, 'lens-finder-open-' + width + '.png'), fullPage: true });
            evidence.push({ width, metrics, approvedBranches: cases.length, noAnswerRequests: true, overflow: false });
            await context.close();
        }
        for (const failure of ['no-js', 'script-load-failure']) {
            const context = await browser.newContext({ viewport: { width: 320, height: 1000 }, javaScriptEnabled: failure !== 'no-js' });
            const page = await context.newPage();
            if (failure === 'script-load-failure') await page.route('**/js/lens-finder*.js*', route => route.abort());
            await page.goto(base + '/lentes', { waitUntil: 'networkidle' });
            assert.equal(await page.locator('#lens-finder-all a').count(), 18);
            assert.equal(await page.locator('#lens-finder-reset').isDisabled(), true);
            assert.equal(await page.locator('#lens-finder-submit').count(), 0);
            assert.equal(await page.locator('.lens-finder-base form').count(), 0);
            await page.locator('.lens-finder-filter').first().press('Enter');
            assert.equal(await page.locator('.lens-finder-filters details').first().evaluate(e => e.open), true);
            evidence.push({ failure, fallbackLinks: 18, noForm: true });
            await context.close();
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(evidence, null, 2));
        console.log(`Lens finder: ${widths.length} widths, source geometry, original icons, approved branches, keyboard controls, age neutrality and no-JS/load-failure links passed.`);
    } finally {
        await browser.close();
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
