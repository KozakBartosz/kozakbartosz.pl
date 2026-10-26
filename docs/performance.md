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

# Second investigation — gravity and postprocessing, 2026-10-25

This section supersedes the first batch's next-step hypotheses. Source baseline
is `0b822c1` (includes `727f0af`), captured before concurrent changes to presentation,
icons and cursor lighting. Snapshot hashes and raw data are retained. No commits
or pushes were made. Default bloom, DOF, reflection, cursor and physics quality
settings remain unchanged by this investigation.

## Delivered behavior and acceptance

- Fixed a reproducible gravity race: RMB during the intro selected `[0,-100,0]`,
  then intro timers overwrote it with `[0,-0.2,0]`. Rapid off/on had the same
  problem with pending release impulses. A new choice now cancels previous
  sequences. Unmount cancels timers/listeners; blur/cancel releases attraction.
  The force vectors and normal intro/release sequences are retained. Steady-state
  RMB after intro already worked in the baseline browser; this is the specific
  reproduced regression, not a claim that every possible gravity failure was found.
- Added an **opt-in** automatic scene pixel budget:
  `NEXT_PUBLIC_SCENE_PIXEL_BUDGET=2073600`. It caps actual renderer/composer pixels,
  scales only when needed, preserves aspect ratio and full CSS dimensions, and
  leaves the three cursor surfaces and 512px reflection targets separate. Both
  blooms, DOF, physics and interactions stay active. Default `0` leaves quality
  unchanged. The cap is a visible quality tradeoff, not an accepted default.
- **Stable 60 Hz at 2560×1440 was not achieved with preserved default quality.**
  Even 2/3 linear rendering scale had p95 frame intervals above 16.7 ms in this
  session. Do not claim the target is met or that the optional cap guarantees it.
- **120 Hz is not demonstrated.** The trace contains roughly 120-Hz compositor
  opportunities, but presentation intervals miss even the 60-Hz budget. The
  prior 60-Hz external-display cadence does not establish a 120-Hz test setup.
  A controlled 120-Hz display/power setup and p95 <=8.3 ms are still required.

## Isolation, procedure and limitations

Hardware was headed Chromium 140 / ANGLE Metal / Apple M1 Pro, DPR 2 browser
context; actual scene buffer 2545×1440. No software WebGL timings are used.
Investigation servers used ports 3115–3119 and source copies under `/tmp/portfolio-*`.
No existing user servers were stopped. An initial build command was accidentally
started in the checkout and stopped; it may have modified the active `.next`.
All subsequent builds were isolated. This procedural mistake means this run
cannot claim that the active `.next` remained untouched throughout.

The first series has 19 variants, five alternating baseline/candidate pairs per
variant. Warm scene 10 seconds, warm each switch 600 ms, sample 2 seconds. Initial
rotations are seeded. Application RAF callbacks and physics stepping are frozen;
only the original reflection callback and composer render run. Each pair sees
the exact same scene and camera. No builds or second measurement browser ran
alongside those series. Other user applications were left running. The baseline
varied significantly over the session; adjacent paired samples, not a single
session-wide baseline, are the comparison unit.

`pipeline-20261025/timings.json` retains all frame intervals and GPU query values.
`summary.md` reports means across five trials and the mean of their p95s (not a
pooled p95). GPU elapsed queries include scheduling/descheduling and can exceed
RAF intervals; they are not exclusive GPU busy time and cannot be converted to
FPS or added to CPU/frame times. The first harness checked disjoint state before
reading queries but did not retain a disjoint counter; the current script does.
Treat GPU differences as diagnostic direction, not precise isolated shader costs.

The finalist series repeats five pairs **without GPU queries**, and independently
captures a ~3-second Chrome trace for each variant. This checks query overhead
and distinguishes RAF from compositor presentation. Traces themselves perturb
execution and are single captures, not five-trial presentation acceptance.
Frozen-scene results isolate rendering; they do not prove performance for all
moving physics layouts, hover states or the later cursor-light changes.

## Actual pipeline, not assumed DPR

