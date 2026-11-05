const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { ShaderLib } = require('three');
function readModule(file) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
    const context = { exports: {} };
    vm.runInNewContext(compiled.outputText, context);
    return context.exports;
}
const { workPreviewFragment } = readModule('../src/components/hero/workPreviewShader.ts');
const { fragmentShader } = readModule('../src/components/hero/shaders.ts');
for (const source of [fragmentShader, ShaderLib.standard.fragmentShader, ShaderLib.basic.fragmentShader]) {
    const result = workPreviewFragment(source).replace(/\/\/[^\n]*/g, '');
    assert.equal((result.match(/void\s+main\s*\(/g) || []).length, 1, 'one active entry point after wrapping');
    assert.equal((result.match(/void\s+workOriginalMain\s*\(/g) || []).length, 1, 'the actual entry point is renamed');
    assert.ok(result.includes('workOriginalMain();'), 'surface shading runs before the edge fade');
}
console.log('PASS: preview fade wraps contour, PBR and screenshot shaders, ignoring commented entry points');

// R3F reattaches JSX materials during selection updates. Exercise that lifecycle
// with real Three materials and two carousel slots sharing one original surface.
function loadTs(file) {
    const source = fs.readFileSync(file, 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
    const context = { exports: {}, require: name => name.startsWith('.')
        ? loadTs(path.resolve(path.dirname(file), name + '.ts')) : require(name) };
    vm.runInNewContext(compiled.outputText, context);
    return context.exports;
}
const { createWorkFadeMaterials } = loadTs(path.join(__dirname, '../src/components/hero/workFadeMaterials.ts'));
const { Group, Mesh, BoxGeometry, MeshBasicMaterial, ShaderMaterial, Vector2, Vector4 } = require('three');
const uniforms = () => ({ resolution: { value: new Vector2(1200, 800) }, bounds: { value: new Vector4(0, 0, 1, 1) } });
const original = new MeshBasicMaterial();
const gradient = { value: 12 };
const contour = new ShaderMaterial({ fragmentShader, transparent: true, uniforms: { gradientWidth: gradient } });
const geometry = new BoxGeometry();
const first = new Group(), second = new Group();
const mesh = new Mesh(geometry, original), outline = new Mesh(geometry, contour);
first.add(mesh, outline); second.add(new Mesh(geometry, original));
const firstUniforms = uniforms(), secondUniforms = uniforms();
const firstBinding = createWorkFadeMaterials(firstUniforms), secondBinding = createWorkFadeMaterials(secondUniforms);
firstBinding.sync(first); secondBinding.sync(second);
const wrapped = mesh.material;
assert.notEqual(wrapped, original);
assert.equal(original.transparent, false, 'shared originals remain untouched');
assert.notEqual(wrapped, second.children[0].material, 'slots own separate fade uniforms');
assert.equal(outline.material.uniforms.gradientWidth, gradient, 'live gradient controls stay connected');
for (let i = 0; i < 10; i++) {
    mesh.material = original; outline.material = contour; // React selection update
    firstBinding.sync(first);
    assert.equal(mesh.material, wrapped, 'reattached JSX material is wrapped again without allocating');
    const shader = { uniforms: {}, vertexShader: ShaderLib.basic.vertexShader, fragmentShader: ShaderLib.basic.fragmentShader };
    mesh.material.onBeforeCompile(shader);
    assert.equal(shader.uniforms.workBounds, firstUniforms.bounds, 'the spatial fading bounds survive every selection');
    assert.equal(shader.uniforms.workContour.value, 0, 'screens and solid faces do not emit the contour light band');
    assert.ok(shader.fragmentShader.includes('(gl_FragColor.rgb + edgeLight) * fade'), 'contour energy fades before bloom');
}
firstBinding.dispose(); secondBinding.dispose();
assert.equal(mesh.material, original); assert.equal(outline.material, contour);
const sectionBinding = createWorkFadeMaterials(firstUniforms, false);
sectionBinding.sync(first);
assert.equal(mesh.material.transparent, false, 'section panels populate depth before blended contours');
assert.equal(mesh.material.depthTest, true);
assert.equal(mesh.material.depthWrite, true);
assert.equal(outline.material.transparent, true, 'contour alpha and glow keep blending');
const replaced = mesh.material;
let disposed = false;
replaced.addEventListener('dispose', () => { disposed = true; });
mesh.material = new MeshBasicMaterial();
sectionBinding.sync(first);
assert.ok(disposed, 'a detached screen material is evicted');
const sectionShader = { uniforms: {}, vertexShader: ShaderLib.basic.vertexShader, fragmentShader: ShaderLib.basic.fragmentShader };
mesh.material.onBeforeCompile(sectionShader);
assert.ok(sectionShader.vertexShader.includes('workClipPosition = gl_Position'));
assert.ok(sectionShader.fragmentShader.indexOf('if (workReveal <= 0.0001) discard;') < sectionShader.fragmentShader.lastIndexOf('workOriginalMain();'));
sectionBinding.dispose();
mesh.material.dispose();
geometry.dispose(); original.dispose(); contour.dispose();
console.log('PASS: repeated selection material replacement, isolated slot fades, live gradients, and bloom brightness fading');
