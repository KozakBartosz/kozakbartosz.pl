/* Diagnostic only: requires a production snapshot with a composer ref exported
 * as window.__composer. Never add that hook to the shipped application.
 * NODE_PATH=<external playwright modules> PERF_CHROMIUM=<headed Chromium> node
 * scripts/profile-pipeline.cjs http://localhost:3115 docs/performance-data/pipeline
 */
const {
  chromium
} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const url = process.argv[2] || 'http://localhost:3115';
const out = process.argv[3] || '/tmp/portfolio-pipeline-results';
fs.mkdirSync(out, {
  recursive: true
});
(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: process.env.PERF_CHROMIUM,
    args: process.platform === 'darwin' ? ['--use-angle=metal'] : []
  });
  try {
    const page = await browser.newPage({
      viewport: {
        width: 2560,
        height: 1440
      },
      deviceScaleFactor: 2
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.nativeRAF = requestAnimationFrame.bind(window);
      window.frozen = false;
      window.requestAnimationFrame = cb => window.nativeRAF(t => {
        if (!window.frozen) cb(t);
      });
      const post = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (m, ...args) {
        if (window.frozen && m.op === 'step') return;
        return post.call(this, m, ...args);
      };
      // Deterministic initial rotations; one live scene is retained for all variants.
      let seed = 1729;
      Math.random = () => (seed = 1664525 * seed + 1013904223 >>> 0) / 4294967296;
    });
    await page.goto(url);
    await page.waitForFunction(() => window.__composer?.passes.length > 1);
    await page.waitForTimeout(10000);
    await page.evaluate(enabled => {
      window.measureGPU = enabled;
    }, process.env.PERF_GPU !== '0');
    const env = await page.evaluate(() => {
      window.frozen = true;
      const c = window.__composer,
        r = c.getRenderer(),
        g = r.getContext();
      const ext = g.getExtension('WEBGL_debug_renderer_info');
      const renderer = ext && g.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      return {
        renderer,
        version: g.getParameter(g.VERSION),
        dpr: devicePixelRatio,
        gpuQueriesEnabled: window.measureGPU,
        maxSamples: g.getParameter(g.MAX_SAMPLES),
        timerQuery: !!g.getExtension('EXT_disjoint_timer_query_webgl2'),
        drawingBuffer: [g.drawingBufferWidth, g.drawingBufferHeight],
        userAgent: navigator.userAgent
      };
    });
    if (!/Apple|AMD|Intel|NVIDIA/i.test(env.renderer) || /SwiftShader|llvmpipe/i.test(env.renderer)) throw new Error(`Hardware GPU required: ${env.renderer}`);
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const c = window.__composer,
        r = c.getRenderer(),
        pass = c.passes.find(p => p.effects);
      const effects = [...pass.effects],
        blooms = effects.filter(e => e.name === 'BloomEffect'),
        dof = effects.find(e => e.name === 'DepthOfFieldEffect');
      const scene = c.passes[0].scene;
      window.exportScene = () => {
        const objects = [];
        scene.traverse(o => objects.push({
          type: o.type,
          name: o.name,
          position: o.position.toArray(),
          quaternion: o.quaternion.toArray(),
          scale: o.scale.toArray(),
          matrix: o.matrix.toArray(),
          matrixAutoUpdate: o.matrixAutoUpdate
        }));
        const camera = c.passes[0].camera;
        return {
          objects,
          camera: {
            position: camera.position.toArray(),
            quaternion: camera.quaternion.toArray(),
            projection: camera.projectionMatrix.toArray()
          }
        };
      };
      window.restoreScene = snapshot => {
        const objects = [];
        scene.traverse(o => objects.push(o));
        if (objects.length !== snapshot.objects.length) throw new Error('Scene hierarchy differs');
        objects.forEach((o, i) => {
          const old = snapshot.objects[i];
          if (o.type !== old.type || o.name !== old.name) throw new Error('Scene object mismatch ' + i);
          o.position.fromArray(old.position);
          o.quaternion.fromArray(old.quaternion);
          o.scale.fromArray(old.scale);
          if (!old.matrix) throw new Error("Snapshot missing physics matrix");
          o.matrix.fromArray(old.matrix);
          o.matrixAutoUpdate = old.matrixAutoUpdate;
        });
        const camera = c.passes[0].camera;
        camera.position.fromArray(snapshot.camera.position);
        camera.quaternion.fromArray(snapshot.camera.quaternion);
        camera.projectionMatrix.fromArray(snapshot.camera.projection);
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
      };
      const mirrors = [];
      scene.traverse(o => {
        if (o.onBeforeRender?.toString().includes('virtualCamera') || o.type === 'Reflector') mirrors.push(o);
      });
      // Drei Reflector is a regular Mesh; identify its reflection material.
      if (!mirrors.length) scene.traverse(o => {
        if (o.material?.uniforms?.tDiffuse && o.material?.uniforms?.tDepth) mirrors.push(o);
      });
      const updates = effects.map(e => e.update);
      window.pipeline = {
        c,
        r,
        pass,
        effects,
        blooms,
        dof,
        mirrors,
        updates,
        width: c.inputBuffer.width,
        height: c.inputBuffer.height,
        kernels: blooms.map(e => e.kernelSize)
      };
      window.applyVariant = name => {
        const p = window.pipeline;
        if (c.multisampling !== 8) c.multisampling = 8;
        c.setSize(p.width, p.height, false);
        effects.forEach((e, i) => {
          e.update = updates[i];
        });
        blooms.forEach((e, i) => {
          e.luminancePass.getResolution().setScale(1);
          e.resolution.scale = .5;
          e.kernelSize = p.kernels[i];
          e.luminanceMaterial.setSmoothingFactor(i ? 2 : 10);
        });
        dof.resolution.scale = .5;
        mirrors.forEach(o => {
          o.visible = true;
        });
        pass.effects = [...effects];
        if (name === 'no-bloom-1' || name === 'no-blooms') pass.effects = pass.effects.filter(e => e !== blooms[0]);
        if (name === 'no-bloom-2' || name === 'no-blooms') pass.effects = pass.effects.filter(e => e !== blooms[1]);
        if (name.includes('no-dof')) pass.effects = pass.effects.filter(e => e !== dof);
        window.skipMirror = name.includes('no-mirror');
        if (name === 'no-effects') pass.effects = [];
        if (name.startsWith('msaa-')) c.multisampling = Number(name.split('-')[1]);
        if (name.startsWith('bloom-scale-')) blooms.forEach(e => {
          e.resolution.scale = Number(name.slice(12));
        });
        if (name === 'bloom-luminance-half') blooms.forEach(e => {
          e.luminancePass.getResolution().setScale(.5);
          e.setSize(p.width, p.height);
        });
        if (name.startsWith('kernel-')) blooms.forEach(e => {
          e.kernelSize = Number(name.slice(7));
        });
        if (name === 'smoothing-1') blooms.forEach(e => {
          e.luminanceMaterial.setSmoothingFactor(1);
        });
        if (name.startsWith('dof-height-')) dof.resolution.setPreferredHeight(Number(name.slice(11)));else dof.resolution.setPreferredHeight(-1);
        if (name.startsWith('render-scale-')) c.setSize(Math.round(p.width * Number(name.slice(13))), Math.round(p.height * Number(name.slice(13))), false);
        pass.recompile();
      };
      const state = window.__state;
      const mirrorFrames = state.internal.subscribers.filter(s => s.ref.current.toString().includes('shadowMap'));
      if (mirrorFrames.length !== 1) throw new Error('Expected one reflector callback, got ' + mirrorFrames.length);
      window.renderOne = () => {
        r.autoClear = false;
        if (!window.skipMirror) mirrorFrames.forEach(s => s.ref.current(state, 0));
        c.render(0);
      };
      window.inventory = () => {
        const targets = new Map(),
          renders = [],
          gl = r.getContext();
        const set = r.setRenderTarget,
          render = r.render;
        let current = null;
        r.setRenderTarget = function (t, ...args) {
          current = t;
          if (t) targets.set(t, {
            name: t.texture.name,
            width: t.width,
            height: t.height,
            samples: t.samples || 0,
            type: t.texture.type,
            format: t.texture.format,
            depth: t.depthBuffer,
            depthType: t.depthTexture?.type
          });
          return set.call(this, t, ...args);
        };
        r.render = function (s, c) {
          renders.push({
            target: current?.texture.name || 'screen',
            material: s.children[0]?.material?.name
          });
          return render.call(this, s, c);
        };
        let resolves = 0,
          multisampleAllocations = [];
        const blit = gl.blitFramebuffer,
          storage = gl.renderbufferStorageMultisample;
        gl.blitFramebuffer = function (...args) {
          resolves++;
          return blit.apply(this, args);
        };
        gl.renderbufferStorageMultisample = function (...args) {
          multisampleAllocations.push(args);
          return storage.apply(this, args);
        };
        try {
          window.renderOne();
        } finally {
          r.setRenderTarget = set;
          r.render = render;
          gl.blitFramebuffer = blit;
          gl.renderbufferStorageMultisample = storage;
        }
        const allocatedTargets = [],
          seen = new Set();
        const visit = (value, depth) => {
          if (!value || typeof value !== 'object' || seen.has(value) || depth > 3) return;
          seen.add(value);
          if (value.isWebGLRenderTarget) {
            allocatedTargets.push({
              name: value.texture.name,
              width: value.width,
              height: value.height,
              samples: value.samples || 0,
              type: value.texture.type,
              format: value.texture.format,
              depth: value.depthBuffer
            });
            return;
          }
          if (value === r || value === scene || value.isTexture || value.isMaterial || value.isObject3D) return;
          Object.values(value).forEach(v => visit(v, depth + 1));
        };
        visit({
          input: c.inputBuffer,
          output: c.outputBuffer,
          effects
        }, 0);
        return {
          targets: [...targets.values()],
          allocatedTargets,
          renders,
          resolves,
          multisampleAllocations,
          mirrors: mirrorFrames.length,
          bloomKernels: blooms.map(e => e.blurPass.blurMaterial?.kernelSequence?.length),
          effects: pass.effects.map(e => e.name)
        };
      };
      window.sample = async duration => {
        const g = r.getContext(),
          ext = window.measureGPU && g.getExtension('EXT_disjoint_timer_query_webgl2');
        const intervals = [],
          gpu = [],
          queries = [];
        let previous,
          begin,
          disjoint = 0;
        await new Promise(resolve => {
          function tick(t) {
            if (begin === undefined) begin = t;
            if (previous !== undefined) intervals.push(t - previous);
            previous = t;
            const q = ext ? g.createQuery() : null;
            if (q) g.beginQuery(ext.TIME_ELAPSED_EXT, q);
            window.renderOne();
            if (q) {
              g.endQuery(ext.TIME_ELAPSED_EXT);
              queries.push(q);
            }
            if (ext && g.getParameter(ext.GPU_DISJOINT_EXT)) {
              disjoint++;
              queries.splice(0).forEach(q => g.deleteQuery(q));
            } else if (ext) {
              while (queries.length && g.getQueryParameter(queries[0], g.QUERY_RESULT_AVAILABLE)) {
                const done = queries.shift();
                gpu.push(g.getQueryParameter(done, g.QUERY_RESULT) / 1e6);
                g.deleteQuery(done);
              }
            }
            if (t - begin < duration) window.nativeRAF(tick);else resolve();
          }
          window.nativeRAF(tick);
        });
        queries.forEach(q => g.deleteQuery(q));
        const stats = values => {
          const a = [...values].sort((a, b) => a - b);
          return {
            count: a.length,
            mean: a.reduce((a, b) => a + b, 0) / a.length,
            p50: a[Math.floor(a.length * .5)],
            p95: a[Math.floor(a.length * .95)]
          };
        };
        return {
          frame: stats(intervals),
          gpu: stats(gpu),
          intervals,
          gpuTimes: gpu,
          disjoint,
          over25: intervals.filter(t => t > 25).length
        };
      };
    });
    if (process.env.PERF_SCENE) {
      const snapshot = JSON.parse(fs.readFileSync(process.env.PERF_SCENE, 'utf8'));
      await page.evaluate(snapshot => window.restoreScene(snapshot), snapshot);
    }
    fs.writeFileSync(path.join(out, 'scene.json'), JSON.stringify(await page.evaluate(() => window.exportScene()), null, 2));
    const variants = (process.env.PERF_VARIANTS || 'no-bloom-1,no-bloom-2,no-blooms,no-dof,no-mirror,no-dof-no-mirror,no-effects,msaa-4,msaa-2,msaa-0,bloom-scale-0.25,bloom-scale-0.375,kernel-3,kernel-4,dof-height-360,dof-height-720,render-scale-0.75,render-scale-0.833333,smoothing-1').split(',');
    const results = [];
    const pixelResults = [];
    const capturePixels = async () => page.evaluate(() => {
      window.renderOne();
      const gl = window.pipeline.r.getContext();
      const bytes = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      if (!window.referencePixels) {
        window.referencePixels = bytes;
        return {
          reference: true
        };
      }
      if (bytes.length !== window.referencePixels.length) return {
        requiresResampling: true,
        drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight]
      };
      let changed = 0,
        sum = 0,
        max = 0;
      for (let i = 0; i < bytes.length; i++) {
        const d = Math.abs(bytes[i] - window.referencePixels[i]);
        if (d) changed++;
        sum += d;
        max = Math.max(max, d);
      }
      return {
        changedChannels: changed,
        totalChannels: bytes.length,
        mae: sum / bytes.length,
        max
      };
    });
    await page.evaluate(() => window.applyVariant('baseline'));
    await capturePixels();
    for (const variant of variants) {
      for (let trial = 0; trial < Number(process.env.PERF_TRIALS || 5); trial++) {
        for (const name of ['baseline', variant]) {
          await page.evaluate(name => window.applyVariant(name), name);
          await page.evaluate(() => window.sample(600));
          const sample = await page.evaluate(() => window.sample(2000));
          results.push({
            variant,
            name,
            trial,
            ...sample
          });
          fs.writeFileSync(path.join(out, 'timings.json'), JSON.stringify({
            env,
            results,
            errors
          }, null, 2));
          console.log(JSON.stringify({
            variant,
            name,
            trial,
            frame: sample.frame,
            gpu: sample.gpu
          }));
        }
      }
      await page.evaluate(name => window.applyVariant(name), variant);
      const inventory = await page.evaluate(() => window.inventory());
      pixelResults.push({
        variant,
        ...(await capturePixels())
      });
      fs.writeFileSync(path.join(out, 'pixels.json'), JSON.stringify(pixelResults, null, 2));
      await page.evaluate(() => {
        window.renderOne();
      });
      await page.screenshot({
        path: path.join(out, `${variant}.png`)
      });
      fs.writeFileSync(path.join(out, `${variant}.json`), JSON.stringify(inventory, null, 2));
    }
    if (process.env.PERF_TRACE === '1') {
      const cdp = await page.context().newCDPSession(page);
      for (const name of ['baseline', ...variants]) {
        await page.evaluate(name => window.applyVariant(name), name);
        await page.evaluate(() => {
          window.measureGPU = false;
        });
        await page.evaluate(() => window.sample(1000));
        await cdp.send('Tracing.start', {
          categories: 'benchmark,cc,viz,gpu,devtools.timeline,disabled-by-default-devtools.timeline.frame,disabled-by-default-gpu.service',
          transferMode: 'ReturnAsStream'
        });
        await page.evaluate(() => window.sample(3000));
        const completed = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
        await cdp.send('Tracing.end');
        const {
          stream
        } = await completed;
        let trace = '';
        while (true) {
          const chunk = await cdp.send('IO.read', {
            handle: stream
          });
          trace += chunk.data;
          if (chunk.eof) break;
        }
        await cdp.send('IO.close', {
          handle: stream
        });
        fs.writeFileSync(path.join(out, `${name}-trace.json.gz`), zlib.gzipSync(trace));
      }
    }
    await page.evaluate(() => window.applyVariant('baseline'));
    const framebuffer = await page.evaluate(() => {
      window.renderOne();
      const gl = window.pipeline.r.getContext(),
        w = gl.drawingBufferWidth,
        h = gl.drawingBufferHeight;
      const bytes = new Uint8Array(w * h * 4),
        flipped = new Uint8ClampedArray(bytes.length);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      for (let y = 0; y < h; y++) flipped.set(bytes.subarray(y * w * 4, (y + 1) * w * 4), (h - y - 1) * w * 4);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').putImageData(new ImageData(flipped, w, h), 0, 0);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync(path.join(out, 'framebuffer.png'), Buffer.from(framebuffer, 'base64'));
    fs.writeFileSync(path.join(out, 'baseline.json'), JSON.stringify(await page.evaluate(() => window.inventory()), null, 2));
    await page.evaluate(() => window.renderOne());
    await page.screenshot({
      path: path.join(out, 'baseline.png')
    });
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
