const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/components/workCarousel.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const context = { exports: {} };
vm.runInNewContext(compiled.outputText, context);
const { workProjectIndex, workProjectOffset, WORK_PROJECT_COUNT: count } = context.exports;

assert.equal(workProjectIndex(-1), 3, 'dragging right from the first project wraps to the last');
assert.equal(workProjectIndex(4), 0, 'dragging left from the last project wraps to the first');
assert.equal(workProjectIndex(.49), 0, 'a partial drag stays on the current project');
assert.equal(workProjectIndex(.51), 1, 'crossing the midpoint selects the next project');
assert.equal(workProjectOffset(3, 3.5), -.5);
assert.equal(workProjectOffset(0, 3.5), .5);

for (let step = -800; step <= 800; step++) {
    const position = step / 100;
    const visible = Array.from({ length: count }, (_, index) => workProjectOffset(index, position))
        .filter(offset => Math.abs(offset) < 1 - 1e-9);
    assert.ok(visible.length >= 1 && visible.length <= 2, `only adjacent projects may be visible at ${position}`);
    for (let index = 0; index < count; index++) {
        assert.ok(Math.abs(workProjectOffset(index, position) - workProjectOffset(index, position + count)) < 1e-10,
            'the carousel must stay continuous across repeated loops');
    }
}
console.log('PASS: progressive selection, both wrap directions, and adjacent model visibility');
