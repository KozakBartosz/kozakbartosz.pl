# Dependency investigation — 2026-10-25

Registry metadata is captured in `performance-data/registry-20261025.json`; exact
versions below are observations on this date, not evergreen installation advice.
No framework/router/physics-engine migration is bundled with quality tuning.

| Package | Lockfile / runtime baseline | Latest within existing major | Current stable |
| --- | --- | --- | --- |
| React / ReactDOM | 17.0.2 / 17.0.2 | 17.0.2 | 19.3.1 |
| Next | 12.1.0 | 12.3.7 | 16.4.3 |
| Three | 0.138.3 | 0.138.3 within r138 | 0.186.1 |
| Fiber | 7.0.26 | 7.0.29 | 9.8.2 |
| Drei | 8.18.5 | 8.20.2 | 10.7.9 |
| react-postprocessing | 2.2.5 | 2.19.1, **requires React 18 / Fiber 8** | 3.2.2 |
| postprocessing | root 6.25.0; **effects use nested 6.24.1** | 6.39.5, **requires Three >=0.168 <0.187** | 6.39.5 |
| react-three/cannon | 4.9.0 | 4.9.0 | 6.6.0 |

The baseline already contains a peer mismatch: nested postprocessing 6.24.1
requires Three `<0.138`, but Three is 0.138.3. Root postprocessing 6.25.0 accepts
it, but does not supply the effects used by the React wrapper. Check nested
lockfile entries, not just top-level package declarations.

## Compatible target sets

| Component | Minimal rendering compatibility experiment | Broader modernization target |
| --- | --- | --- |
| React / ReactDOM | 17.0.2 | 19.3.1 (matching pair) |
| Next | 12.1.0 unchanged during GPU experiment | 16.4.3, retain Pages Router |
| Three | 0.138.3 unchanged | 0.186.1 |
| Fiber | 7.0.26 unchanged | 9.8.2 |
| Drei | 8.18.5 unchanged | 10.7.9 |
| react-postprocessing | 2.3.2 | 3.2.2 |
| postprocessing | 6.26.3 (wrapper pins this version) | 6.39.5 |
| react-three/cannon | 4.9.0 unchanged | 6.6.0, retain Cannon engine |
| Node | current test host 24.20.0; old package engine floors are not support promises | >=20.11 for this dependency set; use supported Node 24 LTS |
| Tooling | unchanged | TypeScript 5.9.3, ESLint 9.39.5, eslint-config-next 16.4.3, @types/node 24.19.2; matching React/DOM/Three types; ESLint CLI |

The minimal set resolves the nested Three peer mismatch without changing React,
Three, physics or effect parameters. It is a compatibility candidate, not an
assumed speedup. The smaller wrapper patch 2.2.6 still pins 6.24.1 and does not
resolve that conflict. Fiber 7.0.29, Drei 8.20.2 and Next 12.3.7 are available
within current majors, but are separate experiments, not prerequisites for
measuring bloom. React 17 and Three r138 have no newer matching patch.

Do not install the latest 2.x wrapper on React 17 merely because its major is
unchanged. Later 2.x wrappers changed React/Fiber peer requirements. Likewise,
postprocessing 6.x is not universally compatible with every Three revision.

## Migration boundaries and official references

- [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide):
  first use React 18.3 to expose deprecations, then upgrade React 19 and its
  renderer together; account for JSX types and changed ref handling.
- [Fiber v9 guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide): React 19
  renderer, JSX type changes, StrictMode effects and color texture handling.
  Stable is v9; the v10 WebGPU documentation is not a reason to adopt a canary.
- [Next 16 guide](https://nextjs.org/docs/app/guides/upgrading/version-16): Node
  >=20.9, TypeScript >=5.1, Turbopack default, `next lint` removal. Existing Babel
  configuration needs deliberate review or an explicit webpack build. Retain
  Pages Router; routing migration is not needed to improve GPU throughput.
- [Three migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide):
  review every crossed revision, particularly r152 outputColorSpace/encoding,
  color management, lighting and tone mapping. Capture shader/neon/reflection
  comparisons before accepting a large jump.
- [Drei source and releases](https://github.com/pmndrs/drei): current `Reflector`
  is deprecated in the installed v8 source and removed by later releases; moving
  to `MeshReflectorMaterial` requires separately validating reflected camera,
  blur, depth thresholds and colors. No automatic material replacement.
- [react-postprocessing releases](https://github.com/pmndrs/react-postprocessing/releases):
  v3 changes lifecycle/props, React/Fiber peers, MSAA defaults and DPR resizing.
  Preserve explicit quality settings when comparing versions.
- [postprocessing releases](https://github.com/pmndrs/postprocessing/releases):
  inspect Bloom/DOF defaults and migration notes; installed 6.24.1 does **not**
  implement `mipmapBlur`, so passing that prop is not a valid experiment.
- [Cannon repository](https://github.com/pmndrs/use-cannon): package v6 still uses
  Cannon, with worker API changes and React >=18 / Fiber >=8 / Three >=0.139
  peers. There is no dedicated comprehensive migration guide located; inspect
  release changes and test body subscriptions, gravity, orientation and resume.

A newer Next cannot by itself reduce shader texture reads or render target
pixels. Modernization needs its own visual baseline, clean peer resolution and
interaction acceptance before merging with rendering quality experiments.

## Resolution verification

The broader set resolves with `npm install --package-lock-only --ignore-scripts
--strict-peer-deps` in `/tmp/portfolio-modern-matrix-20261025`. The exact proposed
manifest and resolver output are saved in `performance-data/modern-compatible-*`.
This verifies dependency resolution, not source/build/runtime compatibility.
Installing every tooling `latest` was rejected: ESLint 10.13.0 conflicts with
`eslint-plugin-import` supplied by eslint-config-next. ESLint 9.39.5 resolves
cleanly; TypeScript stays on 5.9.3 for a staged migration. No override flags used.
