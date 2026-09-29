// Scoped runtime proof only; connect to the user's existing preview, never start a server.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.NOVAR_BASE_URL || 'http://localhost:5080';
const output = path.resolve('artifacts/treatments-preview');
const widths = [1440, 1083, 1024, 768, 390, 320];
const svgSizes = {
    'b9b6a.svg': [56.401, 30.6381], '7bc95.svg': [10.2128, 10.2128],
    '4e27d.svg': [1089.22, .748092], 'cfa16.svg': [135.405, 3.74046],
    'ef8cd.svg': [13.9265, 13.9265], '4fa2a.svg': [22.3059, 18.2378],
    'f87fc.svg': [22.923, 18.4942], '97fd8.svg': [22.0033, 18.7179],
    'dabcc.svg': [21.9854, 18.5251], 'e27ca.svg': [18.2751, 18.2783],
    'c8445.svg': [17.1763, 17.1763], 'fa384.svg': [17.1704, 17.1746],
    'b21e2.svg': [17.1743, 17.1758],
    '9daba.svg': [17.1763, 17.1763], 'e3672.svg': [24.4617, 17.1758],
    'ba1ea.svg': [12.0696, 12.0696], '4d514.svg': [91, 15.1665],
    '8e61b.svg': [91, 15.1665], '843a7.svg': [91, 15.1667], '279a2.svg': [91, 15.1667]
};
const near = (actual, expected, label, tolerance = 3) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual}, expected ${expected}`);

async function verifyBlueTech(page, width) {
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('[data-treatments-revision]').dataset.activeTreatment === 'blue-tech');
    assert.equal(new URL(page.url()).hash, '#blue-tech');
    assert.equal(await page.locator('#treatment-tab-blue-tech').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('.treatments-tabs [aria-current="true"]').count(), 1);
    assert.equal(await page.locator('#uv').isVisible(), false);
    assert.equal(await page.locator('#blue-tech').isVisible(), true);
    await verifyTreatmentLogos(page);
    assert.equal(await page.locator('.treatments-linkedin-default').isVisible(), false);
    assert.equal(await page.locator('.treatments-linkedin-blue-tech').isVisible(), true);
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
        const rect = element => {
            const r = element.getBoundingClientRect();
            return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
        };
        const box = selector => rect(document.querySelector(selector));
        const type = selector => {
            const s = getComputedStyle(document.querySelector(selector));
            return { family: s.fontFamily, weight: s.fontWeight, size: s.fontSize, line: s.lineHeight, spacing: s.letterSpacing };
        };
        return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            summary: box('.treatment-blue-tech-summary'), photo: box('.treatment-blue-tech-photo'),
            benefits: box('.treatment-blue-tech-benefits'), underline: box('.treatments-tabs-active'),
            badges: [...document.querySelectorAll('.treatment-blue-tech-benefits li')].map(rect),
            circles: [...document.querySelectorAll('.treatment-blue-tech-benefits .treatment-benefit-check')].map(rect),
            heading: type('#treatment-blue-tech-title'), description: type('.treatment-blue-tech-description'),
            badge: type('.treatment-blue-tech-benefits li'), activeTab: type('#treatment-tab-blue-tech'),
            layer: getComputedStyle(document.querySelector('.treatment-blue-tech-summary')).zIndex,
            crop: getComputedStyle(document.querySelector('.treatment-blue-tech-photo')).overflow,
            fonts: [...document.fonts].filter(font => font.family === 'Poppins' && font.status === 'loaded').map(font => font.weight),
            assets: [...document.querySelectorAll('.treatments-content img, .treatments-footer img, .site-header img')]
                .filter(image => !image.closest('[hidden]') && getComputedStyle(image).display !== 'none')
                .map(image => ({ file: image.src.split('/').pop(), ...rect(image), naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight, objectFit: getComputedStyle(image).objectFit,
                    inCollapsedMenu: !!image.closest('#main-nav') && innerWidth < 1200 }))
        };
    });
    assert.ok(metrics.overflow <= 0, `Blue Tech overflow at ${width}: ${metrics.overflow}`);
    assert.equal(metrics.layer, '2');
    assert.equal(metrics.crop, 'hidden');
    assert.equal(new Set(metrics.assets.map(asset => asset.file)).size, 18);
    assert.ok(metrics.assets.every(asset => asset.naturalWidth > 0 && (asset.width > 0 || asset.inCollapsedMenu)));
    for (const asset of metrics.assets) {
        if (svgSizes[asset.file] && !asset.inCollapsedMenu) {
            near(asset.width, svgSizes[asset.file][0], `Blue Tech ${asset.file} width`, .02);
            near(asset.height, svgSizes[asset.file][1], `Blue Tech ${asset.file} height`, .02);
        }
    }
    for (const weight of ['300', '400', '600']) assert.ok(metrics.fonts.includes(weight), `Poppins${weight} must load`);
    metrics.assets.filter(asset => asset.file === '7bc95.svg').forEach((asset, index) => {
        const circle = metrics.circles[index];
        assert.ok(asset.x >= circle.x && asset.x + asset.width <= circle.x + circle.width);
        assert.ok(asset.y >= circle.y && asset.y + asset.height <= circle.y + circle.height);
    });
    const photo = metrics.assets.find(asset => asset.file === 'f0cf4.png');
    assert.equal(photo.naturalWidth, 1448);
    assert.equal(photo.naturalHeight, 1086);
    assert.equal(photo.objectFit, 'cover');
    if (width === 1440) {
        near(metrics.summary.x, 129.2085, 'Blue Tech card x');
        near(metrics.summary.y, 758, 'Blue Tech card y');
        near(metrics.summary.width, 1181.583, 'Blue Tech card width');
        near(metrics.summary.height, 178, 'Blue Tech card height');
        near(metrics.photo.y, 893, 'Blue Tech crop top');
        near(metrics.photo.height, 680, 'Blue Tech crop height');
        near(photo.x, -124, 'Blue Tech image x');
        near(photo.width, 1684, 'Blue Tech image width');
        near(photo.height, 937.707, 'Blue Tech image height');
        near(metrics.benefits.x, 353, 'Blue Tech benefits x');
        near(metrics.benefits.y, 1550, 'Blue Tech benefits y');
        metrics.badges.forEach((badge, i) => near(badge.width, [191, 248, 212][i], `Badge${i} width`, .1));
        near(metrics.underline.x, 322, 'Blue Tech active underline x');
        assert.equal(metrics.heading.size, '30.085px');
        assert.equal(metrics.heading.weight, '400');
        assert.equal(metrics.description.size, '15.042px');
        assert.equal(metrics.badge.size, '14.748px');
        assert.equal(metrics.badge.weight, '300');
        assert.equal(metrics.activeTab.size, '16.458px');
        assert.equal(metrics.activeTab.weight, '600');
    }
    await page.screenshot({ path: path.join(output, `blue-tech-${width}.png`), fullPage: true });
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('#uv').hidden === false);
    await page.goForward();
    await page.waitForFunction(() => document.querySelector('#blue-tech').hidden === false);
    await page.locator('#treatment-tab-blue-tech').focus();
    for (const [key, expected] of [["Home","uv"],["End","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["ArrowLeft","polarizado"],["ArrowLeft","antirraya"],["ArrowLeft","blue-tech"],["ArrowLeft","uv"],["ArrowRight","blue-tech"],["Space","blue-tech"]]) {
        await page.keyboard.press(key);
        assert.equal(new URL(page.url()).hash, `#${expected}`);
        assert.equal(await page.locator(`#treatment-tab-${expected}`).evaluate(element => element === document.activeElement), true);
    }
    await page.goto(`${base}/tratamientos#blue-tech`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#blue-tech').isVisible(), true);
    await verifyTreatmentLogos(page);
    await page.evaluate(() => { location.hash = '%E0%A4%A'; });
    await page.waitForFunction(() => document.querySelector('#uv').hidden === false);
    await page.evaluate(() => { location.hash = 'unknown'; });
    await page.waitForFunction(() => document.querySelector('#uv').hidden === false);
    await page.locator('#treatment-tab-blue-tech').click();
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    return metrics;
}

