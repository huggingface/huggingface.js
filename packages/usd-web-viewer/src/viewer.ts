import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { UsdLoadError } from "./errors.js";
import { loadUsd } from "./load.js";
import { SHOW } from "./show.js";
import type { InternalOptions } from "./show.js";
import type { SceneMeta } from "./meta.js";
import type { LoadOptions, LoadProgress, LoadResult, Viewer, ViewerOptions } from "./types.js";

/**
 * A ready-made viewer: renderer, studio lighting, orbit controls and
 * on-demand rendering around {@link loadUsd}. The canvas is transparent unless
 * a `background` is given. Throws a `webgl` UsdLoadError without WebGL.
 *
 * @param target  a canvas, or a container to append one to
 */
export function createViewer(target: HTMLElement | HTMLCanvasElement, options: ViewerOptions = {}): Viewer {
	const ownsCanvas = !(target instanceof HTMLCanvasElement);
	const canvas = ownsCanvas ? target.appendChild(document.createElement("canvas")) : (target as HTMLCanvasElement);
	const container = ownsCanvas ? target : canvas.parentElement;
	let renderer: THREE.WebGLRenderer;
	try {
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	} catch (error) {
		if (ownsCanvas) {
			canvas.remove();
		}
		throw new UsdLoadError("webgl", `WebGL is not available: ${(error as Error).message}`, { cause: error });
	}
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NeutralToneMapping;

	const scene = new THREE.Scene();
	scene.background = options.background == null ? null : new THREE.Color(options.background);
	// Rendered on the GPU, so rendered again after a lost context.
	const makeEnvironment = () => {
		const pmrem = new THREE.PMREMGenerator(renderer);
		scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		pmrem.dispose();
	};
	makeEnvironment();
	scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
	const sun = new THREE.DirectionalLight(0xffffff, 1.2);
	sun.position.set(3, 5, 4);
	scene.add(sun);

	const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
	camera.position.set(2, 1.5, 2);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	// Focusable, with arrow keys panning the camera and + / - zooming.
	canvas.tabIndex = 0;
	controls.listenToKeyEvents(canvas);
	const zoomKey = (event: KeyboardEvent) => {
		const scale = ({ "+": 0.8, "=": 0.8, "-": 1.25, _: 1.25 } as Record<string, number>)[event.key];
		if (!scale || !controls.enabled || !controls.enableZoom || event.ctrlKey || event.metaKey || event.altKey) {
			return;
		}
		event.preventDefault();
		camera.position.sub(controls.target).multiplyScalar(scale).add(controls.target);
		controls.update();
	};
	canvas.addEventListener("keydown", zoomKey);

	let frameRequested = false;
	let disposed = false;
	const render = () => {
		frameRequested = false;
		if (disposed) {
			return;
		}
		if (controls.update()) {
			requestRender();
		}
		renderer.render(scene, camera);
	};
	const requestRender = () => {
		if (frameRequested || disposed) {
			return;
		}
		frameRequested = true;
		requestAnimationFrame(render);
	};
	controls.addEventListener("change", requestRender);

	const resize = () => {
		const width = container?.clientWidth || canvas.clientWidth || 800;
		const height = container?.clientHeight || canvas.clientHeight || 600;
		renderer.setSize(width, height, ownsCanvas);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		requestRender();
	};
	const observer = new ResizeObserver(resize);
	observer.observe(container || canvas);
	resize();

	let current: LoadResult | null = null;
	// The load in flight; a newer load or dispose aborts it.
	let pending: AbortController | null = null;
	// The latest load's arguments, to load again after a lost context.
	let last: [string, LoadOptions] | null = null;
	const clear = () => {
		if (!current) {
			return;
		}
		scene.remove(current.root);
		current.dispose();
		current = null;
		requestRender();
	};
	// Geometry lives only on the GPU (its arrays are released once uploaded),
	// so a lost context loses the stage: it is loaded again once restored.
	const contextLost = (event: Event) => {
		event.preventDefault();
		pending?.abort();
		clear();
		options.onContextLost?.();
	};
	const contextRestored = () => {
		scene.environment?.dispose();
		makeEnvironment();
		const reload = last && viewer.load(...last);
		reload?.catch(() => {});
		options.onContextRestored?.(reload);
		requestRender();
	};
	canvas.addEventListener("webglcontextlost", contextLost);
	canvas.addEventListener("webglcontextrestored", contextRestored);

	const viewer: Viewer = {
		renderer,
		scene,
		camera,
		controls,
		requestRender,
		/** Loads a stage, replacing the current one once its geometry shows. A newer load aborts this one. */
		async load(url, loadOptions = {}) {
			if (disposed) {
				throw new UsdLoadError("aborted", "the viewer was disposed", { url });
			}
			// The caller's signal belongs to this load: a reload after a lost context must not inherit it once aborted.
			last = [url, { ...loadOptions, signal: undefined }];
			pending?.abort();
			const controller = (pending = new AbortController());
			const { signal: callerSignal } = loadOptions;
			if (callerSignal?.aborted) {
				controller.abort(callerSignal.reason);
			}
			const onCallerAbort = () => controller.abort(callerSignal?.reason);
			callerSignal?.addEventListener("abort", onCallerAbort, { once: true, signal: controller.signal });
			// Once this load is over, unless it was aborted (which removes it): a caller may pass one signal to many loads.
			const releaseCallerSignal = () => callerSignal?.removeEventListener("abort", onCallerAbort);
			// Meshes show as they stream in: the new stage replaces the old one as
			// soon as it is composed. It is framed then on its authored extents when
			// every mesh has them, else once complete (and again if a mesh in those
			// extents was left out): framing the meshes streamed so far would zoom
			// in on the first and jump out again.
			let streaming: THREE.Group | null = null;
			let planned = 0;
			const show = (root: THREE.Group, meta: SceneMeta) => {
				if (controller.signal.aborted) {
					return;
				}
				clear();
				streaming = root;
				scene.add(root);
				if (!meta.bounds) {
					return;
				}
				root.updateMatrixWorld();
				frameBox(camera, controls, new THREE.Box3().setFromArray(meta.bounds).applyMatrix4(root.matrixWorld));
				planned = meta.instances.length;
			};
			// Aborted (superseded, cleared or disposed): what streamed in goes at once.
			const hide = () => {
				if (streaming && streaming !== current?.root) {
					scene.remove(streaming);
				}
				requestRender();
			};
			controller.signal.addEventListener("abort", hide, { once: true });
			const onProgress = (progress: LoadProgress) => {
				if (progress.stage === "geometry" || progress.stage === "textures") {
					requestRender();
				}
				loadOptions.onProgress?.(progress);
			};
			try {
				const internal: InternalOptions = { ...loadOptions, signal: controller.signal, onProgress, [SHOW]: show };
				const result = await loadUsd(url, internal);
				// Superseded (or the viewer disposed) as geometry arrived: drop it.
				if (controller.signal.aborted || disposed) {
					result.dispose();
					throw new UsdLoadError("aborted", "superseded by a newer load", { url });
				}
				current = result;
				if (!streaming) {
					scene.add(result.root);
				}
				if (result.info.meshes < planned || !planned) {
					frame(camera, controls, result.root);
				}
				requestRender();
				result.complete.then(requestRender, () => {}).finally(releaseCallerSignal);
				return result;
			} catch (error) {
				releaseCallerSignal();
				hide();
				throw error;
			} finally {
				if (pending === controller) {
					pending = null;
				}
			}
		},
		/**
		 * An image of a freshly rendered frame, PNG by default, at the canvas size
		 * or `width` x `height` (one given keeps the aspect ratio). Rendered and
		 * read in the same task, so it needs no `preserveDrawingBuffer`.
		 */
		toBlob({ type = "image/png", quality, width, height } = {}) {
			if (disposed || renderer.getContext().isContextLost()) {
				return Promise.reject(new Error("no frame to capture: the viewer is disposed or its WebGL context is lost"));
			}
			const size = renderer.getSize(new THREE.Vector2());
			const ratio = renderer.getPixelRatio();
			const setSize = (w: number, h: number, pixelRatio: number) => {
				renderer.setPixelRatio(pixelRatio);
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
			};
			const resized = width || height;
			// One of the two is given: the other keeps the aspect ratio.
			if (resized) {
				setSize(
					width || Math.round(((height ?? 0) * size.x) / size.y),
					height || Math.round(((width ?? 0) * size.y) / size.x),
					1,
				);
			}
			renderer.render(scene, camera);
			const blob = new Promise<Blob>((resolve, reject) =>
				canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("the canvas could not be encoded"))), type, quality),
			);
			if (resized) {
				setSize(size.x, size.y, ratio);
				renderer.render(scene, camera);
			}
			return blob;
		},
		/** Removes and frees the current stage, and aborts any load in flight. */
		clear() {
			last = null;
			pending?.abort();
			clear();
		},
		/** Points the camera at `object`, by default the current stage. */
		frame(object = current?.root) {
			if (object) {
				frame(camera, controls, object);
			}
			requestRender();
		},
		/** Frees the renderer, the GPU context, the current stage and any load in flight. Safe to call twice. */
		dispose() {
			if (disposed) {
				return;
			}
			disposed = true;
			pending?.abort();
			if (current) {
				current.dispose();
			}
			current = null;
			observer.disconnect();
			canvas.removeEventListener("keydown", zoomKey);
			canvas.removeEventListener("webglcontextlost", contextLost);
			canvas.removeEventListener("webglcontextrestored", contextRestored);
			controls.dispose();
			scene.environment?.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			if (ownsCanvas) {
				canvas.remove();
			}
		},
	};
	return viewer;
}

