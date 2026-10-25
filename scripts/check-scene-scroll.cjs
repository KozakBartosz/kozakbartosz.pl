const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { PerspectiveCamera, Vector3 } = require('three');

const compiled = ts.transpileModule(
    fs.readFileSync(require.resolve('../src/components/hero/consts.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const scene = {};
new Function('exports', compiled)(scene);
const { getHeroScrollOffset, HERO_DEPHTH } = scene;

// The near edge of Mirror must project to the same viewport fraction after
// scrolling the same fraction of a screen, regardless of viewport dimensions.
function floorPosition(width, height, progress, offset) {
    const camera = new PerspectiveCamera(30, width / height, 0.1, 1000);
    const travel = offset(height * progress, height);
    camera.position.set(0, 15 - travel, 155);
    camera.lookAt(0, -travel, 0);
    camera.updateMatrixWorld();
    return new Vector3(0, -13, 86).project(camera).y;
}
const legacy = scroll => scroll / HERO_DEPHTH;
assert.ok(Math.abs(floorPosition(2560, 1440, 0.5, legacy) -
    floorPosition(1280, 720, 0.5, legacy)) > 0.1, 'Reproduce legacy floor drift');
for (const progress of [0, 0.25, 0.5, 1, 2]) {
    const reference = floorPosition(2560, 1440, progress, legacy);
    for (const [width, height] of [[2560, 1440], [1920, 1080], [1440, 900], [1280, 720], [390, 844]]) {
        assert.ok(Math.abs(floorPosition(width, height, progress, getHeroScrollOffset) - reference) < 1e-10,
            `${width}x${height}, scroll ${progress} viewport heights`);
    }
}
assert.equal(getHeroScrollOffset(0, 0), 0);
assert.ok(Number.isFinite(getHeroScrollOffset(100, 0)));
console.log('PASS: legacy drift reproduced; responsive floor projection stable across 5 viewports and 5 scroll positions.');
