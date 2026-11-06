const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/components/projectViewTransition.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

async function scenario({ supported = true, reducedMotion = false, skipped = false } = {}) {
    let navigations = 0;
    let transitions = 0;
    let scrollY = 0;
    const input = new EventTarget();
    const simulateScroll = position => {
        scrollY = position;
        input.dispatchEvent(new Event('scroll'));
    };
    const document = { documentElement: { dataset: {}, style: { setProperty() {}, removeProperty() {} } } };
    if (supported) document.startViewTransition = update => {
        transitions++;
        const done = Promise.resolve().then(update).then(() => {
            simulateScroll(1500);
            assert.equal(scrollY, 0, 'incoming project stays at the top until the transition finishes');
        });
        return { ready: skipped ? Promise.reject(new Error('Animation skipped')) : done, finished: done };
    };
    const context = { exports: {}, setTimeout, performance: require('node:perf_hooks').performance, document, window: {
        clearTimeout() {}, setTimeout() {}, matchMedia: () => ({ matches: reducedMotion }),
        get scrollY() { return scrollY; },
        scrollTo(x, y) { scrollY = y; },
        addEventListener: input.addEventListener.bind(input), removeEventListener: input.removeEventListener.bind(input),
    },
        requestAnimationFrame: () => { throw new Error('View transition update must not wait for a rendered frame'); } };
    vm.runInNewContext(source, context);
    const wheel = () => input.dispatchEvent(new Event('wheel', { cancelable: true }));
    await context.exports.projectViewTransition(async () => {
        navigations++;
        assert.equal(wheel(), !supported || reducedMotion);
        return true;
    }, 'open');
    assert.equal(wheel(), true, 'wheel scroll resumes after the transition');
    simulateScroll(200);
    assert.equal(scrollY, 200, 'the scroll guard is removed after the transition');
    assert.equal(navigations, 1);
    assert.equal(transitions, supported && !reducedMotion ? 1 : 0);
    assert.equal(document.documentElement.dataset.projectTransition, undefined);
    assert.equal(document.documentElement.dataset.projectLines, reducedMotion ? undefined : 'drawing');
    if (!reducedMotion) assert.ok(context.exports.projectModelReveal(performance.now()) < .01);
}
async function hologramTiming() {
    let now = 0;
    let navigatedAt = -1;
    const document = { documentElement: { dataset: {}, style: { setProperty() {}, removeProperty() {} } }, startViewTransition(update) {
        const done = Promise.resolve().then(update);
        return { ready: done, finished: done };
    } };
    const context = { exports: {}, document, performance: { now: () => now },
        window: { clearTimeout() {}, setTimeout() {}, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) },
        setTimeout(resolve, duration) { now += duration; resolve(); } };
    vm.runInNewContext(source, context);
    await context.exports.projectViewTransition(async () => { navigatedAt = now; return true; }, 'open');
    assert.equal(navigatedAt, 340, 'only the fast exit delays navigation');
    assert.equal(context.exports.projectModelReveal(now), 0);
    assert.equal(context.exports.projectModelReveal(now + 550), .5, 'the scan is halfway through after 550 ms');
    assert.equal(context.exports.projectModelReveal(now + 1100), 1);
    assert.equal(context.exports.projectModelReveal(now + 10000), 1, 'resting materials return to their original appearance');
    context.exports.finishReloadSetup(true);
    assert.equal(document.documentElement.dataset.projectLines, 'drawing');
    assert.equal(context.exports.projectModelReveal(now), 0, 'reload starts the line and model reveal together');
}
(async () => {
    await hologramTiming();
    await scenario();
    await scenario({ supported: false });
    await scenario({ reducedMotion: true });
    await scenario({ skipped: true });
    console.log('Project transition: navigation resolves without rendering waits; fallback, reduced motion and skipped animation pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
