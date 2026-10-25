const {
  chromium
} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: process.env.PERF_CHROMIUM || '/Users/bartosz/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    args: ['--use-angle=metal']
  });
  try {
    const context = await browser.newContext({
      viewport: {
        width: 1440,
        height: 1000
      },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR:',e.message); });
    await page.addInitScript(() => {
      window.draws = {};
      for (const T of [WebGLRenderingContext, WebGL2RenderingContext]) {
        const orig = T.prototype.drawElements;
        T.prototype.drawElements = function (...args) {
          const c = this.canvas.className;
          if (c.includes('shader-cursor')) window.draws[c] = (window.draws[c] || 0) + 1;
          return orig.apply(this, args);
        };
      }
    });
    await page.addInitScript(() => {
      window.gravityMessages = [];
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type,...args) {
        const result=add.call(this,type,...args);
        if(type==='contextmenu' && this===document.body)window.gravityReady=true;
        return result;
      };
      const post = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (message, ...args) {
        if (message.op === 'setGravity') window.gravityMessages.push({
          time: performance.now(),
          gravity: message.props
        });
        return post.call(this, message, ...args);
      };
    });
    await page.goto(process.argv[2] || 'http://localhost:3117');
    await page.waitForFunction(() => window.gravityReady && window.gravityMessages.length > 0);
    await page.mouse.click(800, 500, {
      button: 'right'
    });
    await page.waitForTimeout(5200);
    console.log('GRAVITY',await page.evaluate(()=>({messages:window.gravityMessages,visibility:document.visibilityState,ready:window.gravityReady})));
    assert.deepEqual(await page.evaluate(() => window.gravityMessages.at(-1).gravity), [0, -100, 0]);
    await page.evaluate(() => {
      document.body.dispatchEvent(new Event('contextmenu', {
        cancelable: true
      }));
      document.body.dispatchEvent(new Event('contextmenu', {
        cancelable: true
      }));
    });
    await page.waitForTimeout(150);
    assert.deepEqual(await page.evaluate(() => window.gravityMessages.at(-1).gravity), [0, -100, 0]);
    await page.mouse.click(800, 500, {
      button: 'right'
    });
    await page.waitForTimeout(150);
    assert.deepEqual(await page.evaluate(() => window.gravityMessages.at(-1).gravity), [0, -.2, 0]);
    await page.mouse.move(700, 400);
    await page.waitForTimeout(1500);
    const d = await page.evaluate(() => window.draws);
    assert.ok(d['shader-cursor'] > 0);
    assert.equal(d['shader-cursor shader-cursor-inversion'] || 0, 0);
    await page.waitForTimeout(600);
    assert.deepEqual(await page.evaluate(() => window.draws), d);
    await page.mouse.down();
    await page.waitForTimeout(900);
    assert.ok((await page.evaluate(() => window.draws['shader-cursor shader-cursor-inversion'])) > 0);
    await page.mouse.up();
    await page.waitForTimeout(1500);
    const released = await page.evaluate(() => window.draws);
    await page.waitForTimeout(500);
    assert.deepEqual(await page.evaluate(() => window.draws), released);
    const link = page.locator('nav a[href="#frontend"]').first();
    await link.hover();
    await page.waitForTimeout(1200);
    const aligned = await link.evaluate(el => {
      let c = document.querySelector('.shader-cursor-outline'),
        g = c.getContext('webgl2'),
        p = g.getParameter(g.CURRENT_PROGRAM);
      const u = n => g.getUniform(p, g.getUniformLocation(p, n));
      const r = el.getBoundingClientRect(),
        b = c.getBoundingClientRect();
      return {
        center: Array.from(u('uCenter')),
        expected: [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top],
        morph: u('uMorph')
      };
    });
    assert.ok(Math.abs(aligned.center[0] - aligned.expected[0]) < .1);
    assert.ok(Math.abs(aligned.center[1] - aligned.expected[1]) < .1);
    assert.ok(aligned.morph > .999);
    await link.click();
    await page.waitForTimeout(1000);
    assert.ok((await page.evaluate(() => scrollY)) > 0);
    const cursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
    assert.ok(cursor.includes('cursor.png') && cursor.includes('3 3'));
    await page.emulateMedia({
      reducedMotion: 'reduce'
    });
    await page.waitForTimeout(200);
    assert.equal(await page.locator('html').getAttribute('data-shader-cursor'), null);
    await page.emulateMedia({
      reducedMotion: 'no-preference'
    });
    await page.waitForTimeout(500);
    await page.mouse.move(900, 400);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('html').getAttribute('data-shader-cursor'), 'active');
    const focusSession = await context.newCDPSession(page);
    await focusSession.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    const other = await context.newPage();
    const otherSession = await context.newCDPSession(other);
    await otherSession.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await other.bringToFront();
    await page.waitForTimeout(500);
    const nativeVisibility = await page.evaluate(() => document.visibilityState);
    // This Chromium build keeps both tabs visible/focused even after focus
    // emulation is disabled. Exercise the handler explicitly and report that
    // limitation, rather than labeling synthetic visibility as a native test.
    const visibilityMode = nativeVisibility === 'hidden' ? 'native' : 'simulated-handler';
    if (visibilityMode === 'simulated-handler') await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      window.dispatchEvent(new Event('blur'));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(300);
    assert.equal(await page.locator('html').getAttribute('data-shader-cursor'), null);
    if (visibilityMode === 'simulated-handler') await page.evaluate(() => {
      delete document.hidden; delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.bringToFront();
    await page.mouse.move(950, 400);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('html').getAttribute('data-shader-cursor'), 'active');
    assert.deepEqual(errors, []);
    require('node:fs').writeFileSync(process.argv[3] || '/tmp/portfolio-interactions.json', JSON.stringify({
      visibilityMode,
      nativeVisibility,
      gravity: await page.evaluate(() => window.gravityMessages),
      alignment: aligned,
      draws: d,
      released,
      cursor,
      errors
    }, null, 2));
    console.log('PASS', JSON.stringify({
      alignment: aligned,
      draws: d,
      released,
      cursor,
      errors
    }));
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