The installed React wrapper is 2.2.5. Its effects/composer import nested
**postprocessing 6.24.1**, despite root postprocessing being **6.25.0**. The nested
version even declares Three `<0.138`, while installed Three is 0.138.3. `npm ls`
reports this baseline peer mismatch. Root package version alone was misleading.

Observed targets and work at 2545×1440:

| Work | Actual dimensions / format |
| --- | --- |
| Composer input and allocated output | 2545×1440, RGBA half-float / RGBA16F; requested MSAA 8 |
| Hardware multisample allocation | **4 samples**, `MAX_SAMPLES=4`; RGBA16F color, DEPTH_COMPONENT24 depth |
| DOF CoC | 2545×1440 RGBA8 |
| DOF masked far | 2545×1440 RGBA16F |
| DOF intermediate / near / far | 1273×720 RGBA16F |
| DOF CoC blur + ping-pong | 1273×720 RGBA8 |
| Each bloom luminance/final target | **2545×1440 RGBA16F** |
| Each bloom blur ping-pong | 1273×720 RGBA16F |
| Reflection and blur targets | Four bound 512×512 RGBA8 targets; depth where enabled |

There are two composer passes (scene RenderPass and combined EffectPass), plus
reflection work. Instrumentation observed **35 renderer.render invocations** per
baseline frame, including scene draws and fullscreen stages; this is not 35 GL
draw calls. Named fullscreen stages include 19 Kawase draws (DOF 4, first bloom
5, second bloom 10), four Bokeh stages, two luminance stages, CoC, mask and final
effect composition. One MSAA framebuffer blit/resolve was observed per frame.
Inventories list bound targets; the newer harness also lists allocated targets,
including an output buffer that need not be bound in this particular pipeline.

Bloom resolutionScale affects the blur ping-pong, but the installed LuminancePass
resolution-copy path leaves its own scale at 1. Its shared luminance/final target
therefore remains full size. Lowering bloom scale is not equivalent to scaling
all bloom buffers. `mipmapBlur` is absent from the installed Bloom constructor;
passing the prop would silently fail to create the intended comparison.

## Controlled measurements

First series, GPU queries enabled; every row uses its own five adjacent baselines:

| Variant | Baseline mean / p95 (ms) | Candidate mean / p95 (ms) | Baseline / candidate GPU elapsed mean (ms) |
| --- | ---: | ---: | ---: |
| no-bloom-1 | 24.35 / 34.00 | 21.24 / 33.72 | 47.37 / 27.12 |
| no-bloom-2 | 18.72 / 24.08 | 17.14 / 20.74 | 33.38 / 15.27 |
| no-blooms | 16.66 / 17.54 | 16.66 / 17.56 | 30.31 / 11.04 |
| no-dof | 16.86 / 17.58 | 16.67 / 17.44 | 34.26 / 10.15 |
| no-mirror | 16.66 / 17.48 | 16.67 / 17.60 | 23.98 / 20.28 |
| no-dof-no-mirror | 16.68 / 17.58 | 16.67 / 17.62 | 28.34 / 12.52 |
| no-effects | 16.67 / 17.60 | 16.67 / 17.48 | 29.25 / 3.41 |
| msaa-4 | 20.97 / 27.28 | 20.95 / 24.12 | 46.05 / 44.94 |
| msaa-2 | 26.28 / 34.06 | 24.55 / 33.80 | 53.83 / 48.96 |
| msaa-0 | 26.17 / 34.04 | 21.85 / 33.46 | 52.77 / 43.74 |
| bloom-scale-0.25 | 26.40 / 34.20 | 24.36 / 33.86 | 51.42 / 49.30 |
| bloom-scale-0.375 | 26.38 / 34.16 | 25.25 / 34.10 | 52.24 / 50.02 |
| kernel-3 | 25.20 / 34.00 | 24.13 / 33.84 | 50.27 / 51.73 |
| kernel-4 | 25.35 / 34.12 | 23.61 / 34.00 | 51.55 / 49.25 |
| dof-height-360 | 25.33 / 34.10 | 25.81 / 34.18 | 51.34 / 52.85 |
| dof-height-720 | 25.86 / 34.12 | 25.49 / 34.10 | 53.01 / 52.69 |
| render-scale-0.75 | 24.59 / 33.96 | 17.79 / 23.82 | 50.63 / 38.30 |
| render-scale-0.833333 | 25.49 / 34.08 | 20.78 / 33.62 | 51.46 / 42.01 |
| smoothing-1 | 25.71 / 33.94 | 26.09 / 34.16 | 51.82 / 52.40 |

