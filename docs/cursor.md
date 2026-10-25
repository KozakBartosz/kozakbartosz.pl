# GPU cursor

`Cursor.tsx` owns three transparent Three.js layers sharing shape uniforms. `cursorShader.ts`
contains the GLSL signed-distance shape: circle, a round-ended motion capsule, and a rounded
rectangle fitted to interactive elements. The original blue-to-green accent and
larger hero cursor are retained.

The fill shader applies pink (`#ff00a6`) at 70% opacity throughout the cursor,
including the resting circle, using `mix-blend-mode: hue`. This preserves backdrop luminosity and
saturation, so dark backgrounds remain dark instead of becoming white. Neutral
whites stay neutral. The hue remains visible while the shape morphs between
the normal circle/capsule and interactive-element outlines.
While a mouse button is held, a white `mix-blend-mode: difference` layer fades
in below the hue layer to invert colors, including outside interactive elements.
The hue layer remains visible and strengthens from 70% to 100% to recolor the
inverted reds to pink. Releasing restores the normal hue-only appearance.
A separate, normally composited layer draws a 1.5px outline at 90% opacity
with the exact `#00a3ff` to `#00ffa3` gradient. Keeping the outline outside
difference blending preserves its original colors over any background. The resting circle is 44px across (56px
in the hero); motion extends a line segment with fully rounded ends rather than
scaling a circle into an ellipse. The original native `/cursor.png` cursor
preserves pointing independently of the interpolated decoration. Its hotspot is
explicitly set to `(3, 3)`, the center of the visible 7px dot within the PNG's
34×43px transparent image, so the dot center matches the pointer coordinates. The original
link pointer styling is retained, with no global cursor override.

GLSL cannot sample the DOM directly. This implementation avoids DOM screenshots,
backdrop filters, and a second render of the page. It does not refract the page;
that would require providing its content as a GPU texture.

## Rendering and lifecycle

- Pointer events update coordinates without React state or per-frame DOM styling.
- Time-based interpolation keeps movement consistent across display refresh rates.
- Capsule rotation is bounded modulo PI. Link hover eases toward zero rotation;
  morph progress never multiplies an accumulated angle.
- Links, buttons, form controls, and `[data-cursor="link"]` morph into a box matching the element bounds.
- Scrolling refreshes the hovered element; box bounds are read during interpolation.
- Three draw calls render press inversion, hover hue, and outline. Scissoring limits fragment work to their region;
  device pixel ratio is capped at 1.5. The transparent surfaces still span the viewport.
- The animation loop sleeps after interpolation settles, and resumes on input.
- Touch input hides the decoration. Reduced motion and devices without a fine,
  hovering pointer use the normal cursor. Preference changes are handled live.
- Leaving the window, blurring, and hiding the tab dismiss the decoration.
- WebGL failure/context loss preserves the native cursor. Unmounting releases
  listeners, animation frames, material, geometry, and all renderers' resources.

## Verification limits

A headless Chromium harness can instrument the cursor's WebGL draw calls and DOM
mutations, exercise pointer input, activate links, and toggle reduced motion.
Software WebGL is useful for correctness but is not a representative FPS benchmark
for the complete animated portfolio. Measure frame time on real GPU hardware
before claiming a particular performance improvement.

Validation performed: TypeScript, lint, and an isolated production build passed.
Existing warnings remain in CameraEffects/Cone hooks, Browserslist data, and the
cannon optional `worker_threads` resolution. Chromium checks passed for nonzero
cursor drawing, no cursor DOM mutations during movement, unchanged draw counts
after settling, link activation/scrolling, live reduced-motion disable/enable,
touch dismissal, and native-cursor fallback on a simulated context-loss event.
The cursor checks suppressed unrelated scene draw calls to isolate its lifecycle;
there were no browser console or page errors in that run.

Refinement validation: a Chromium fixture exercised repeated circular movement
before link hover. Shader rotation stayed bounded, the link settled at zero
rotation, the box morph completed, and rendering returned to sleep. The computed
native cursor used `cursor-dot.svg` at that stage (subsequently restored to the
original `/cursor.png` at the user's request). TypeScript, lint, and the production build
passed again with the same pre-existing warnings.

## Coordinate alignment

A canvas can change CSS size when scrollbars or surrounding layout change without
receiving a window resize event. `ResizeObserver` now keeps all drawing buffers
and the shader resolution synchronized with the actual canvas bounds. Pointer
and link coordinates are converted from viewport space to canvas-local space.
Shader UVs map directly into CSS pixels, avoiding drawing-buffer rounding drift
at fractional device pixel ratios.

A Chromium regression harness first reproduced a stale 1001px shader resolution
on a 941px-wide canvas. After the fix, circle centers, link centers, and link
widths matched within 0.1 CSS pixels after settling at device scale factors 1,
1.25, and 2, including an offset canvas and a CSS-only size change.
