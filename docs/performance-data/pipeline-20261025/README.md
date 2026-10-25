# Pipeline experiment, 2026-10-25

Baseline source snapshot: `/tmp/portfolio-pipeline-20261025`, based on commit
`0b822c1`, before the gravity repair and concurrent presentation changes.
`source-manifest.json` hashes the actual instrumented source. This directory's
numbers must not be relabeled as results for later uncommitted visual changes.

- Production build; dedicated server port 3115; headed Chromium 140 / ANGLE Metal
  on Apple M1 Pro. One measurement browser, no software WebGL.
- Seeded initial rotations; warm-up 10 seconds; freeze all application RAF
  callbacks and worker stepping; retain one scene/camera for the whole series.
  Run only the original Reflector callback plus composer each measured frame.
- Each variant has five alternating baseline/candidate pairs, 600 ms warm-up
  per switch and 2 seconds of sampling. Timings retain individual intervals and
  query results. Baseline changes over time: compare adjacent pairs rather than
  treating the first baseline as the baseline for the entire session.
- GPU elapsed queries wrap reflection plus composer. They measure elapsed query
  intervals, including GPU scheduling effects; they are not isolated shader busy
  time. Their overhead is checked in a separate series without queries. Never
  add GPU times and CPU frame intervals together or derive FPS from query times.
- `over25` is an RAF interval count, not a presented/dropped frame count.
- `no-mirror` skips reflection updates while keeping the existing reflection
  texture/surface. In a frozen scene this isolates reflection rendering without
  also changing the postprocessing input. `no-dof-no-mirror` measures interaction.
- `no-bloom-1`, `no-bloom-2`, `no-blooms`, `no-dof`, `no-effects` remove the selected
  effects from the real EffectPass and recompile it. Intensity zero is not used
  as an ablation: effect update passes would still execute.
- Inventories record bound target dimensions, texture type/format and requested
  sample count, actual `renderbufferStorageMultisample` calls, framebuffer blits,
  renderer invocations and material names. Requested samples can exceed actual
  `MAX_SAMPLES=4`. Not every allocated target is necessarily bound in one frame.
- **Exclude `render-scale-*` timings/screenshots in this first series from visual
  acceptance:** the first harness called composer.setSize without updateStyle=false,
  also shrinking CSS canvas dimensions. Corrected fullscreen upscaling variants
  are rerun separately. This is retained as raw rejected experimental data.
- PNG screenshots are at deviceScaleFactor 2 (5120×2880); actual scene drawing
  buffer is 2545×1440. DOM and cursor remain separate from scene render scaling.

Reproduce with the scripts and commands in `docs/performance.md`. The instrumented
composer/state exports exist only in the temporary snapshot, never in production
source. The Playwright dependency and Chromium executable remain external to the
project. Do not run multiple profiling browsers or builds simultaneously.