**Exclude the first series' `render-scale-*` rows from acceptance.** The first
harness also resized CSS canvas dimensions, so these were rejected experiments.
The corrected finalist series uses `composer.setSize(width,height,false)` and
full-viewport CSS upscaling. Rejected raw data is retained, not presented as a gain.

Finalists without queries, five paired trials, same frozen scene:

| Variant | Baseline mean / p95 (ms) | Candidate mean / p95 (ms) | Baseline / candidate GPU elapsed mean (ms) |
| --- | ---: | ---: | ---: |
| msaa-4 | 27.45 / 37.04 | 27.45 / 36.98 | n/a / n/a |
| bloom-luminance-half | 27.65 / 39.02 | 26.05 / 35.54 | n/a / n/a |
| render-scale-0.833333 | 28.91 / 40.06 | 22.16 / 32.92 | n/a / n/a |
| render-scale-0.75 | 27.12 / 37.38 | 20.12 / 29.06 | n/a / n/a |
| render-scale-0.666667 | 27.98 / 37.62 | 18.27 / 28.08 | n/a / n/a |

Both blooms and DOF have substantial elapsed-query cost in their independent
ablations. Removing both blooms or DOF separately reduces work; their deltas
must not be added, and unlike image-preserving optimization these ablations
change the design. Reflection updates are smaller in the tested scene; skipping
them does not establish that reflection is always cheap. `no-mirror` retains the
frozen reflection texture/surface while skipping its update; combined
`no-dof-no-mirror` tests interaction without changing the frozen reflected image.

Chrome presentation events, separate single ~3-second captures:

| Variant | Animation presentations | Full DroppedFrame events | Partial-update events | Presented-interval p95 |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 107 | 245 | 2 | 38.63 ms |
| MSAA 4 | 106 | 242 | 4 | 36.10 ms |
| Bloom luminance half | 116 | 234 | 0 | 33.97 ms |
| Render scale 5/6 | 128 | 219 | 0 | 32.38 ms |
| Render scale 3/4 | 142 | 203 | 0 | 26.51 ms |
| Render scale 2/3 | 159 | 194 | 0 | 25.54 ms |

These are deduplicated `AnimationFrame::Presentation` and Chrome `DroppedFrame`
events, with partial updates separated. Core Animation commits are also retained
in `presentation-summary.json`; they differ from animation presentation counts.
They describe Chrome's compositor, not physical display photometry. RAF `over25`
is never labeled as a dropped-frame counter.

## Image comparisons and rejected variants

Full-resolution before/after PNGs and amplified difference images are beside
raw samples. `pipeline-finalists-20261025/comparison.png` is a comparison sheet.
Default neon gradient, reflections and depth layers remain present in the
scaling candidates; thinner outlines, distant cones and blur edges soften after
upscaling. The CSS text/cursor remain sharp. Inspect at native resolution.

- MSAA 8→4: **zero changed framebuffer channels** across 14,659,200 channels,
  zero screenshot difference. Hardware already clamps to 4; no genuine speedup.
  Do not advertise this as an optimization or lower quality on other hardware.
- MSAA 2/0: reduced work but visible changes on object edges (screenshot maximum
  channel difference 91/109). Not enabled. No AA alternative is shipped without
  an independent visual/performance comparison; adding FXAA/SMAA is not free.
- Bloom scale .375/.25: broader/changed glow; screenshot MAE 0.82/1.98 RGB units,
  maximum difference 13/26. Cost reduction is modest and does not meet target.
- Kernel 3/4: changes glow extent/outline and distant-object halos; MAE 2.44/1.42,
  maximum 52/45. Rejected as default, even though fewer blur iterations can help.
