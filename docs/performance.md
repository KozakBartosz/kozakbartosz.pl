# Performance investigation — 2026-10-25

## Scope and result

Baseline is commit `546c5ff` (cursor commit `980ecfd` is included). Existing work was committed before this investigation. The changes in this investigation are not committed.

The severe slowdown is reproducible on a **large viewport**, not at every window size. Production at 1440 × 1000 CSS pixels stays near the observed 60 Hz refresh cadence. At 2560 × 1440, the same application drops to roughly 30–40 requestAnimationFrame callbacks/second. Main-thread work remains small and there are no >50 ms long tasks in the samples. This points toward rendering/compositing throughput, rather than a long blocking React task; GPU timings are still needed to separate GPU passes from compositor work conclusively.

This is a first optimization batch, not a claim that the entire reported problem is fixed. No bloom, depth of field, reflection quality, physics bodies, model quality, cursor colors, or interaction has been intentionally removed.

## Environment

- MacBook Pro, Apple M1 Pro, 8-core CPU / 14-core GPU, 16 GB RAM; macOS 26.5.2.
- AC power, battery charged. Other user applications/processes were left running.
- Playwright Chromium 1187, headed, ANGLE Metal. Reported renderer: `ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)`.
- Browser deviceScaleFactor 2. Observed scheduling cadence near 60 Hz; not a 120 Hz acceptance test.
- External display reports 2560 × 1440 at 60 Hz; internal Retina display is also connected. These are controlled browser viewport tests, not proof of which physical display the user normally uses.
- Separate production snapshots in `/tmp/portfolio-performance/`; no changes to the working checkout's `.next`, no user servers stopped. Ports 3105/3106/3107 are investigation-owned.
- No SwiftShader/software GPU numbers are used here.

## Method and limitations

After a 10-second load/physics warm-up, each scenario settles for 1.5 seconds and samples 4 seconds. A requestAnimationFrame probe records callback intervals; CDP Performance metrics report main-thread task, script, layout, and style durations. A Long Tasks observer records >50 ms tasks. WebGL draw calls are counted at the API boundary; canvas dimensions and actual renderer identity are recorded.

Pointer movement is a deterministic synthetic PointerEvent replay at animation-frame cadence. This exercises the application handlers but does not reproduce all trusted input, hardware pointer coalescing, or native hit-testing costs. A separate regression uses real Playwright mouse events and link activation. `over25` counts callback intervals >25 ms; it is **not** Chrome's compositor dropped/presented-frame counter. `p95` includes browser scheduling and is not a GPU timer.

Scene physics and its initial rotations are nondeterministic. Total scene draw calls across independent runs cannot be compared as if identical geometry remained in view. Timing runs are single samples, not confidence intervals; don't advertise their differences as percentage speedups. The small viewport after sample had a brief overlapping diagnostic-browser startup; treat its timings as a cadence/regression check, not evidence of a speedup.

The `no-cursor-draw` and `no-scene-draw` scenarios suppress native draw calls only. They leave JS, framebuffer clears, workers, postprocessing setup and DOM composition running. They do not measure the cost of unmounting those systems. Direct compositing time, GPU pass time, triangle totals, and a full allocation census were not collected; those are pending profiler work.

## Baseline and first-batch observations

Raw samples are in `docs/performance-data/`.

| Viewport | Scenario | Baseline callbacks / 4 s | First batch callbacks / 4 s | Baseline p95 | First batch p95 |
| --- | --- | ---: | ---: | ---: | ---: |
| 1440 × 1000 | idle | 241 | 241 | 17.5 ms | 17.5 ms |
| 1440 × 1000 | movement | 241 | 241 | 17.6 ms | 17.6 ms |
| 1440 × 1000 | hold / physics attraction | 241 | 241 | 17.5 ms | 17.7 ms |
| 1440 × 1000 | front-end section | 241 | 241 | 17.6 ms | 17.6 ms |
| 1440 × 1000 | contact section | 241 | 241 | 17.4 ms | 17.6 ms |
| 1440 × 1000 | scrolling | 241 | 241 | 17.5 ms | 18.0 ms |
| 2560 × 1440 | idle | 147 | 156 | 34.2 ms | 33.9 ms |
| 2560 × 1440 | movement | 134 | 142 | 49.2 ms | 34.3 ms |