/** Points the camera at the visible bounds of `object`. */
export function frame(
	camera: THREE.PerspectiveCamera,
	controls: OrbitControls | undefined,
	object: THREE.Object3D,
): void {
	frameBox(camera, controls, new THREE.Box3().setFromObject(object));
}

function frameBox(camera: THREE.PerspectiveCamera, controls: OrbitControls | undefined, box: THREE.Box3) {
	if (box.isEmpty()) {
		return;
	}
	if (controls) {
		// Spends the orbit and pan still easing out, which would otherwise carry on from the framed pose.
		const damping = controls.enableDamping;
		controls.enableDamping = false;
		controls.update();
		controls.enableDamping = damping;
	}
	const center = box.getCenter(new THREE.Vector3());
	const radius = box.getSize(new THREE.Vector3()).length() / 2 || 1;
	// `fov` is vertical: on a view narrower than it is tall, fit the horizontal angle.
	const vertical = (camera.fov * Math.PI) / 180;
	const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
	const distance = (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.05;
	camera.position.copy(center).addScaledVector(new THREE.Vector3(1, 0.6, 1).normalize(), distance);
	camera.lookAt(center);
	camera.near = distance / 100;
	camera.far = distance * 100;
	camera.updateProjectionMatrix();
	controls?.target.copy(center);
	controls?.update();
}