- One bloom: first/second bloom removals change the narrow/broad glow balance;
  neither is a drop-in replacement for the pair. Different luminance functions,
  kernels and successive SCREEN blending prevent simply adding intensities.
- DOF height 720: identical to the existing half-height at 1440; no optimization.
  Height 360 changes depth blur visibly (maximum difference 125) and did not
  improve frame scheduling in the paired sample. Not enabled.
- Bloom luminance half: corrects the full-size target behavior experimentally.
  Framebuffer MAE 0.182 / max 9, screenshot MAE 0.238 / max 9; small but real
  changes near bright edges. Mean frame improvement 27.65→26.05 ms in its pair,
  still far from target. Kept as experiment; no internal-library mutation shipped.
- Full render scale 5/6, 3/4, 2/3: screenshot MAE 0.78/1.20/1.67. Changes include
  edge softness, glow sampling and DOF sampling, not just fewer pixels. Available
  as comparisons; pixel budget is explicitly opt-in, not automatically enabled.
- `luminanceSmoothing=10` and `2` are preserved. Installed code sets an unclamped
  float uniform used by `smoothstep(threshold,threshold+smoothing,luminance)`.
  It is a luminance transition width, **not** an iteration count; positive widths
  above 1 are accepted (HDR luminance is not restricted to normalized 0..1).
  There is no enforced [0,1] clamp in this version. Both set to 1 produce a major
  increase in neon brightness/thickness (MAE 18.96 / max 216), with no frame-time
  gain (25.71→26.09 ms). Rejected. Reducing intensity/increasing threshold is not
  used as evidence that GPU work became cheaper.

Pixel-index comparison is invalid across different framebuffer dimensions;
those first finalist metrics are explicitly marked rejected in `pixels.json`.
Use same-sized composited screenshots for scaled-render comparisons. For
cross-build physics scenes, restore **matrix and matrixAutoUpdate**, not only
position/quaternion/scale: Cannon writes matrices directly. The rejected
transform-only attempt is retained with its reason; corrected comparison uses
`upgrade-reference-20261025/scene.json`.

## Track B: dependencies

See [version matrix and migration boundaries](performance-stack.md), registry
metadata and the clean resolver artifacts. No dependency update is mixed into
quality timings. React/ReactDOM 17.0.2 and Three r138.3 already have the latest
matching patch; smaller Fiber 7.0.29, Drei 8.20.2 and Next 12.3.7 updates exist.
Latest same-major postprocessing/wrapper versions are **not** automatically
compatible with this React/Three generation.

The minimal compatibility candidate (wrapper 2.3.2 + postprocessing 6.26.3)
installs without override flags, passes a production build and removes the
nested Three peer conflict. A same-camera, matrix-restored scene comparison and
smoke timing are saved separately in `upgrade-20261025`. This is **not a
five-pair performance result** and does not establish an upgrade speedup, so it
is not applied to the project. Larger modern dependency resolution passes
`--strict-peer-deps` with the explicitly recorded compatible tooling versions;
source migration, visual acceptance and runtime verification remain separate work.
No routing or physics-engine migration was attempted.

## Reproduction commands

Prepare an isolated snapshot (the script refuses a nonempty destination or a
path inside the checkout), then build/start **there**:

```sh
node scripts/prepare-performance.cjs /tmp/portfolio-my-profile
cd /tmp/portfolio-my-profile
npm run build
npm run start -- -p 3115
```

The snapshot links existing node_modules; do not install/update packages through
that symlink. A dependency experiment needs its own real node_modules directory.
The script adds diagnostic composer/state refs only to the temporary copy.

From the checkout, with external Playwright and the hardware Chromium executable:

```sh
NODE_PATH=/tmp/portfolio-cursor-check/node_modules \
PERF_CHROMIUM='/Users/bartosz/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium' \
node scripts/profile-pipeline.cjs http://localhost:3115 /tmp/pipeline-results

# Separate serial series without query overhead, optionally capture traces:
NODE_PATH=/tmp/portfolio-cursor-check/node_modules \
PERF_CHROMIUM='/Users/bartosz/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium' \
PERF_GPU=0 PERF_TRACE=1 PERF_VARIANTS=msaa-4,render-scale-0.75 \
node scripts/profile-pipeline.cjs http://localhost:3115 /tmp/pipeline-finalists

node scripts/summarize-pipeline.cjs /tmp/pipeline-results
python3 scripts/compare-performance-images.py before.png after.png difference.png
```