All listed samples had zero observed long tasks. At the large viewport, baseline movement used 0.333 s of main-thread task time and 0.283 s script time across roughly 4 seconds, while callbacks were already frequently >25 ms. This does not look CPU-saturated.

The actual scene drawing buffer was 1425 × 1000 / 2545 × 1440 (scrollbar reduces width), despite the browser DPR setting. Do not assume it renders at DPR 2: the installed composer/renderer sizing path controls the final output. Each cursor buffer was 2137 × 1500 / 3817 × 2160 (DPR cap 1.5). At the large size, each cursor buffer is ~8.24 million pixels; three remain allocated. Scissor limits cursor fragment drawing but clearing/compositing surfaces still has a cost.

Controlled large-viewport **idle** ablations on the temporary baseline build:

| Single change | Callbacks / 4 s | p95 |
| --- | ---: | ---: |
| No postprocessing | 241 | 17.5 ms |
| No mirror | 151 | 34.2 ms |
| No normal pass | 147 | 34.2 ms |

These separate page loads still have randomized physics, but the postprocessing bypass is a substantial directional result: normal 60 Hz scheduling returns while rendering the scene without DOF/bloom/composer. Mirror removal and normal-pass removal alone do not achieve that. The main next target is the postprocessing pipeline, not an unsupported claim that the decorative cursor causes everything. Do not ship the `no-post` ablation: it changes the design and was only injected into the temporary snapshot.

## Confirmed redundant work and implemented changes

### Unused normal pass

The installed `@react-three/postprocessing` composer creates and enables a full `NormalPass` by default. Current DOF and Bloom effects do not read it; SSAO would. `PostEffects.tsx` now sets `disableNormalPass`.

A stronger check than two independent screenshots: freeze the application animation callbacks, retain the exact scene and camera, call the same composer synchronously with normal pass on/off, then read the output framebuffer. Result: **162 → 95 draw calls; zero changed output bytes** at 1425 × 1000. See `normal-pass.json`. This proves redundant work was removed in that captured scene without a visual change. It does not establish a 41% overall frame-time gain.

### Repeated pointer projection

Previously every one of the 41 cones installed its own body pointermove/touch listener and recomputed the same camera projection. `GrabPointer.tsx` provides one shared mutable projected position. `Cone.tsx` reads it for its existing attraction forces. Listener cleanup is paired with setup; position subscriptions now unsubscribe on unmount. Resize updates projection aspect. Touch still disables mouse attraction.

Instrumented mounted body pointermove listeners: **41 → 1**. The force law, bounds, impulses and body count remain unchanged.

### Idle DOM measurement and allocation

`Icon.tsx` previously measured all three section placeholders every rendered frame. Bounds now refresh on scroll, resize and ResizeObserver changes to the body/placeholder. Camera and temporary vectors are reused. Animation and perspective placement continue each frame.

Instrumented global getBoundingClientRect calls after load, no pointer/scroll, 4 seconds: **720 → 0**. Scroll/resize still invalidate the cache. Dynamic layout movement that changes a placeholder position without body/placeholder resizing would need an additional invalidation source if introduced later.

### Transparent cursor pass

The press-inversion layer was drawn every cursor frame even when its alpha was zero. It now skips drawing outside a press, clears once after fading out, and then stays untouched. Hue and outline are unchanged; all three contexts/surfaces still exist.

At 60 Hz, movement replay: **720 → 480 cursor draw calls / 4 s**. Press replay still draws all three layers (723 calls in the sample). Native `/cursor.png` hotspot 3,3, pink hue, gradient outline, capsule width, hover morph and coordinate conversion remain intact.

### Redundant final framebuffer antialiasing

The composer already multisamples the scene (installed default 8 samples). Its final pass covers the screen. `Hero.tsx` requests a non-multisampled default framebuffer, avoiding a second multisampled target/resolve for that fullscreen output. Composer scene antialiasing and effect settings remain unchanged. The final large-viewport sample (`optimized-aa-large.json`) recorded 164 idle / 151 movement callbacks in 4 seconds, p95 34.0 / 34.2 ms, zero long tasks and zero page errors. The initial baseline recorded 147 / 134. These are single randomized runs, so the measured work reductions are stronger evidence than a claimed percentage improvement. The final result still misses 60 Hz.

## Ranked next steps

