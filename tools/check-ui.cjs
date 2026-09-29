const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.NOVAR_BASE_URL || 'http://localhost:5080';
const output = path.resolve('artifacts/preview');
const routes = process.env.NOVAR_HOME_ONLY === '1' ? ['/'] : ['/', '/lentes/first'];
fs.mkdirSync(output, { recursive: true });

async function main() {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
    } catch (bundledError) {
        console.log('Bundled Chromium unavailable; trying installed Microsoft Edge.');
        browser = await chromium.launch({ headless: true, channel: 'msedge' });
    }
    const errors = [];
    const results = [];
    try {
        for (const route of routes) {
            for (const width of [1440, 1024, 768, 390, 320]) {
                const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
                const page = await context.newPage();
                page.on('pageerror', error => errors.push(`${route}@${width}: ${error.message}`));
                page.on('console', message => { if (message.type() === 'error') errors.push(`${route}@${width}: ${message.text()}`); });
                page.on('requestfailed', request => errors.push(`Failed request: ${request.url()} ${request.failure()?.errorText}`));
                page.on('response', response => { if (response.status() >= 400) errors.push(`Bad resource ${response.status()}: ${response.url()}`); });

                const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
                assert.equal(response.status(), 200, route);
                if (route === '/') {
                    assert.equal(await page.locator('[data-home-revision="home-fidelity-v2"]').count(), 1, 'Server still serves stale Home Razor; restart the app manually before verification');
                }
                await page.evaluate(async () => {
                    document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
                    await Promise.all([...document.images].map(image => image.decode()));
                    await document.fonts.ready;
                });
                const metrics = await page.evaluate(() => ({
                    viewport: innerWidth,
                    document: document.documentElement.scrollWidth,
                    broken: [...document.images].filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src),
                    h1: document.querySelectorAll('h1').length,
                    lang: document.documentElement.lang
                }));
                assert.equal(metrics.broken.length, 0, `Undecoded images: ${metrics.broken}`);
                assert.equal(metrics.h1, 1);
                assert.equal(metrics.lang, 'es');
                assert.ok(metrics.document <= metrics.viewport, `Horizontal overflow ${route}@${width}: ${JSON.stringify(metrics)}`);

                const firstClosed = page.locator('.accordion-button[aria-expanded="false"]').first();
                await firstClosed.focus();
                await page.keyboard.press('Enter');
                await page.waitForFunction(() => [...document.querySelectorAll('.accordion-button')].filter(x => x.getAttribute('aria-expanded') === 'true').length === 1);
                assert.equal(await firstClosed.getAttribute('aria-expanded'), 'true');
                const panel = page.locator(await firstClosed.getAttribute('data-bs-target'));
                await panel.waitFor({ state: 'visible' });
                assert.ok((await panel.innerText()).length > 10, 'Accordion answer is visible');

                const pending = route === '/' ? page.getByRole('button', { name: 'Por edad', exact: false }) : page.getByRole('button', { name: 'Personalizá tu lente' });
                await pending.click();
                const modal = page.locator('#pending-modal');
                await modal.waitFor({ state: 'visible' });
                assert.match(await modal.innerText(), /no se envían ni almacenan datos/);
                await page.keyboard.press('Tab');
                assert.ok(await page.evaluate(() => document.getElementById('pending-modal').contains(document.activeElement)), 'Modal contains keyboard focus');
                await page.keyboard.press('Escape');
                await modal.waitFor({ state: 'hidden' });
                assert.ok(await pending.evaluate(element => document.activeElement === element), 'Modal restores trigger focus');

                if (width < 992) {
                    await page.evaluate(() => scrollTo(0, 0));
                    const toggle = page.getByRole('button', { name: 'Abrir menú' });
                    await toggle.click();
                    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
                    await page.locator('#main-nav .nav-link').first().focus();
                    await page.keyboard.press('Escape');
                    await page.waitForFunction(() => !document.getElementById('main-nav').classList.contains('show'));
                    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
                }

                if (route === '/') {
                    assert.equal(await page.locator('#newsletter-email, .world-visual img[src*="world-poster"], .long-testimonial, .site-footer .sample-link').count(), 0);
                    assert.equal(await page.locator('.lens-card-image-mirrored').count(), 1);
                    assert.equal(await page.locator('.collage-tag img').count(), 5);
                    assert.equal(await page.locator('.world-shape-tall').count(), 4);
                    const correctionGeometry = await page.evaluate(() => {
                        const box = selector => document.querySelector(selector).getBoundingClientRect();
                        const main = box('.collage-main'), child = box('.collage-child'), sport = box('.collage-sport');
                        const drive = box('.tag-drive'), logo = box('.home-footer-logo');
                        return {
                            childOverlap: main.right > child.left && main.right < child.right,
                            sportOverlap: main.right > sport.left && main.right < sport.right,
                            mainLayer: +getComputedStyle(document.querySelector('.collage-main')).zIndex,
                            childLayer: +getComputedStyle(document.querySelector('.collage-child')).zIndex,
                            sportLayer: +getComputedStyle(document.querySelector('.collage-sport')).zIndex,
                            driveByChild: drive.top > child.top && drive.top < child.bottom && drive.right > child.right,
                            iconSizes: [...document.querySelectorAll('.collage-tag img')].map(img => ({ width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height, expectedWidth: +img.getAttribute('width'), expectedHeight: +img.getAttribute('height') })),
                            eyebrowBorder: getComputedStyle(document.querySelector('.treatment-copy .eyebrow')).borderTopStyle,
                            mirrored: getComputedStyle(document.querySelector('.lens-card-image-mirrored')).transform,
                            warrantyColor: getComputedStyle(document.querySelector('.warranty-panel button')).backgroundColor,
                            logo: { width: logo.width, height: logo.height }
                        };
                    });
                    assert.ok(correctionGeometry.childOverlap && correctionGeometry.sportOverlap, 'Side portraits overlap behind main image');
                    assert.ok(correctionGeometry.mainLayer > correctionGeometry.childLayer && correctionGeometry.mainLayer > correctionGeometry.sportLayer);
                    assert.ok(correctionGeometry.driveByChild, 'Car badge is beside child neck, not below main image');
                    for (const icon of correctionGeometry.iconSizes) {
                        assert.equal(icon.width, icon.expectedWidth, 'Original SVG width');
                        assert.equal(icon.height, icon.expectedHeight, 'Original SVG height');
                    }
                    assert.equal(correctionGeometry.eyebrowBorder, 'solid');
                    assert.equal(correctionGeometry.mirrored, 'matrix(-1, 0, 0, 1, 0, 0)');
                    assert.equal(correctionGeometry.warrantyColor, 'rgb(31, 2, 60)');
                    assert.deepEqual(correctionGeometry.logo, { width: 240, height: 32 });
                    assert.equal(await page.locator('.world-quote').count(), 1);
                    assert.equal(await page.locator('.world-quote').evaluate(element => Boolean(element.closest('[aria-hidden="true"]'))), false, 'Quote must not be hidden from assistive technology');
                    assert.deepEqual(await page.locator('.contact-socials button').evaluateAll(elements => elements.map(element => element.dataset.pending)), ['Instagram', 'LinkedIn', 'Facebook', 'YouTube']);
                    const fidelity = await page.evaluate(() => {
                        const style = selector => {
                            const css = getComputedStyle(document.querySelector(selector));
                            return { family: css.fontFamily, weight: css.fontWeight, size: parseFloat(css.fontSize), line: parseFloat(css.lineHeight), spacing: parseFloat(css.letterSpacing) || 0, transform: css.textTransform, fontStyle: css.fontStyle };
                        };
                        const rectangle = selector => {
                            const rect = document.querySelector(selector).getBoundingClientRect();
                            return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
                        };
                        return {
                            eyebrow: style('.treatment-copy .eyebrow'), treatmentHeading: style('.treatment-copy h2'),
                            benefit: style('.comfort-benefits li'), cta: style('.treatment-cta'), quote: style('.world-quote p'),
                            contactEyebrow: style('.contact-heading p'), contactHeading: style('.contact-heading h2'), label: style('.contact-form label'), send: style('.contact-submit .btn'),
                            details: rectangle('.contact-details'), message: rectangle('.contact-message'),
                            instagram: {
                                wrapper: rectangle('.contact-instagram'), outer: rectangle('.contact-instagram > img:first-child'),
                                center: rectangle('.instagram-center'), dot: rectangle('.instagram-dot')
                            },
                            socialGap: parseFloat(getComputedStyle(document.querySelector('.contact-socials')).columnGap),
                            socialButtons: [...document.querySelectorAll('.contact-socials button')].map(button => {
                                const rect = button.getBoundingClientRect();
                                return { x: rect.x, right: rect.right, width: rect.width, height: rect.height };
                            }),
                            assets: [...document.querySelectorAll('.comfort-icon img, .treatment-cta img, .contact-socials img')].map(img => ({ name: img.src.split('/').pop(), width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height, expectedWidth: +img.getAttribute('width'), expectedHeight: +img.getAttribute('height') })),
                            loadedFonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => ({ family: font.family, weight: font.weight }))
                        };
                    });
                    const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < .05, `${message}: ${actual}, expected ${expected}`);
                    const { wrapper, outer, center, dot } = fidelity.instagram;
                    near(outer.x, wrapper.x, 'Instagram frame starts at wrapper origin; stale CSS must not pass');
                    near(outer.y, wrapper.y, 'Instagram frame top origin');
                    near(center.x - wrapper.x, 6.414, 'Original Instagram circle horizontal offset');
                    near(center.y - wrapper.y, 6.826, 'Original Instagram circle vertical offset');
                    for (const piece of [center, dot]) {
                        assert.ok(piece.x >= outer.x && piece.y >= outer.y && piece.right <= outer.right && piece.bottom <= outer.bottom, 'Instagram inner pieces stay inside the frame');
                    }
                    near(fidelity.socialGap, 12, 'Contact social gap uses the current stylesheet');
                    for (const [index, button] of fidelity.socialButtons.entries()) {
                        assert.ok(button.width >= 44 && button.height >= 44, 'Contact social buttons retain 44px hit areas');
                        if (index > 0) near(button.x - fidelity.socialButtons[index - 1].right, 12, 'Actual space between contact social buttons');
                    }
                    assert.equal(fidelity.eyebrow.weight, '200');
                    near(fidelity.eyebrow.size, 16.6044, 'ExtraLight eyebrow size');
                    near(fidelity.eyebrow.line, 62.2665, 'ExtraLight eyebrow line height');
                    assert.equal(fidelity.eyebrow.transform, 'none');
                    assert.ok(fidelity.loadedFonts.some(font => font.family === 'Poppins' && font.weight === '200'), 'Actual local Poppins200 face loaded');
                    assert.equal(fidelity.contactEyebrow.weight, '400');
                    assert.equal(fidelity.contactHeading.weight, '600');
                    assert.equal(fidelity.contactHeading.fontStyle, 'normal');
                    near(fidelity.contactHeading.line, 36, 'Contact heading line height');
                    near(fidelity.contactHeading.spacing, -.78, 'Contact tracking');
                    near(fidelity.label.size, 16, 'Contact label size');
                    near(fidelity.label.line, 24, 'Contact label line height');
                    near(fidelity.quote.size, 12, 'Quote remains readable on mobile');
                    near(fidelity.cta.size, 14, 'Treatment button type');
                    assert.equal(fidelity.cta.weight, '400');
                    if (width >= 1200) {
                        near(fidelity.treatmentHeading.size, 36.869, 'Treatment heading desktop type');
                        near(fidelity.treatmentHeading.line, 41.293, 'Treatment heading desktop leading');
                    }
                    if (width >= 576) {
                        near(fidelity.contactHeading.size, 26, 'Contact heading desktop type');
                        assert.ok(fidelity.message.x >= fidelity.details.right && Math.abs(fidelity.message.y - fidelity.details.y) < 5, 'Desktop contact columns are side by side');
                    } else {
                        assert.ok(fidelity.message.y >= fidelity.details.bottom, 'Mobile contact fields stack');
                    }
                    for (const asset of fidelity.assets) {
                        near(asset.width, asset.expectedWidth, `${asset.name} root width`);
                        near(asset.height, asset.expectedHeight, `${asset.name} root height`);
                    }
                    const requests = [];
                    const watch = request => { if (request.method() !== 'GET' || request.isNavigationRequest()) requests.push(request.url()); };
                    page.on('request', watch);
                    await page.locator('#contact-name').fill('Muestra local');
                    await page.locator('#contact-email').fill('test@example.invalid');
                    await page.locator('#contact-email').press('Enter');
                    await modal.waitFor({ state: 'visible' });
                    await page.keyboard.press('Escape');
                    await modal.waitFor({ state: 'hidden' });
                    await page.locator('.contact-form button[data-pending]').click();
                    await modal.waitFor({ state: 'visible' });
                    await page.keyboard.press('Escape');
                    await modal.waitFor({ state: 'hidden' });
                    await page.locator('.warranty-panel button[data-pending]').click();
                    await modal.waitFor({ state: 'visible' });
                    assert.match(await page.locator('#pending-feature').innerText(), /Activación de garantía/);
                    await page.keyboard.press('Escape');
                    await modal.waitFor({ state: 'hidden' });
                    assert.deepEqual(requests, [], 'Demo forms must not send any request or navigation');
                    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0, 'No browser storage used');
                    page.off('request', watch);
                    await page.locator('form').evaluateAll(forms => forms.forEach(form => form.reset()));
                }

                // Return accordions to the supplied design state before screenshot evidence.
                await page.evaluate(() => {
                    document.querySelectorAll('.accordion-collapse').forEach((panel, i) => {
                        const open = location.pathname === '/' ? i === 0 : i === 3;
                        bootstrap.Collapse.getOrCreateInstance(panel, { toggle: false })[open ? 'show' : 'hide']();
                    });
                    scrollTo(0, 0);
                });
                await page.waitForTimeout(150);
                const filename = `${route === '/' ? 'home' : 'first'}-${width}.png`;
                await page.screenshot({ path: path.join(output, filename), fullPage: true });
                results.push({ route, width, height: await page.locator('body').evaluate(x => x.scrollHeight), overflow: false, screenshot: filename });
                await context.close();
            }
        }

        const context = await browser.newContext();
        const page = await context.newPage();
        for (const route of routes) {
            await page.goto(`${base}${route}`);
            const links = await page.locator('a[href^="/"]').evaluateAll(elements => [...new Set(elements.map(x => x.getAttribute('href').split('#')[0] || '/'))]);
            for (const link of links) {
                const response = await context.request.get(`${base}${link}`);
                assert.equal(response.status(), 200, `Broken internal navigation: ${link}`);
            }
        }
        await page.goto(base);
        await page.getByRole('link', { name: 'Muestra para revisión: conocé Novar First' }).click();
        await page.waitForURL('**/lentes/first');
        assert.match(await page.locator('h1').innerText(), /Novar First/);
        for (const route of ['/lentes/desconocido', '/lentes/myofix', '/no-existe']) {
            const response = await context.request.get(`${base}${route}`);
            assert.equal(response.status(), 404, `Expected a real 404: ${route}`);
        }
        await context.close();

        const noJs = await browser.newContext({ javaScriptEnabled: false });
        const noJsPage = await noJs.newPage();
        await noJsPage.goto(base);
        const submissions = [];
        noJsPage.on('request', request => { if (request.isNavigationRequest() || request.method() !== 'GET') submissions.push(request.url()); });
        await noJsPage.locator('#contact-name').fill('Offline sample');
        await noJsPage.locator('#contact-name').press('Enter');
        assert.equal(await noJsPage.locator('#newsletter-email').count(), 0);
        await noJsPage.locator('.warranty-panel button').click();
        await noJsPage.waitForTimeout(300);
        assert.deepEqual(submissions, [], 'No-JS forms must not navigate or submit');
        await noJs.close();

        assert.deepEqual(errors, [], 'Browser/resource errors');
        fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ status: 'passed', base, checks: 'Routes, 5 widths, images, resources, accordion, menu, modal keyboard/focus, local-only forms with and without JS, link integrity, 404', results }, null, 2));
        console.log(`PASS: ${results.length} page/viewport checks; keyboard, no-submit forms, links, 404, no errors. Screenshots: ${output}`);
    } finally {
        await browser.close();
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
