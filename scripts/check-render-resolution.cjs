const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../src/components/hero/renderResolution.ts'), 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS
  }
}).outputText;
const exportsObj = {};
new Function('exports', compiled)(exportsObj);
const {
  getSceneRenderSize: size
} = exportsObj;
assert.deepEqual(size(2545, 1440, 1, 0), [2545, 1440]);
assert.deepEqual(size(1425, 1000, 1, 2073600), [1425, 1000]);
for (const dpr of [1, 1.25, 2]) {
  const [w, h] = size(2545, 1440, dpr, 2073600);
  assert.ok(w * h * dpr * dpr <= 2073600);
  assert.ok(Math.abs(w / h - 2545 / 1440) < .003);
  assert.ok(w <= 2545 && h <= 1440);
}
for (const budget of [NaN, Infinity, -1]) assert.deepEqual(size(2545, 1440, 1, budget), [2545, 1440]);
console.log('PASS: opt-in pixel budget caps actual pixels across DPRs; default and smaller viewports unchanged');
