// Explicitly run only after browser authority and a fresh user-managed preview.
// This harness never starts, stops or restarts the application.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.NOVAR_BASE_URL || 'http://localhost:5080';
const output = path.resolve('artifacts/premium/browser');
const variants = [ ['ai-lens', 3, 2], ['myolens', 4, 3], ['aiwork', 4, 3] ];

async function main() {
    fs.mkdirSync(output, { recursive: true });
    let browser;
    try { browser = await chromium.launch({ headless: true }); }
    catch { browser = await chromium.launch({ headless: true, channel: 'msedge' }); }
    const results = [];
    try {
        for (const [slug, count, open] of variants) {
            for (const width of [1440, 1024, 768, 390, 320]) {
                const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
                const page = await context.newPage();
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
                page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
                page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
                const response = await page.goto(`${base}/lentes/${slug}`, { waitUntil: 'networkidle' });
                assert.equal(response.status(), 200);
                assert.equal(await page.locator('[data-premium-revision="premium-v1"]').count(), 1,
                    'Fresh Premium Razor is not served; request manual user restart, never operate the server.');
                await page.evaluate(async () => {
                    document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
                    await Promise.all([...document.images].map(image => image.decode()));
                    await document.fonts.ready;
                });
                const geometry = await page.evaluate(() => ({
                    viewport: innerWidth,
                    document: document.documentElement.scrollWidth,
                    headings: document.querySelectorAll('h1').length,
                    faqHeading: document.querySelector('#premium-faq-title').textContent,
                    assets: [...document.images].map(image => ({
                        src: image.getAttribute('src'), naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
                        width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height,
                        fit: getComputedStyle(image).objectFit, position: getComputedStyle(image).objectPosition
                    })),
                    sections: [...document.querySelectorAll('.premium-product > *, .premium-footer')].map(element => ({
                        className: element.className, y: element.getBoundingClientRect().top + scrollY,
                        width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height
                    }))
                }));
                assert.ok(geometry.document <= width, `${slug}@${width}: horizontal overflow`);
                assert.equal(geometry.headings, 1);
                assert.match(geometry.faqHeading, /Preguntas\s+frecuentes/);
                assert.ok(geometry.assets.every(asset => asset.naturalWidth > 0 && asset.width > 0 && asset.height > 0));
                const faq = page.locator('.premium-faq');
                assert.equal(await faq.locator('.accordion-button').count(), count);
                assert.equal(await faq.locator('.accordion-button[aria-expanded="true"]').count(), 1);
                assert.equal(await page.locator(`#premium-${slug}-faq-${open}`).getAttribute('class'), 'accordion-collapse collapse show');
                await page.screenshot({ path: path.join(output, `${slug}-${width}.png`), fullPage: true });
                const first = faq.locator('.accordion-button').first();
                await first.focus();
                await page.keyboard.press('Enter');
                await page.locator(`#premium-${slug}-faq-0.show`).waitFor();
                assert.equal(await first.getAttribute('aria-expanded'), 'true');
                assert.equal(await faq.locator('.accordion-collapse.show').count(), 1);
                assert.match(await page.locator(`#premium-${slug}-faq-0`).innerText(), /Respuesta pendiente de revisión editorial/);
                const instagram = page.locator('.premium-footer [data-pending="Instagram"]');
                await instagram.click();
                await page.locator('#pending-modal.show').waitFor();
                await page.keyboard.press('Escape');
                await page.locator('#pending-modal').waitFor({ state: 'hidden' });
                assert.equal(await instagram.evaluate(element => element === document.activeElement), true);
                if (width < 1200) {
                    await page.locator('.navbar-toggler').click();
                    await page.locator('#main-nav.show').waitFor();
                    assert.equal(await page.locator('.navbar-toggler').getAttribute('aria-expanded'), 'true');
                }
                assert.deepEqual(errors, []);
                results.push({ slug, width, geometry, errors });
                await context.close();
            }
        }
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
        console.log(`Premium checks passed: ${results.length} page/viewport combinations. Visual approval remains human-owned.`);
    } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
