const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require('playwright');

const shaderPath = process.argv.slice(2).find(argument => !argument.startsWith('--'));
const source = fs.readFileSync(shaderPath || path.join(__dirname, '../src/components/hero/shaders.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const shaders = {};
new Function('exports', compiled.outputText)(shaders);
const surfaceModule = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../src/components/hero/iconSurfaceFade.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.PERF_CHROMIUM });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.route('http://shader.test/**', route => route.fulfill({
            contentType: route.request().url().endsWith('.js') ? 'application/javascript' : 'text/html',
            body: route.request().url().endsWith('.js')
                ? fs.readFileSync(path.join(path.dirname(require.resolve('three')), 'three.module.js'), 'utf8')
                : '<html><body></body></html>'
        }));
        await page.goto('http://shader.test/');
        const samples = await page.evaluate(async ({ fragmentShader, vertexShader, contourMaterial }) => {
            const THREE = await import('http://shader.test/three.js');
            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(8, 8);
            renderer.setClearColor(0x090f0e, 1);
            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
            camera.position.z = 2;
            const matrix = new THREE.Matrix4();
            const material = new THREE.ShaderMaterial({
                ...(contourMaterial || { fragmentShader, vertexShader }),
                uniforms: {
                    myPosition: { value: new THREE.Vector3() },
                    useGradientMatrix: { value: true },
                    gradientMatrix: { value: matrix },
                    useGroupGradient: { value: false },
                    gradientCenter: { value: new THREE.Vector3() },
                    gradientWidth: { value: 40 }
                }
            });
            scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
            const target = new THREE.WebGLRenderTarget(8, 8);
            renderer.setRenderTarget(target);
            const results = [];
            for (const y of [-1000, -890.125, -790.125, -690]) {
                matrix.makeTranslation(0, y, 0);
                renderer.render(scene, camera);
                const pixel = new Uint8Array(4);
                renderer.readRenderTargetPixels(target, 4, 4, 1, 1, pixel);
                results.push({ y, pixel: [...pixel] });
            }
            material.dispose(); target.dispose(); renderer.dispose();
            return results;
        }, shaders);
        assert.deepEqual(errors, [], 'shader compiles without WebGL errors');
        assert.deepEqual(samples[0].pixel, [9, 15, 14, 255], 'fully faded contour leaves the background untouched');
        assert.deepEqual(samples[1].pixel, [9, 15, 14, 255], 'fade boundary leaves no black silhouette');
        assert.ok(samples[2].pixel[1] > 100 && samples[2].pixel[1] < 200, 'half fade blends with the background');
        assert.ok(samples[3].pixel[1] > 240, 'visible contour keeps its full color');
        assert.equal(shaders.contourMaterial.depthWrite, false, 'fading contours do not occlude later transparent geometry');
        console.log('PASS: actual WebGL contour shader, full/half/zero fade, background preservation, no compile errors');
        const surface = await page.evaluate(async ({ code, original }) => {
            const THREE = await import('http://shader.test/three.js');
            const module = {};
            new Function('exports', 'require', code)(module, () => THREE);
            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(8, 8);
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.setClearColor(new THREE.Color(0x090f0e).convertSRGBToLinear(), 1);
            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
            camera.position.z = 2;
            const matrix = { value: new THREE.Matrix4() };
            const source = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const material = original ? source : module.createIconSurfaceMaterial(source, matrix);
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
            scene.add(mesh);
            const target = new THREE.WebGLRenderTarget(8, 8);
            target.texture.encoding = THREE.sRGBEncoding;
            renderer.setRenderTarget(target);
            const pixels = [];
            for (const y of [-1000, -890.125, -790.125, -690]) {
                matrix.value.makeTranslation(0, y, 0);
                renderer.render(scene, camera);
                const pixel = new Uint8Array(4);
                renderer.readRenderTargetPixels(target, 4, 4, 1, 1, pixel);
                pixels.push([...pixel]);
            }
            const result = { pixels, calls: renderer.info.render.calls,
                transparent: material.transparent, depthWrite: material.depthWrite,
                sourceUnchanged: source.onBeforeCompile.toString() === new THREE.MeshStandardMaterial().onBeforeCompile.toString() };
            mesh.geometry.dispose(); material.dispose(); source.dispose(); target.dispose(); renderer.dispose();
            return result;
        }, { code: surfaceModule, original: process.argv.includes('--original-surfaces') });
        assert.deepEqual(errors, [], 'PBR surface shader compiles without WebGL errors');
        assert.deepEqual(surface.pixels[0], [9, 15, 14, 255], 'fully faded solid leaves the background untouched');
        assert.deepEqual(surface.pixels[1], [9, 15, 14, 255], 'solid fade boundary has no black silhouette');
        assert.ok(surface.pixels[2][1] > 0 && surface.pixels[2][1] < 15, 'solid blends smoothly toward the background');
        assert.deepEqual(surface.pixels[3], [0, 0, 0, 255], 'visible solid preserves its original shading');
        assert.equal(surface.calls, 1, 'no additional draw calls');
        assert.equal(surface.transparent, false, 'solid stays in the opaque rendering path');
        assert.equal(surface.depthWrite, true, 'solid retains depth occlusion');
        assert.equal(surface.sourceUnchanged, true, 'cached GLTF material is untouched');
        console.log('PASS: actual PBR solid fade, background preservation, one opaque draw, original material untouched');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
