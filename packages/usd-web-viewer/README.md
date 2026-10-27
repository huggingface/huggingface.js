# `@huggingface/usd-web-viewer`

[OpenUSD](https://openusd.org) in the browser: USD composition in WebAssembly, built on [openusd](https://github.com/mxpv/openusd) (pure Rust), rendered with [three.js](https://threejs.org). Reads `.usd`, `.usda`, `.usdc` and `.usdz`; loads run in a Web Worker.

```sh
npm install @huggingface/usd-web-viewer three
```

## Usage

A ready-made viewer (renderer, lighting, orbit controls):

```js
import { createViewer } from '@huggingface/usd-web-viewer';

const viewer = createViewer(document.getElementById('viewer')); // a container element
const { info } = await viewer.load(
  'https://huggingface.co/datasets/Robotiq-Official/simready-assets/resolve/main/Robotiq_2F_85/simready_usd/Robotiq_2F_85.usda',
);
```

Or into your own three.js scene:

```js
import { loadUsd } from '@huggingface/usd-web-viewer';

const { root, complete, dispose } = await loadUsd(url);
scene.add(root); // a THREE.Group, Y-up, in meters
await complete; // textures stream in after the geometry
```

## Physics and joints

`info` also reports what the stage authors for simulation (UsdPhysics) and its UsdSemantics labels, as authored: nothing is estimated. Masses are in kilograms, densities in kg/m³, inertia in kg·m², joint limits and positions in degrees or meters; positions and matrices are in stage space, like the meshes under `root`.

```js
const { info, pose, resetPose, getPose } = await viewer.load(url);

info.physics.bodies; // rigid bodies: mass, center of mass, inertia, colliders, bodies fixed to them
info.physics.colliders; // shape, approximation (convexHull, sdf, ...), physics material
info.physics.materials; // density, friction, restitution
info.physics.joints; // revolute, prismatic, spherical, distance, fixed and generic joints with their limits
info.labels; // e.g. { path: '/RootNode', taxonomy: 'wikidata_class', values: ['cabinet'] }
info.variantSelections; // e.g. { prim: '/Robotiq_2F_85', set: 'Physics', selection: 'Physx_parallel_grip' }
info.dependencies; // every layer and texture the stage read, with its size

pose('/Robotiq_2F_85/Robotiq_2F_85/Joints/finger_joint', 40); // revolute and prismatic joints; what hangs from it and mimic joints follow
getPose(); // where every revolute and prismatic joint is now
resetPose(); // back to the authored pose
```

Posing is kinematic only (no collisions or gravity) and cheap enough for every frame of a slider drag.

## Options

`loadUsd(url, options)` and `viewer.load(url, options)` take:

| Option                         | Default             |                                                                                 |
| ------------------------------ | ------------------- | ------------------------------------------------------------------------------- |
| `textures`                     | `'preview'`         | `'none'`, `'preview'` (base color, small data maps, no normal maps) or `'full'` |
| `maxTextureSize`               | `1024`              | Long side of decoded textures, in pixels                                        |
| `signal`                       |                     | An `AbortSignal`; the load rejects with a `UsdLoadError` of code `aborted`      |
| `onProgress`                   |                     | Called with the stage and an overall `fraction` from 0 to 1                     |
| `files`                        |                     | Load dropped or picked files instead of the network (see below)                 |
| `wasmUrl`, `workerUrl`         | next to the package | Where the WASM binary and the worker script are served from                     |
| `maxConcurrentFetches`         | `16`                | Requests in flight at once                                                      |
| `maxLayerBytes`, `maxLayers`   | 768 MiB, 1024       | Layer download limits                                                           |
| `maxTextureBytes`              | 512 MiB             | Texture download limit                                                          |
| `maxTriangles`, `maxInstances` | 20M, 100,000        | What is drawn at most                                                           |

`createViewer(container, options)` takes `background` (default transparent), `onContextLost` and `onContextRestored` (called with a reload of the last model shown).

Failures are `UsdLoadError`s with a `code` (`aborted`, `fetch`, `compose`, `worker`, `webgl`); anything that could not be shown faithfully is listed in `info.warnings`. Every option, error and warning is typed.

## Loading untrusted files

- Requests are sent like `<model-viewer>`'s: cookies only to the page's own origin (`credentials: 'same-origin'`), no custom headers, no referrer.
- Layers and textures are fetched over http(s) only.
- Parsing runs in Rust compiled to WebAssembly, in a Web Worker.
- Each load is capped: `maxLayerBytes` (768 MiB), `maxLayers` (1024), `maxTextureBytes` (512 MiB), `maxTriangles` (20M) and `maxInstances` (100,000); images up to 16384 px a side and 8192 x 8192 px in area; prims nested up to 256 levels deep; `.usdz` entries up to 512 MiB each and 1 GiB in all, stored uncompressed.
- Malformed files fail the load with a `UsdLoadError`.

## Local files

To show files dropped on the page or picked with `<input type="file" webkitdirectory>`, pass them as `files`, keyed by their path in the package, and load the root layer's key. Relative paths in the files resolve against each other; nothing is fetched for them.

```js
const files = new Map([...input.files].map((file) => [file.webkitRelativePath || file.name, file]));
await viewer.load('chair/simready_usd/sm_chair.usd', { files });
```

## Bundlers

The worker and the WASM binary are found with `new URL(..., import.meta.url)`, which Vite, webpack and other bundlers resolve and emit. With the Vite dev server, exclude the package from dependency pre-bundling:

```js
// vite.config.js
export default { optimizeDeps: { exclude: ['@huggingface/usd-web-viewer'] } };
```

MIT licensed. The licenses of the Rust crates compiled into the WASM binary are in `THIRD_PARTY_LICENSES`.
