const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PERF_CHROMIUM || "/Users/bartosz/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium" });
  try {
    const page = await browser.newPage();
    for (const width of [375, 768, 1024, 1440, 2048, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(process.argv[2] || 'http://localhost:3001');
      await page.locator('#contact a').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#contact').scrollIntoViewIfNeeded();
      if (process.env.CONTACT_SCREENSHOT && width === 2048) {
        await page.waitForTimeout(3000);
        await page.screenshot({ path: process.env.CONTACT_SCREENSHOT });
      }
      const layout = await page.locator('#contact').evaluate(section => {
        const title = section.querySelector('h2').getBoundingClientRect();
        const grid = section.querySelector('a').parentElement.getBoundingClientRect();
        return { title: { left: title.left, right: title.right }, grid: { left: grid.left, right: grid.right }, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      console.log(width, layout);
      assert.equal(layout.overflow, false, `overflow at ${width}`);
      assert.ok(Math.abs(layout.title.left - layout.grid.left) < 1, `contact heading and links misaligned at ${width}`);
      if (width >= 1000) assert.ok(Math.abs(layout.title.right - layout.grid.right) < 1, `contact column widths differ at ${width}`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
