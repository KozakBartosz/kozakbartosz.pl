const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/hero/cameraMotion.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { cameraApproach } = context.exports;
let position = 80;
for (const delta of [1/60, 1/60, 8, 1/60, 30, 1/60]) {
    position += (155 - position) * cameraApproach(delta, 1.2);
    assert(position >= 80 && position <= 155, 'a suspended frame must never overshoot or reverse the camera');
}
assert(cameraApproach(10, 1.2) < .1, 'resuming a suspended tab does not teleport the camera');
for (const delta of [0, -1, NaN, Infinity, 1/240, 1/60, 1, 30]) {
    const alpha = cameraApproach(delta, 96);
    assert(Number.isFinite(alpha) && alpha >= 0 && alpha <= 1, 'all interpolation weights stay bounded');
}
console.log('PASS: camera damping remains bounded after long frames and tab suspension');