| Priority | Evidence / hypothesis | Work | Risk / validation |
| --- | --- | --- | --- |
| 1 | Confirmed large-viewport throughput loss; no-postprocessing returns to 60 Hz, low main-thread occupancy | Capture Chrome Performance + GPU trace at 2560 × 1440; identify expensive render targets, MSAA resolves, DOF/bloom/mirror passes and composition | Read-only profiling. GPU query/trace results must distinguish GPU rendering from compositor/presentation. Repeat samples serially. |
| 2 | Three oversized cursor surfaces are confirmed; their share of slowdown is unproven | Independently hide/unmount cursor, hide each blend layer, and compare with rendering suppressed. Prototype bounded surfaces only if this helps | Moving/cropping surfaces can break hue/difference blending, coordinates or introduce layout churn. Pixel-check dark/gradient/text backgrounds, rapid movement, wide links, fractional DPR, viewport edges. |
| 3 | Composer creates 8x multisampled buffers plus DOF/two blooms | Measure samples 8/4/0 and effect resolution changes independently, preserving baseline screenshots | These are explicit quality tradeoffs until visual equality is shown. Do not silently reduce DPR, bloom or DOF. |
| 4 | Mirror renders a second scene and blur into 512-pixel targets | Measure mirror disabled, then cost of resolution/blur separately | Reflection is a defining visual. Only change quality with a clear comparison. |
| 5 | Fixed scene and worker continue under lower sections; section icons still visibly depend on scene | Separate hero physics/reflection work from lower-page icon rendering before pausing offscreen hero work | Cannot simply stop/unmount the whole canvas outside hero. Test icons, camera/scroll continuity, physics resume and navigation. |
| 6 | Existing Playground timers/global listeners have incomplete cleanup | Add lifecycle cleanup and visibility pause with controlled resume; verify no duplicate handlers after remount | Avoid restarting the 4-second intro or changing gravity on resume. Test tab switch, blur, context restoration and touch orientation. |
| 7 | Models/materials potentially create avoidable draw calls | Record triangles/material switches, then assess shared geometry/materials and instancing of cones | Preserve per-body hover shaders, raycasting and physics mapping. No geometry simplification without visual review. |

Do not rank a suspected optimization by an invented gain. Promote it only after a controlled comparison.

## Reproduce

Use an external Playwright installation, for example the existing `/tmp/portfolio-cursor-check/node_modules`, rather than changing project dependencies:

```sh
NODE_PATH=/tmp/portfolio-cursor-check/node_modules \
PERF_CHROMIUM=/Users/bartosz/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium \
node scripts/profile-performance.cjs http://localhost:3105 /tmp/baseline.json
```

Set `PERF_WIDTH=2560 PERF_HEIGHT=1440` to reproduce the larger window. Run one profiling browser at a time, keep power/display settings fixed, wait for other builds to finish, and repeat at least five alternating baseline/candidate samples before making a timing claim. Use `npm run build`/`npm run start -- -p <unused-port>` in a temporary source snapshot with its own `.next`; do not overwrite a user's active development build. The script never disables scene draws in production; ablations are injected only into its browser.

For a complete next profiler pass, add a Chrome trace with JS/layout/paint/composite/GPU categories and actual trusted drag input; capture tab hide/resume and all section transitions. Use a fixed physics seed or freeze scene state for pixel/work comparisons. Preserve scene quality in the first tier of changes.

Acceptance: match the target display's frame budget (16.7 ms at 60 Hz; 8.3 ms at 120 Hz), verify actually presented/dropped frames, and retain the current visuals/interaction. The large viewport does **not** yet meet that target.

## Verification of the final batch

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed, with the existing CameraEffects hook-dependency warning. The prior Cone missing-dependency warning is removed.
- Isolated production `npm run build`: passed. Existing Browserslist and optional cannon `worker_threads` warnings remain.
- `git diff --check` and `node --check scripts/profile-performance.cjs`: passed.
- Hardware-Metal cursor regression on the final production build: normal movement draws only hue/outline and sleeps after settling; pressing draws inversion; releasing clears it and sleeps. Hover center error was 0.031 CSS px horizontally / 0.005 vertically, morph >0.9999; real link clicks scrolled correctly; native PNG hotspot 3,3 remained; live reduced-motion disable/enable, tab hide/resume and cursor reappearance passed. No page errors. Full-scene drawing was enabled during this test.
- Background/resume validation covers cursor state and absence of page errors, not an exhaustive measurement of background worker power use.

No optimization changes were committed or pushed as part of this investigation.