Current harness defaults to five pairs; use `PERF_VARIANTS` for controlled
subsets. `PERF_SCENE=/absolute/path/scene.json` restores an exported scene across
builds, including physics matrices. Reject a hierarchy mismatch. PIL/Pillow is
external to project dependencies. Keep each baseline source/lockfile manifest
with results, and do not profile while compiling or running another browser.

To preview the opt-in pixel budget, create a fresh isolated snapshot and run:

```sh
NEXT_PUBLIC_SCENE_PIXEL_BUDGET=2073600 npm run build
npm run start -- -p 3118
```

It is a build-time public setting. Unset/0 keeps existing resolution. This is a
pixel-area cap, not a width breakpoint, so it handles different aspect ratios and
actual renderer DPR. DOM layout/camera coordinates remain CSS-sized. No runtime
FPS oscillation or repeated quality switching is introduced.

## Scaling enabled by user request

The default scene pixel budget is now **2,073,600 pixels** (approximately 1080p).
Large viewports automatically use a smaller renderer/composer buffer, upscaled to
unchanged CSS dimensions. Smaller buffers remain unchanged. Both blooms, DOF,
reflection settings and cursor rendering are retained. Explicitly set
`NEXT_PUBLIC_SCENE_PIXEL_BUDGET=0` to disable the cap; an existing production build
needs rebuilding to pick up this default. This supersedes the earlier opt-in
status above. Runtime visual/resize verification remains limited as described;
stable 60 Hz is not promised.

## Interaction allocation cleanup

Cone attraction now reuses three scratch vectors per physics subscription rather
than constructing three vectors per position update while grabbing. Force
calculations and thresholds are unchanged. This reduces allocation/GC pressure
on the main thread; it is not a measured GPU/FPS improvement. No tests, profiling
or builds were run for this change, following the user's instruction.

## Bloom resolution set to 100% by user request

Both Bloom effects now pass `resolutionScale: 1` to the installed constructor.
Their blur buffers match the current capped scene/composer resolution rather
than half its width and height. The global 2,073,600-pixel scene budget remains
active; this does not render bloom at the original display resolution. Intensity,
threshold, smoothing and kernels are unchanged. The old wrapper's declarations
omit this supported constructor option, so it is supplied through a shared prop
spread. This increases blur-buffer pixel work relative to the previous 0.5 scale;
it is a quality adjustment for reported artifacts, not a claimed FPS improvement.
No tests, browser automation or build were run, per the user's instruction.

## Single bloom enabled by user request

Removed the second Bloom (intensity 1, threshold 0.1, smoothing 2, kernel 5).
The first Bloom remains at intensity 15, threshold 0.005, smoothing 10 and
resolutionScale 1, with the global scene pixel budget unchanged. This removes
one luminance/blur chain and changes the broad glow contribution. No replacement
intensity compensation, tests, profiling or build were performed.

## Softer single bloom by user request

Set the remaining Bloom kernelSize to 5 (HUGE in the installed version), up from
the default LARGE (3), for wider/softer glow at the current scene resolution.
Intensity, luminance settings and resolution remain unchanged. No tests or build.

## Bloom input smoothing (2026-10-26)

`SmoothBloom` applies a one-pixel 3x3 tent prefilter before bloom luminance
extraction, using four bilinear reads in the existing luminance pass (previously
one). No additional render targets or fullscreen passes. Bloom intensity,
threshold, smoothing, kernel, resolution, MSAA and scene pixel budget are retained.
This reduces subpixel contour variation entering the nonlinear threshold; visual
improvement is subtle and does not eliminate every broad glow irregularity.

