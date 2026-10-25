/* Run against a production server. Install Playwright outside this checkout;
 * see docs/performance.md. No changes to application globals are shipped. */
const { chromium } = require('playwright');
const fs = require('node:fs');

const url = process.argv[2] || 'http://localhost:3105';
const output = process.argv[3] || '/tmp/portfolio-performance.json';
const executablePath = process.env.PERF_CHROMIUM;
const viewport = {
    width: Number(process.env.PERF_WIDTH || 1440),
    height: Number(process.env.PERF_HEIGHT || 1000)
};

(async () => {
    const browser = await chromium.launch({
        headless: false,
        ...(executablePath ? { executablePath } : {}),
        args: process.platform === 'darwin' ? ['--use-angle=metal'] : []
    });
    try {
        const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => {
            window.probe = { counts: {}, contexts: [], mode: 'all', longTasks: [] };
            new PerformanceObserver(list => {
                window.probe.longTasks.push(...list.getEntries().map(entry => entry.duration));
            }).observe({ type: 'longtask', buffered: true });
            const getContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (...args) {
                const context = getContext.apply(this, args);
                if (context && String(args[0]).startsWith('webgl') && !window.probe.contexts.includes(context)) {
                    window.probe.contexts.push(context);
                }
                return context;
            };
            for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
                for (const name of ['drawArrays', 'drawElements']) {
                    const original = type.prototype[name];
                    type.prototype[name] = function (...args) {
                        const kind = this.canvas.className.includes('shader-cursor') ? 'cursor' : 'scene';
                        window.probe.counts[kind] = (window.probe.counts[kind] || 0) + 1;
                        if (window.probe.mode === `no-${kind}`) return;
                        return original.apply(this, args);
                    };
                }
            }
        });
        await page.goto(url);
        await page.waitForTimeout(10000);
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Performance.enable');
        const env = await page.evaluate(() => ({
            renderer: window.probe.contexts.map(context => {
                const extension = context.getExtension('WEBGL_debug_renderer_info');
                return extension && context.getParameter(extension.UNMASKED_RENDERER_WEBGL);
            }),
            buffers: window.probe.contexts.map(context => ({
                class: context.canvas.className,
                width: context.drawingBufferWidth,
                height: context.drawingBufferHeight
            })),
            dpr: devicePixelRatio
        }));
        const results = [];
        const scenarios = [
            ['idle', 'all', false, 0, false],
            ['movement', 'all', true, 0, false],
            ['hold', 'all', true, 0, true],
            ['no-cursor-draw', 'no-cursor', true, 0, false],
            ['no-scene-draw', 'no-scene', true, 0, false],
            ['frontend', 'all', false, 1000, false],
            ['contact', 'all', false, 3800, false],
            ['scroll', 'all', false, -1, false]
        ];
        for (const [name, mode, move, scroll, hold] of scenarios) {
            await page.evaluate(({ mode, scroll }) => {
                window.probe.mode = mode;
                window.scrollTo(0, Math.max(0, scroll));
            }, { mode, scroll });
            await page.waitForTimeout(1500);
            const before = (await cdp.send('Performance.getMetrics')).metrics;
            const result = await page.evaluate(async ({ move, scroll, hold }) => {
                window.probe.counts = {};
                window.probe.longTasks = [];
                const intervals = [];
                let previous = performance.now();
                const start = previous;
                if (hold) document.elementFromPoint(700, 500).dispatchEvent(new PointerEvent('pointerdown', {
                    bubbles: true, buttons: 1, clientX: 700, clientY: 500, pointerType: 'mouse'
                }));
                await new Promise(resolve => {
                    function tick(now) {
                        intervals.push(now - previous);
                        previous = now;
                        const elapsed = now - start;
                        if (move) {
                            const x = 700 + Math.sin(elapsed / 700) * 300;
                            const y = 500 + Math.cos(elapsed / 500) * 100;
                            document.elementFromPoint(x, y)?.dispatchEvent(new PointerEvent('pointermove', {
                                bubbles: true, buttons: hold ? 1 : 0,
                                clientX: x, clientY: y, pointerType: 'mouse'
                            }));
                        }
                        if (scroll === -1) window.scrollTo(0, (Math.sin(elapsed / 1500 - Math.PI / 2) + 1) * 1800);
                        if (elapsed < 4000) requestAnimationFrame(tick);
                        else resolve();
                    }
                    requestAnimationFrame(tick);
                });
                if (hold) window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
                intervals.sort((a, b) => a - b);
                return {
                    frames: intervals.length,
                    p50: intervals[Math.floor(intervals.length * 0.5)],
                    p95: intervals[Math.floor(intervals.length * 0.95)],
                    over25: intervals.filter(value => value > 25).length,
                    draws: window.probe.counts, longTasks: window.probe.longTasks
                };
            }, { move, scroll, hold });
            const after = (await cdp.send('Performance.getMetrics')).metrics;
            const metrics = {};
            for (const key of ['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration']) {
                metrics[key] = after.find(item => item.name === key).value - before.find(item => item.name === key).value;
            }
            results.push({ name, ...result, ...metrics });
            console.log(JSON.stringify(results[results.length - 1]));
        }
        fs.writeFileSync(output, JSON.stringify({ env, results, errors }, null, 2));
        console.log(`Saved ${output}`);
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