async function verifyAntirraya(page, width) {
    await page.locator('#treatment-tab-antirraya').click();
    assert.equal(new URL(page.url()).hash, '#antirraya');
    assert.equal(await page.locator('#treatment-tab-antirraya').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    assert.equal(await page.locator('#antirraya').isVisible(), true);
    await verifyTreatmentLogos(page);
    assert.equal(await page.locator('.treatments-linkedin-default').isVisible(), false);
    assert.equal(await page.locator('.treatments-linkedin-blue-tech').isVisible(), true);
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
        const rect = element => {
            const r = element.getBoundingClientRect();
            return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
        };
        const box = selector => rect(document.querySelector(selector));
        const type = selector => {
            const style = getComputedStyle(document.querySelector(selector));
            return { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize, line: style.lineHeight };
        };
        return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            summary: box('.treatment-antirraya-summary'), photo: box('.treatment-antirraya-photo'),
            plane: box('.treatment-antirraya-image-plane'), benefits: box('.treatment-antirraya-benefits'),
            underline: box('.treatments-tabs-active'),
            badges: [...document.querySelectorAll('.treatment-antirraya-benefits li')].map(rect),
            circles: [...document.querySelectorAll('.treatment-antirraya-benefits .treatment-benefit-check')].map(rect),
            heading: type('#treatment-antirraya-title'), description: type('.treatment-antirraya-description'),
            badge: type('.treatment-antirraya-benefits li'), tab: type('#treatment-tab-antirraya'),
            layer: getComputedStyle(document.querySelector('.treatment-antirraya-summary')).zIndex,
            crop: getComputedStyle(document.querySelector('.treatment-antirraya-photo')).overflow,
            fonts: [...document.fonts].filter(font => font.family === 'Poppins' && font.status === 'loaded').map(font => font.weight),
            assets: [...document.querySelectorAll('.treatments-content img, .treatments-footer img, .site-header img')]
                .filter(image => !image.closest('[hidden]') && getComputedStyle(image).display !== 'none')
                .map(image => ({ file: image.src.split('/').pop(), ...rect(image), naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight, inCollapsedMenu: !!image.closest('#main-nav') && innerWidth < 1200 }))
        };
    });
    assert.ok(metrics.overflow <= 0, `Antirraya overflow at ${width}: ${metrics.overflow}`);
    assert.equal(metrics.layer, '2');
    assert.equal(metrics.crop, 'hidden');
    assert.equal(new Set(metrics.assets.map(asset => asset.file)).size, 18);
    for (const weight of ['300', '400', '700']) assert.ok(metrics.fonts.includes(weight), `Poppins${weight} must load`);
    for (const asset of metrics.assets) {
        assert.ok(asset.naturalWidth > 0 && (asset.width > 0 || asset.inCollapsedMenu));
        if (svgSizes[asset.file] && !asset.inCollapsedMenu) {
            near(asset.width, svgSizes[asset.file][0], `Antirraya ${asset.file} width`, .02);
            near(asset.height, svgSizes[asset.file][1], `Antirraya ${asset.file} height`, .02);
        }
    }
    metrics.assets.filter(asset => asset.file === '7bc95.svg').forEach((asset, index) => {
        const circle = metrics.circles[index];
        assert.ok(asset.x >= circle.x && asset.x + asset.width <= circle.x + circle.width);
        assert.ok(asset.y >= circle.y && asset.y + asset.height <= circle.y + circle.height);
    });
    const image = metrics.assets.find(asset => asset.file === '3dd09.png');
    assert.equal(image.naturalWidth, 2752);
    assert.equal(image.naturalHeight, 1536);
    if (width === 1440) {
        near(metrics.summary.x, 129, 'Antirraya card x');
        near(metrics.summary.y, 758, 'Antirraya card y');
        near(metrics.summary.width, 1181.583, 'Antirraya card width');
        near(metrics.summary.height, 178, 'Antirraya card height');
        near(metrics.photo.y, 854, 'Antirraya image viewport y');
        near(metrics.photo.height, 719, 'Antirraya lower crop at1573');
        near(metrics.plane.x, -11, 'Antirraya frame x');
        near(metrics.plane.width, 1461, 'Antirraya frame width');
        near(metrics.plane.height, 756, 'Antirraya frame height');
        near(image.y, 854 - 756 * .0783, 'Antirraya image crop offset');
        near(image.height, 756 * 1.0786, 'Antirraya source image height');
        near(metrics.benefits.x, 353, 'Antirraya benefits x');
        near(metrics.benefits.y, 1550, 'Antirraya benefits y');
        metrics.badges.forEach((badge, i) => near(badge.width, [191, 248, 212][i], `Antirraya badge${i} width`, .1));
        near(metrics.underline.x, 462, 'Antirraya underline x');
        near(metrics.underline.y, 705, 'Antirraya underline y');
        assert.equal(metrics.heading.size, '30.085px');
        assert.equal(metrics.heading.weight, '400');
        assert.equal(metrics.description.size, '15.042px');
        assert.equal(metrics.badge.size, '14.748px');
        assert.equal(metrics.badge.weight, '300');
        assert.equal(metrics.tab.size, '16.458px');
        assert.equal(metrics.tab.weight, '700');
    }
    await page.screenshot({ path: path.join(output, `antirraya-${width}.png`), fullPage: true });
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#blue-tech').hidden);
    await page.goForward();
    await page.waitForFunction(() => !document.querySelector('#antirraya').hidden);
    await page.locator('#treatment-tab-antirraya').focus();
    for (const [key, expected] of [["ArrowRight","polarizado"],["ArrowRight","hidrofobico"],["ArrowRight","fotosensible"],["ArrowRight","ilux"],["ArrowRight","uv"],["ArrowLeft","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["ArrowLeft","polarizado"],["ArrowLeft","antirraya"],["Home","uv"],["End","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["ArrowLeft","polarizado"],["ArrowLeft","antirraya"],["Enter","antirraya"],["Space","antirraya"]]) {
        await page.keyboard.press(key);
        assert.equal(new URL(page.url()).hash, `#${expected}`);
        assert.equal(await page.locator(`#treatment-tab-${expected}`).evaluate(element => element === document.activeElement), true);
    }
    await page.goto(`${base}/tratamientos#antirraya`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#antirraya').isVisible(), true);
    await verifyTreatmentLogos(page);
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    return metrics;
}

async function verifyTreatmentLogos(page, sourceAlternates = false) {
    const header = page.locator('.navbar-brand img:visible');
    const hero = page.locator('.treatments-hero-facts p:nth-child(2) img:visible');
    assert.equal(await header.count(), 1, 'Only one header brand image may be displayed or announced');
    assert.equal(await hero.count(), 1, 'Only one optical-technology logo may be displayed or announced');
    assert.ok((await header.getAttribute('src')).endsWith(sourceAlternates ? '843a7.svg' : '4d514.svg'));
    assert.ok((await hero.getAttribute('src')).endsWith(sourceAlternates ? '279a2.svg' : '8e61b.svg'));
    assert.equal(await page.locator('.treatments-header-logo-polarizado').isVisible(), sourceAlternates);
    assert.equal(await page.locator('.treatments-hero-logo-polarizado').isVisible(), sourceAlternates);
}

async function verifyPolarizado(page, width) {
    await page.locator('#treatment-tab-polarizado').click();
    assert.equal(new URL(page.url()).hash, '#polarizado');
    assert.equal(await page.locator('#treatment-tab-polarizado').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    await verifyTreatmentLogos(page, true);
    assert.equal(await page.locator('.treatments-linkedin-default').isVisible(), false);
    assert.equal(await page.locator('.treatments-linkedin-blue-tech').isVisible(), true);
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
        const rect = element => {
            const r = element.getBoundingClientRect();
            return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
        };
        const box = selector => rect(document.querySelector(selector));
        const type = selector => {
            const s = getComputedStyle(document.querySelector(selector));
            return { family: s.fontFamily, weight: s.fontWeight, size: s.fontSize, line: s.lineHeight };
        };
        return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            summary: box('.treatment-polarizado-summary'), photo: box('.treatment-polarizado-photo'),
            plane: box('.treatment-polarizado-image-plane'), benefits: box('.treatment-polarizado-benefits'),
            underline: box('.treatments-tabs-active'),
            badges: [...document.querySelectorAll('.treatment-polarizado-benefits li')].map(rect),
            circles: [...document.querySelectorAll('.treatment-polarizado-benefits .treatment-benefit-check')].map(rect),
            heading: type('#treatment-polarizado-title'), description: type('.treatment-polarizado-description'),
            badge: type('.treatment-polarizado-benefits li'), tab: type('#treatment-tab-polarizado'),
            layer: getComputedStyle(document.querySelector('.treatment-polarizado-summary')).zIndex,
            crop: getComputedStyle(document.querySelector('.treatment-polarizado-photo')).overflow,
            fonts: [...document.fonts].filter(font => font.family === 'Poppins' && font.status === 'loaded').map(font => font.weight),
            assets: [...document.querySelectorAll('.treatments-content img, .treatments-footer img, .site-header img')]
                .filter(image => !image.closest('[hidden]') && getComputedStyle(image).display !== 'none')
                .map(image => ({ file: image.src.split('/').pop(), ...rect(image), naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight, inCollapsedMenu: !!image.closest('#main-nav') && innerWidth < 1200 }))
        };
    });
    assert.ok(metrics.overflow <= 0, `Polarizado overflow at ${width}: ${metrics.overflow}`);
    assert.equal(metrics.layer, '2');
    assert.equal(metrics.crop, 'hidden');
    assert.equal(new Set(metrics.assets.map(asset => asset.file)).size, 18);
    for (const weight of ['300', '400', '700']) assert.ok(metrics.fonts.includes(weight), `Poppins${weight} must load`);
    for (const asset of metrics.assets) {
        assert.ok(asset.naturalWidth > 0 && (asset.width > 0 || asset.inCollapsedMenu));
        if (svgSizes[asset.file] && !asset.inCollapsedMenu) {
            near(asset.width, svgSizes[asset.file][0], `Polarizado ${asset.file} width`, .02);
            near(asset.height, svgSizes[asset.file][1], `Polarizado ${asset.file} height`, .02);
        }
    }
    metrics.assets.filter(asset => asset.file === '7bc95.svg').forEach((asset, index) => {
        const circle = metrics.circles[index];
        assert.ok(asset.x >= circle.x && asset.x + asset.width <= circle.x + circle.width);
        assert.ok(asset.y >= circle.y && asset.y + asset.height <= circle.y + circle.height);
    });
    const image = metrics.assets.find(asset => asset.file === '8af8d.png');
    assert.equal(image.naturalWidth, 2752);
    assert.equal(image.naturalHeight, 1536);
    if (width === 1440) {
        near(metrics.summary.x, 129, 'Polarizado card x');
        near(metrics.summary.y, 758, 'Polarizado card y');
        near(metrics.summary.width, 1181.583, 'Polarizado card width');
        near(metrics.summary.height, 178, 'Polarizado card height');
        near(metrics.photo.y, 893, 'Polarizado image viewport y');
        near(metrics.photo.height, 680, 'Polarizado crop ends at1573');
        near(metrics.plane.x, -124, 'Polarizado source plane x');
        near(metrics.plane.width, 1684, 'Polarizado source plane width');
        near(metrics.plane.height, 937.696, 'Polarizado source plane height');
        near(image.x, -124 - 1684 * .0001, 'Polarizado original image x');
        near(image.y, 893 - 937.696 * .0924, 'Polarizado original crop offset');
        near(image.height, 937.696 * 1.0024, 'Polarizado original image height');
        near(metrics.benefits.x, 353, 'Polarizado benefits x');
        near(metrics.benefits.y, 1550, 'Polarizado benefits y');
        metrics.badges.forEach((badge, i) => near(badge.width, [191, 248, 300][i], `Polarizado badge${i} width`, .1));
        near(metrics.underline.x, 603, 'Polarizado underline x');
        near(metrics.underline.y, 705, 'Polarizado underline y');
        assert.equal(metrics.heading.size, '30.085px');
        assert.equal(metrics.heading.weight, '400');
        assert.equal(metrics.description.size, '15.042px');
        assert.equal(metrics.badge.size, '14.748px');
        assert.equal(metrics.badge.weight, '300');
        assert.equal(metrics.tab.size, '16.458px');
        assert.equal(metrics.tab.weight, '700');
    }
    await page.screenshot({ path: path.join(output, `polarizado-${width}.png`), fullPage: true });
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#antirraya').hidden);
    await verifyTreatmentLogos(page);
    await page.goForward();
    await page.waitForFunction(() => !document.querySelector('#polarizado').hidden);
    await verifyTreatmentLogos(page, true);
    await page.locator('#treatment-tab-polarizado').focus();
    for (const [key, expected] of [["ArrowRight","hidrofobico"],["ArrowRight","fotosensible"],["ArrowRight","ilux"],["ArrowRight","uv"],["ArrowLeft","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["ArrowLeft","polarizado"],["Home","uv"],["End","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["ArrowLeft","polarizado"],["Enter","polarizado"],["Space","polarizado"]]) {
        await page.keyboard.press(key);
        assert.equal(new URL(page.url()).hash, `#${expected}`);
        assert.equal(await page.locator(`#treatment-tab-${expected}`).evaluate(element => element === document.activeElement), true);
        await verifyTreatmentLogos(page, ['polarizado', 'hidrofobico', 'fotosensible'].includes(expected));
    }
    await page.goto(`${base}/tratamientos#polarizado`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#polarizado').isVisible(), true);
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    await verifyTreatmentLogos(page, true);
    return metrics;
}

async function verifyHidrofobico(page, width) {
    await page.locator('#treatment-tab-hidrofobico').click();
    assert.equal(new URL(page.url()).hash, '#hidrofobico');
    assert.equal(await page.locator('#treatment-tab-hidrofobico').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    assert.equal(await page.locator('#hidrofobico').isVisible(), true);
    await verifyTreatmentLogos(page, true);
    assert.equal(await page.locator('.treatments-linkedin-default').isVisible(), false);
    assert.equal(await page.locator('.treatments-linkedin-blue-tech').isVisible(), true);
    assert.deepEqual(await page.locator('.treatment-hidrofobico-benefits li > span:last-child').allTextContents(),
        ['Siempre limpio', 'El agua no de adhiere', 'Mantiene la claridad']);
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
        const rect = element => {
            const r = element.getBoundingClientRect();
            return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
        };
        const box = selector => rect(document.querySelector(selector));
        const type = selector => {
            const s = getComputedStyle(document.querySelector(selector));
            return { family: s.fontFamily, weight: s.fontWeight, size: s.fontSize, line: s.lineHeight, spacing: s.letterSpacing };
        };
        return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            summary: box('.treatment-hidrofobico-summary'), photo: box('.treatment-hidrofobico-photo'),
            plane: box('.treatment-hidrofobico-image-plane'), benefits: box('.treatment-hidrofobico-benefits'),
            underline: box('.treatments-tabs-active'),
            badges: [...document.querySelectorAll('.treatment-hidrofobico-benefits li')].map(rect),
            circles: [...document.querySelectorAll('.treatment-hidrofobico-benefits .treatment-benefit-check')].map(rect),
            heading: type('#treatment-hidrofobico-title'), description: type('.treatment-hidrofobico-description'),
            badge: type('.treatment-hidrofobico-benefits li'), tab: type('#treatment-tab-hidrofobico'),
            layer: getComputedStyle(document.querySelector('.treatment-hidrofobico-summary')).zIndex,
            crop: getComputedStyle(document.querySelector('.treatment-hidrofobico-photo')).overflow,
            fonts: [...document.fonts].filter(font => font.family === 'Poppins' && font.status === 'loaded').map(font => font.weight),
            assets: [...document.querySelectorAll('.treatments-content img, .treatments-footer img, .site-header img')]
                .filter(image => !image.closest('[hidden]') && getComputedStyle(image).display !== 'none')
                .map(image => ({ file: image.src.split('/').pop(), ...rect(image), naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight, objectFit: getComputedStyle(image).objectFit,
                    inCollapsedMenu: !!image.closest('#main-nav') && innerWidth < 1200 }))
        };
    });
    assert.ok(metrics.overflow <= 0, `Hidrofóbico overflow at ${width}: ${metrics.overflow}`);
    assert.equal(metrics.layer, '2');
    assert.equal(metrics.crop, 'hidden');
    assert.equal(new Set(metrics.assets.map(asset => asset.file)).size, 18);
    for (const weight of ['300', '400', '700']) assert.ok(metrics.fonts.includes(weight), `Poppins${weight} must load`);
    for (const asset of metrics.assets) {
        assert.ok(asset.naturalWidth > 0 && (asset.width > 0 || asset.inCollapsedMenu));
        if (svgSizes[asset.file] && !asset.inCollapsedMenu) {
            near(asset.width, svgSizes[asset.file][0], `Hidrofóbico ${asset.file} width`, .02);
            near(asset.height, svgSizes[asset.file][1], `Hidrofóbico ${asset.file} height`, .02);
        }
    }
    metrics.assets.filter(asset => asset.file === '7bc95.svg').forEach((asset, index) => {
        const circle = metrics.circles[index];
        assert.ok(asset.x >= circle.x && asset.x + asset.width <= circle.x + circle.width);
        assert.ok(asset.y >= circle.y && asset.y + asset.height <= circle.y + circle.height);
    });
    const image = metrics.assets.find(asset => asset.file === 'dd2a0.png');
    assert.equal(image.naturalWidth, 2752);
    assert.equal(image.naturalHeight, 1536);
    assert.equal(image.objectFit, 'cover');
    if (width === 1440) {
        near(metrics.summary.x, 129, 'Hidrofóbico card x');
        near(metrics.summary.y, 758, 'Hidrofóbico card y');
        near(metrics.summary.width, 1181.583, 'Hidrofóbico card width');
        near(metrics.summary.height, 178, 'Hidrofóbico card height');
        near(metrics.photo.y, 893, 'Hidrofóbico image viewport y');
        near(metrics.photo.height, 680, 'Hidrofóbico crop ends at1573');
        near(metrics.plane.x, -23, 'Hidrofóbico source plane x');
        near(metrics.plane.width, 1684, 'Hidrofóbico source plane width');
        near(metrics.plane.height, 937.696, 'Hidrofóbico source plane height');
        near(image.x, -23, 'Hidrofóbico original image x');
        near(image.y, 893, 'Hidrofóbico original image y');
        near(image.height, 937.696, 'Hidrofóbico original image height');
        near(metrics.benefits.x, 353, 'Hidrofóbico benefits x');
        near(metrics.benefits.y, 1550, 'Hidrofóbico benefits y');
        metrics.badges.forEach((badge, i) => near(badge.width, [191, 248, 212][i], `Hidrofóbico badge${i} width`, .1));
        near(metrics.underline.x, 755, 'Hidrofóbico underline x');
        near(metrics.underline.y, 705, 'Hidrofóbico underline y');
        assert.equal(metrics.heading.size, '30.085px');
        assert.equal(metrics.heading.weight, '400');
        assert.equal(metrics.heading.line, '45.127px');
        assert.equal(metrics.heading.spacing, '-0.9025px');
        assert.equal(metrics.description.size, '15.042px');
        assert.equal(metrics.description.line, '18.803px');
        assert.equal(metrics.description.spacing, '-0.4513px');
        assert.equal(metrics.badge.size, '14.748px');
        assert.equal(metrics.badge.weight, '300');
        assert.equal(metrics.tab.size, '16.458px');
        assert.equal(metrics.tab.weight, '700');
    }
    await page.screenshot({ path: path.join(output, `hidrofobico-${width}.png`), fullPage: true });
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#polarizado').hidden);
    await page.goForward();
    await page.waitForFunction(() => !document.querySelector('#hidrofobico').hidden);
    await page.locator('#treatment-tab-hidrofobico').focus();
    for (const [key, expected] of [["ArrowRight","fotosensible"],["ArrowRight","ilux"],["ArrowRight","uv"],["ArrowLeft","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["ArrowLeft","polarizado"],["Home","uv"],["End","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["Enter","hidrofobico"],["Space","hidrofobico"]]) {
        await page.keyboard.press(key);
        assert.equal(new URL(page.url()).hash, `#${expected}`);
        assert.equal(await page.locator(`#treatment-tab-${expected}`).evaluate(element => element === document.activeElement), true);
        await verifyTreatmentLogos(page, ['polarizado', 'hidrofobico', 'fotosensible'].includes(expected));
    }
    await page.goto(`${base}/tratamientos#hidrofobico`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#hidrofobico').isVisible(), true);
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    await verifyTreatmentLogos(page, true);
    return metrics;
}

async function verifyFotosensible(page, width) {
    await page.locator('#treatment-tab-fotosensible').click();
    assert.equal(new URL(page.url()).hash, '#fotosensible');
    assert.equal(await page.locator('#treatment-tab-fotosensible').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    assert.equal(await page.locator('#fotosensible').isVisible(), true);
    await verifyTreatmentLogos(page, true);
    assert.equal(await page.locator('.treatments-linkedin-default').isVisible(), false);
    assert.equal(await page.locator('.treatments-linkedin-blue-tech').isVisible(), true);
    assert.deepEqual(await page.locator('.treatment-fotosensible-benefits li > span:last-child').allTextContents(),
        ['Siempre limpio', 'El agua no de adhiere', 'Mantiene la claridad']);
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
        const rect = element => {
            const r = element.getBoundingClientRect();
            return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
        };
        const box = selector => rect(document.querySelector(selector));
        const type = selector => {
            const s = getComputedStyle(document.querySelector(selector));
            return { family: s.fontFamily, weight: s.fontWeight, size: s.fontSize, line: s.lineHeight, spacing: s.letterSpacing };
        };
        return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            summary: box('.treatment-fotosensible-summary'), photo: box('.treatment-fotosensible-photo'),
            plane: box('.treatment-fotosensible-image-plane'), benefits: box('.treatment-fotosensible-benefits'),
            underline: box('.treatments-tabs-active'),
            badges: [...document.querySelectorAll('.treatment-fotosensible-benefits li')].map(rect),
            circles: [...document.querySelectorAll('.treatment-fotosensible-benefits .treatment-benefit-check')].map(rect),
            heading: type('#treatment-fotosensible-title'), description: type('.treatment-fotosensible-description'),
            badge: type('.treatment-fotosensible-benefits li'), tab: type('#treatment-tab-fotosensible'),
            layer: getComputedStyle(document.querySelector('.treatment-fotosensible-summary')).zIndex,
            crop: getComputedStyle(document.querySelector('.treatment-fotosensible-photo')).overflow,
            fonts: [...document.fonts].filter(font => font.family === 'Poppins' && font.status === 'loaded').map(font => font.weight),
            assets: [...document.querySelectorAll('.treatments-content img, .treatments-footer img, .site-header img')]
                .filter(image => !image.closest('[hidden]') && getComputedStyle(image).display !== 'none')
                .map(image => ({ file: image.src.split('/').pop(), ...rect(image), naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight, objectFit: getComputedStyle(image).objectFit,
                    inCollapsedMenu: !!image.closest('#main-nav') && innerWidth < 1200 }))
        };
    });
    assert.ok(metrics.overflow <= 0, `Fotosensible overflow at ${width}: ${metrics.overflow}`);
    assert.equal(metrics.layer, '2');
    assert.equal(metrics.crop, 'hidden');
    assert.equal(new Set(metrics.assets.map(asset => asset.file)).size, 18);
    for (const weight of ['300', '400', '700']) assert.ok(metrics.fonts.includes(weight), `Poppins${weight} must load`);
    for (const asset of metrics.assets) {
        assert.ok(asset.naturalWidth > 0 && (asset.width > 0 || asset.inCollapsedMenu));
        if (svgSizes[asset.file] && !asset.inCollapsedMenu) {
            near(asset.width, svgSizes[asset.file][0], `Fotosensible ${asset.file} width`, .02);
            near(asset.height, svgSizes[asset.file][1], `Fotosensible ${asset.file} height`, .02);
        }
    }
    metrics.assets.filter(asset => asset.file === '7bc95.svg').forEach((asset, index) => {
        const circle = metrics.circles[index];
        assert.ok(asset.x >= circle.x && asset.x + asset.width <= circle.x + circle.width);
        assert.ok(asset.y >= circle.y && asset.y + asset.height <= circle.y + circle.height);
    });
    const image = metrics.assets.find(asset => asset.file === '23aae.png');
    assert.equal(image.naturalWidth, 2752);
    assert.equal(image.naturalHeight, 1536);
    assert.equal(image.objectFit, 'fill');
    if (width === 1440) {
        near(metrics.summary.x, 129, 'Fotosensible card x');
        near(metrics.summary.y, 758, 'Fotosensible card y');
        near(metrics.summary.width, 1181.583, 'Fotosensible card width');
        near(metrics.summary.height, 178, 'Fotosensible card height');
        near(metrics.photo.y, 847, 'Fotosensible image viewport y');
        near(metrics.photo.height, 726, 'Fotosensible crop ends at1573');
        near(metrics.plane.x, -146, 'Fotosensible source plane x');
        near(metrics.plane.width, 1684, 'Fotosensible source plane width');
        near(metrics.plane.height, 937.696, 'Fotosensible source plane height');
        near(image.x, -146 - 1684 * .16, 'Fotosensible original image x');
        near(image.y, 847 - 937.696 * .1248, 'Fotosensible original image y');
        near(image.width, 1684 * 1.2465, 'Fotosensible original image width');
        near(image.height, 937.696 * 1.2495, 'Fotosensible original image height');
        near(metrics.benefits.x, 353, 'Fotosensible benefits x');
        near(metrics.benefits.y, 1550, 'Fotosensible benefits y');
        metrics.badges.forEach((badge, i) => near(badge.width, [191, 248, 212][i], `Fotosensible badge${i} width`, .1));
        near(metrics.underline.x, 919, 'Fotosensible underline x');
        near(metrics.underline.y, 705, 'Fotosensible underline y');
        assert.equal(metrics.heading.size, '30.085px');
        assert.equal(metrics.heading.weight, '400');
        assert.equal(metrics.heading.line, '45.127px');
        assert.equal(metrics.heading.spacing, '-0.9025px');
        assert.equal(metrics.description.size, '15.042px');
        assert.equal(metrics.description.line, '18.803px');
        assert.equal(metrics.description.spacing, '-0.4513px');
        assert.equal(metrics.badge.size, '14.748px');
        assert.equal(metrics.badge.weight, '300');
        assert.equal(metrics.tab.size, '16.458px');
        assert.equal(metrics.tab.weight, '700');
    }
    await page.screenshot({ path: path.join(output, `fotosensible-${width}.png`), fullPage: true });
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#hidrofobico').hidden);
    await page.goForward();
    await page.waitForFunction(() => !document.querySelector('#fotosensible').hidden);
    await page.locator('#treatment-tab-fotosensible').focus();
    for (const [key, expected] of [["ArrowRight","ilux"],["ArrowRight","uv"],["ArrowLeft","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["Home","uv"],["End","ilux"],["ArrowLeft","fotosensible"],["Enter","fotosensible"],["Space","fotosensible"]]) {
        await page.keyboard.press(key);
        assert.equal(new URL(page.url()).hash, `#${expected}`);
        assert.equal(await page.locator(`#treatment-tab-${expected}`).evaluate(element => element === document.activeElement), true);
        await verifyTreatmentLogos(page, ['polarizado', 'hidrofobico', 'fotosensible'].includes(expected));
    }
    await page.goto(`${base}/tratamientos#fotosensible`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#fotosensible').isVisible(), true);
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    await verifyTreatmentLogos(page, true);
    assert.equal(await page.locator('#fotosensible input, #fotosensible button, #fotosensible [role=slider]').count(), 0);
    return metrics;
}

async function verifyIlux(page, width) {
    await page.locator('#treatment-tab-ilux').click();
    assert.equal(new URL(page.url()).hash, '#ilux');
    assert.equal(await page.locator('#treatment-tab-ilux').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    assert.equal(await page.locator('#ilux').isVisible(), true);
    await verifyTreatmentLogos(page);
    assert.equal(await page.locator('.treatments-linkedin-default').isVisible(), false);
    assert.equal(await page.locator('.treatments-linkedin-blue-tech').isVisible(), true);
    assert.deepEqual(await page.locator('.treatment-ilux-benefits li > span:last-child').allTextContents(),
        ['Mayor durabilidad', 'Superficie más resistente', 'Mantiene la claridad']);
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => {
        const rect = element => {
            const r = element.getBoundingClientRect();
            return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
        };
        const box = selector => rect(document.querySelector(selector));
        const type = selector => {
            const s = getComputedStyle(document.querySelector(selector));
            return { family: s.fontFamily, weight: s.fontWeight, size: s.fontSize, line: s.lineHeight, spacing: s.letterSpacing };
        };
        return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            summary: box('.treatment-ilux-summary'), photo: box('.treatment-ilux-photo'),
            plane: box('.treatment-ilux-image-plane'), benefits: box('.treatment-ilux-benefits'),
            underline: box('.treatments-tabs-active'),
            badges: [...document.querySelectorAll('.treatment-ilux-benefits li')].map(rect),
            circles: [...document.querySelectorAll('.treatment-ilux-benefits .treatment-benefit-check')].map(rect),
            heading: type('#treatment-ilux-title'), brand: type('#treatment-ilux-title strong'), description: type('.treatment-ilux-description'),
            badge: type('.treatment-ilux-benefits li'), tab: type('#treatment-tab-ilux'),
            layer: getComputedStyle(document.querySelector('.treatment-ilux-summary')).zIndex,
            crop: getComputedStyle(document.querySelector('.treatment-ilux-photo')).overflow,
            fonts: [...document.fonts].filter(font => font.family === 'Poppins' && font.status === 'loaded').map(font => font.weight),
            assets: [...document.querySelectorAll('.treatments-content img, .treatments-footer img, .site-header img')]
                .filter(image => !image.closest('[hidden]') && getComputedStyle(image).display !== 'none')
                .map(image => ({ file: image.src.split('/').pop(), ...rect(image), naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight, objectFit: getComputedStyle(image).objectFit,
                    inCollapsedMenu: !!image.closest('#main-nav') && innerWidth < 1200 }))
        };
    });
    assert.ok(metrics.overflow <= 0, `Ilux overflow at ${width}: ${metrics.overflow}`);
    assert.equal(metrics.layer, '2');
    assert.equal(metrics.crop, 'hidden');
    assert.equal(new Set(metrics.assets.map(asset => asset.file)).size, 18);
    for (const weight of ['300', '400', '600']) assert.ok(metrics.fonts.includes(weight), `Poppins${weight} must load`);
    for (const asset of metrics.assets) {
        assert.ok(asset.naturalWidth > 0 && (asset.width > 0 || asset.inCollapsedMenu));
        if (svgSizes[asset.file] && !asset.inCollapsedMenu) {
            near(asset.width, svgSizes[asset.file][0], `Ilux ${asset.file} width`, .02);
            near(asset.height, svgSizes[asset.file][1], `Ilux ${asset.file} height`, .02);
        }
    }
    metrics.assets.filter(asset => asset.file === '7bc95.svg').forEach((asset, index) => {
        const circle = metrics.circles[index];
        assert.ok(asset.x >= circle.x && asset.x + asset.width <= circle.x + circle.width);
        assert.ok(asset.y >= circle.y && asset.y + asset.height <= circle.y + circle.height);
    });
    const image = metrics.assets.find(asset => asset.file === 'b6e78.png');
    assert.equal(image.naturalWidth, 2752);
    assert.equal(image.naturalHeight, 1536);
    assert.equal(image.objectFit, 'fill');
    if (width === 1440) {
        near(metrics.summary.x, 129, 'Ilux card x');
        near(metrics.summary.y, 758, 'Ilux card y');
        near(metrics.summary.width, 1181.583, 'Ilux card width');
        near(metrics.summary.height, 178, 'Ilux card height');
        near(metrics.photo.y, 893, 'Ilux image viewport y');
        near(metrics.photo.height, 680, 'Ilux crop ends at1573');
        near(metrics.plane.x, -124, 'Ilux source plane x');
        near(metrics.plane.width, 1684, 'Ilux source plane width');
        near(metrics.plane.height, 937.696, 'Ilux source plane height');
        near(image.x, -124 - 1684 * .1079, 'Ilux original image x');
        near(image.y, 893 - 937.696 * .1869, 'Ilux original image y');
        near(image.width, 1684 * 1.2163, 'Ilux original image width');
        near(image.height, 937.696 * 1.2192, 'Ilux original image height');
        near(metrics.benefits.x, 353, 'Ilux benefits x');
        near(metrics.benefits.y, 1550, 'Ilux benefits y');
        metrics.badges.forEach((badge, i) => near(badge.width, [191, 248, 212][i], `Ilux badge${i} width`, .1));
        near(metrics.underline.x, 1072, 'Ilux underline x');
        near(metrics.underline.y, 705, 'Ilux underline y');
        assert.equal(metrics.heading.size, '30.085px');
        assert.equal(metrics.heading.weight, '400');
        assert.equal(metrics.brand.weight, '600');
        assert.equal(metrics.heading.line, '45.127px');
        assert.equal(metrics.heading.spacing, '-0.9025px');
        assert.equal(metrics.description.size, '15.042px');
        assert.equal(metrics.description.line, '18.803px');
        assert.equal(metrics.description.spacing, '-0.4513px');
        assert.equal(metrics.badge.size, '14.748px');
        assert.equal(metrics.badge.weight, '300');
        assert.equal(metrics.tab.size, '16.458px');
        assert.equal(metrics.tab.weight, '600');
    }
    await page.screenshot({ path: path.join(output, `ilux-${width}.png`), fullPage: true });
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#fotosensible').hidden);
    await page.goForward();
    await page.waitForFunction(() => !document.querySelector('#ilux').hidden);
    await page.locator('#treatment-tab-ilux').focus();
    for (const [key, expected] of [["ArrowRight","uv"],["ArrowLeft","ilux"],["ArrowLeft","fotosensible"],["ArrowLeft","hidrofobico"],["Home","uv"],["End","ilux"],["Enter","ilux"],["Space","ilux"]]) {
        await page.keyboard.press(key);
        assert.equal(new URL(page.url()).hash, `#${expected}`);
        assert.equal(await page.locator(`#treatment-tab-${expected}`).evaluate(element => element === document.activeElement), true);
        await verifyTreatmentLogos(page, ['polarizado', 'hidrofobico', 'fotosensible'].includes(expected));
    }
    await page.goto(`${base}/tratamientos#ilux`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#ilux').isVisible(), true);
    assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
    await verifyTreatmentLogos(page);
    assert.equal(await page.locator('#ilux input, #ilux button, #ilux [role=slider]').count(), 0);
    return metrics;
}

async function verifyComparisonSelection(page) {
    const keys = ['uv', 'blue-tech', 'antirraya', 'polarizado', 'hidrofobico', 'fotosensible', 'ilux'];
    for (const key of keys) {
        await page.locator(`#treatment-tab-${key}`).click();
        await page.waitForFunction(expected => document.querySelector('[data-treatments-revision]').dataset.activeTreatment === expected, key);
        const backgrounds = await page.locator('.treatments-table tr[data-treatment-row]').evaluateAll(rows =>
            rows.map(row => ({ key: row.dataset.treatmentRow, color: getComputedStyle(row).backgroundColor })));
        assert.equal(backgrounds.length, keys.length);
        for (const row of backgrounds)
            assert.equal(row.color, row.key === key ? 'rgba(61, 26, 122, 0.03)' : 'rgba(0, 0, 0, 0)', `${key} selection highlight on ${row.key}`);
    }
    await page.locator('#treatment-tab-uv').click();
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
            assert.equal((await page.goto(`${base}/tratamientos`, { waitUntil: 'networkidle' })).status(), 200);
            assert.equal(await page.locator('[data-treatments-revision="treatments-ilux-v1"]').count(), 1,
                'Stale preview: only the user may restart their app before treatment verification');
            await page.evaluate(async () => {
                await Promise.all([...document.images].map(image => image.decode()));
                await document.fonts.ready;
            });
            const metrics = await page.evaluate(() => {
                const rect = element => {
                    const r = element.getBoundingClientRect();
                    return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
                };
                const box = selector => rect(document.querySelector(selector));
                const type = selector => {
                    const s = getComputedStyle(document.querySelector(selector));
                    return { family: s.fontFamily, weight: s.fontWeight, size: s.fontSize, line: s.lineHeight };
                };
                return {
                    viewport: innerWidth, document: document.documentElement.scrollWidth,
                    header: box('.site-header'), hero: box('.treatments-hero'), title: box('#treatments-title'),
                    tabs: box('.treatments-tabs'), summary: box('.treatment-uv-summary'), photo: box('.treatment-uv-photo'),
                    imagePlane: box('.treatment-uv-image-plane'),
                    benefits: box('.treatment-uv-benefits'), comparison: box('.treatments-comparison-label'),
                    comparisonTitle: box('#treatments-comparison-title'), table: box('.treatments-table'),
                    sophia: box('.treatments-sophia'), footer: box('.treatments-footer'),
                    headingType: type('#treatments-title'), bodyType: type('.treatment-uv-description'),
                    numberType: type('.treatments-row-number'),
                    thinLoaded: [...document.fonts].some(font => font.family === 'Poppins' && font.weight === '100' && font.status === 'loaded'),
                    assets: [...document.querySelectorAll('.treatments-content img, .treatments-footer img, .site-header img')]
                        .filter(image => !image.closest('[hidden]') && getComputedStyle(image).display !== 'none').map(image => ({
                        file: image.src.split('/').pop(), ...rect(image), naturalWidth: image.naturalWidth,
                        naturalHeight: image.naturalHeight, objectFit: getComputedStyle(image).objectFit,
                        inCollapsedMenu: !!image.closest('#main-nav') && innerWidth < 1200
                    })),
                    checkCircles: [...document.querySelectorAll('.treatment-uv-benefits .treatment-benefit-check')].map(rect),
                    summaryLayer: getComputedStyle(document.querySelector('.treatment-uv-summary')).zIndex,
                    photoOverflow: getComputedStyle(document.querySelector('.treatment-uv-photo')).overflow,
                    sourceArrows: box('.treatment-uv-source-arrows')
                };
            });
            assert.ok(metrics.document <= width, `Horizontal overflow at ${width}: ${metrics.document}`);
            assert.equal(await page.locator('h1').count(), 1);
            await verifyTreatmentLogos(page);
            assert.equal(await page.locator('[data-treatment-detail]').count(), 7);
            assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
            assert.equal(await page.locator('.treatments-tabs li').count(), 7);
            assert.equal(await page.locator('.treatments-tabs button:disabled').count(), 0);
            assert.equal(await page.locator('.treatments-tabs a').count(), 7);
            assert.equal(await page.locator('.treatments-table tbody tr').count(), 7);
            assert.equal(await page.locator('.treatment-uv-benefits li').count(), 3);
            assert.equal(metrics.numberType.weight, '100');
            assert.ok(metrics.thinLoaded, 'Poppins Thin100 must load rather than be synthesized');
            assert.equal(new Set(metrics.assets.map(asset => asset.file)).size, 19);
            assert.ok(metrics.assets.every(asset => asset.naturalWidth > 0 && (asset.width > 0 || asset.inCollapsedMenu)));
            assert.equal(metrics.summaryLayer, '2');
            assert.equal(metrics.photoOverflow, 'hidden');
            assert.ok(metrics.sourceArrows.x + metrics.sourceArrows.width < 0, 'Source arrows remain outside the visible crop, not a fake slider');
            const uvPhoto = metrics.assets.find(asset => asset.file === '16fed.png');
            near(metrics.photo.height, Math.min(680, width * 680 / 1440), 'Responsive UV photo band height', .75);
            near(uvPhoto.x, -width * 124 / 1440, 'Responsive UV image plane x', 1.5);
            near(uvPhoto.width, width * 1684 / 1440, 'Responsive UV image plane width', 1.5);
            near(uvPhoto.height, width * 937.695 / 1440, 'Responsive UV image plane height', 1.5);
            for (const asset of metrics.assets) {
                if (svgSizes[asset.file] && !asset.inCollapsedMenu) {
                    near(asset.width, svgSizes[asset.file][0], `${asset.file} root width`, .02);
                    near(asset.height, svgSizes[asset.file][1], `${asset.file} root height`, .02);
                }
            }
            const checks = metrics.assets.filter(asset => asset.file === '7bc95.svg');
            checks.forEach((asset, index) => {
                const circle = metrics.checkCircles[index];
                assert.ok(asset.x >= circle.x && asset.x + asset.width <= circle.x + circle.width);
                assert.ok(asset.y >= circle.y && asset.y + asset.height <= circle.y + circle.height);
            });
            if (width === 1440) {
                near(metrics.header.x, 208, 'Header x');
                near(metrics.title.x, 101, 'Hero title x');
                near(metrics.title.y, 232, 'Hero title y');
                near(metrics.hero.height, 689, 'Hero height');
                near(metrics.tabs.y, 654, 'Treatment strip y');
                near(metrics.summary.y, 758, 'UV summary y');
                near(metrics.photo.y, 893, 'Photo start');
                near(metrics.photo.height, 680, 'Photo crop height');
                near(metrics.benefits.x, 329, 'Benefit group x');
                near(metrics.benefits.y, 1550, 'Benefit group y');
                near(metrics.comparison.y, 1709.25, 'Comparison label y');
                near(metrics.comparisonTitle.y, 1771.985, 'Comparison heading y');
                near(metrics.table.y, 1874.112, 'Comparison rows y');
                near(metrics.sophia.y, 2370, 'Sophia section y');
                near(metrics.footer.y, 2823, 'Footer y');
                assert.equal(metrics.headingType.size, '38px');
                assert.equal(metrics.headingType.weight, '400');
                assert.equal(metrics.bodyType.size, '15px');
                const hero = metrics.assets.find(asset => asset.file === '74f40.png');
                near(hero.width, 1440, 'Hero image box width');
                near(hero.height, 689, 'Hero image box height');
                assert.equal(hero.objectFit, 'cover');
                const photo = metrics.assets.find(asset => asset.file === '16fed.png');
                near(photo.x, -124, 'Photo plane x');
                near(photo.width, 1684, 'Photo plane width');
                near(photo.height, 937.707, 'Photo plane height');
            }
            await page.screenshot({ path: path.join(output, `treatments-${width}.png`), fullPage: true });
            await page.locator('#treatment-tab-uv').focus();
            await page.keyboard.press('Enter');
            assert.equal(new URL(page.url()).hash, '#uv');
            assert.equal(await page.locator('[data-treatment-detail]:visible').count(), 1);
            const blueTech = await verifyBlueTech(page, width);
            const antirraya = await verifyAntirraya(page, width);
            const polarizado = await verifyPolarizado(page, width);
            const hidrofobico = await verifyHidrofobico(page, width);
            const fotosensible = await verifyFotosensible(page, width);
            const ilux = await verifyIlux(page, width);
            await verifyComparisonSelection(page);
            for (const selector of ['.treatments-sophia-action', '.treatments-footer-socials button:first-child']) {
                const trigger = page.locator(selector);
                await trigger.focus();
                await page.keyboard.press('Enter');
                await page.locator('#pending-modal.show').waitFor();
                assert.match(await page.locator('#pending-description').innerText(), /no se generan resultados/);
                await page.keyboard.press('Escape');
                await page.locator('#pending-modal').waitFor({ state: 'hidden' });
                await page.waitForFunction(selector => document.querySelector(selector) === document.activeElement, selector);
            }
            if (width < 1200) {
                await page.locator('.navbar-toggler').focus();
                await page.keyboard.press('Enter');
                await page.locator('#main-nav.show').waitFor();
                await page.locator('#main-nav a').first().focus();
                await page.keyboard.press('Escape');
                await page.locator('#main-nav.show').waitFor({ state: 'hidden' });
                await page.waitForFunction(() => document.querySelector('.navbar-toggler') === document.activeElement);
            }
            evidence.push({ width, metrics, blueTech, antirraya, polarizado, hidrofobico, fotosensible, ilux, keyboard: 'passed', otherTreatments: 'all seven available' });
            await context.close();
        }
        const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
        const noScriptPage = await noScript.newPage();
        await noScriptPage.goto(`${base}/tratamientos#ilux`);
        assert.equal(await noScriptPage.locator('[data-treatment-detail]:visible').count(), 7);
        assert.ok(await noScriptPage.locator('.treatments-content').getAttribute('data-active-treatment') === null);
        assert.equal(await noScriptPage.locator('.treatments-table tr[data-treatment-row]').count(), 7);
        assert.ok(await noScriptPage.locator('.treatments-table tr[data-treatment-row]').evaluateAll(rows =>
            rows.every(row => getComputedStyle(row).backgroundColor === 'rgba(0, 0, 0, 0)')),
        'Without JavaScript, no comparison row is falsely highlighted');
        assert.equal(await noScriptPage.locator('#treatment-tab-blue-tech').getAttribute('href'), '#blue-tech');
        assert.equal(await noScriptPage.locator('#treatment-tab-antirraya').getAttribute('href'), '#antirraya');
        assert.equal(await noScriptPage.locator('#treatment-tab-polarizado').getAttribute('href'), '#polarizado');
        assert.equal(await noScriptPage.locator('#treatment-tab-hidrofobico').getAttribute('href'), '#hidrofobico');
        assert.equal(await noScriptPage.locator('#treatment-tab-fotosensible').getAttribute('href'), '#fotosensible');
        assert.equal(await noScriptPage.locator('#treatment-tab-ilux').getAttribute('href'), '#ilux');
        await verifyTreatmentLogos(noScriptPage);
        assert.equal(await noScriptPage.locator('.treatments-linkedin-default').isVisible(), true);
        assert.equal(await noScriptPage.locator('.treatments-linkedin-blue-tech').isVisible(), false);
        assert.ok(await noScriptPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await noScript.close();
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, 'checks.json'), JSON.stringify({ evidence, errors }, null, 2));
        console.log(`Treatment runtime checks passed at ${widths.join(', ')}; evidence: ${output}`);
    } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