Compared original and filtered shaders on the same frozen frontend scene in
Chromium 140 / ANGLE Metal / M1 Pro at 1440x1000. No browser or shader errors.
Four alternating GPU query batches per variant (12 full composer renders each)
measured baseline 24.94/23.44/26.31/22.33 ms and filtered
22.71/25.32/23.90/23.85 ms. These noisy development-mode samples show no clear
regression, not a proven speedup or a universal performance guarantee.
A separate live resize check at browser DPR 2 verified source texel sizes at
1440x1000, 2560x1440 (scene capped to 1920x1080), 390x844 and back.
Temporary diagnostic composer exposure was removed. TypeScript passes; lint
passes with the existing CameraEffects hook-dependency warning.

## Depth precision verified and corrected (2026-10-26)

The user's z-fighting hypothesis is supported by a same-frame differential test:
raising the main camera near plane from 0.1 to 5 removes broken/dotted sections
of the monitor contours, including with both DOF and bloom contributions set to
zero. Thus those contour defects originate before postprocessing. DOF adds
visible blur/halos, but changing bloom alone cannot correct these defects.

The actual composer scene framebuffer has 24 depth bits on ANGLE Metal / M1 Pro.
At view depth 150, the estimated fixed-depth quantization step is 0.0134097 world
units for near=0.1/far=1000, versus 0.00026688 for near=5/far=1000 (~50x finer).
Changing far to 500 alone provides almost no precision benefit in this range,
and can clip scene content. Keep far=1000. Uniform scene scaling with matching
camera planes would not improve relative depth precision.

`Hero` now uses near=5. `PostEffects` retains the world-space DOF focus plane
160.084 and transition width 79.992, normalizing them against the camera's actual
planes. DOF bokeh scale/resolution and bloom intensity are unchanged by this fix.
Changing clipping planes introduces no new GPU work. Near=5 can clip geometry
closer than five units, relevant if manually orbiting the camera into a model;
the normal camera travel is much farther away.

Also fixed a lifecycle flaw in the initial `SmoothBloom`: the installed React
wrapper recreates BloomEffect on rerender; a mount-only layout effect failed to
configure replacement instances. A stable ref callback now configures every
instance. Live resize reproduces the old missing uniform and passes after the
fix (1440x1000 -> 2560x1440 -> 390x844 -> 1440x1000). This explains why initial
smoothing could disappear outside the original frozen-frame test.

Evidence: `performance-data/depth-precision-20261026/` contains same-frame before
and after screenshots with effects on and with both contributions off, plus
framebuffer/camera/mesh bounds measurements. Tests covered near=0.1/1/5/10 and
far=500/1000, preserving the DOF plane/range via the actual runtime shader
uniforms. Live scrolling through all five sections verified near/far=5/1000 and
unchanged world-space focus values; resize checks verified the filter uniform
against actual capped buffer dimensions. No browser errors. TypeScript passes;
lint has the existing CameraEffects hook-dependency warning. Temporary diagnostic
hooks were removed. This does not claim every remaining glow ripple is fixed.

## Remaining scalloped glow: DOF/bloom balance (2026-10-26)

The depth correction improves broken contours but does not remove the user's
reported scalloped halo. Earlier language overstated the visible overall fix.
Same-frame closeups reproduce that remaining halo with the corrected near plane.

Lowered DOF bokehScale 3 -> 1, retaining its focus distances and buffer resolution.
Bloom now uses intensity 45 (previously 15) and kernel LARGE/3 (previously HUGE/5).
This shifts halo generation toward a tighter bloom, reducing the conspicuous
DOF lobes. It intentionally changes glow shape: stronger, tighter bloom and
less defocus. It is not a claim of identical artwork or zero residual aliasing.
The bloom blur now uses 5 fullscreen draws instead of 10, without additional
buffers. A full-resolution DOF variant was also compared but not selected.

Closeups and full screenshots in `performance-data/glow-balance-20261026/` were
captured from a single frozen frontend frame, changing only bokeh scale, bloom
intensity and kernel. Chromium / ANGLE Metal / M1 Pro at 1440x1000; no shader or
page errors. Four alternating GPU query batches (10 complete composer renders
per batch) measured before 23.39/25.93/23.96/19.94 ms, after
20.10/21.20/18.89/23.15 ms. These noisy development samples suggest lower work,
not a guaranteed speedup. TypeScript passes; lint retains its existing warning.
