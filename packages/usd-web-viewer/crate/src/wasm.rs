//! The JavaScript surface, used from a Web Worker.

use std::sync::Mutex;

use wasm_bindgen::prelude::*;

use crate::extract::Read;
use crate::{Composed, Loader, Scene, resolver};

/// The message of the last panic. With `panic = "abort"` a panic traps as a
/// bare `unreachable`; the page reads this to say why.
static LAST_PANIC: Mutex<Option<String>> = Mutex::new(None);

#[wasm_bindgen(start)]
fn start() {
    std::panic::set_hook(Box::new(|info| {
        if let Ok(mut last) = LAST_PANIC.lock() {
            *last = Some(info.to_string());
        }
    }));
}

/// Takes the message of the last panic, if any.
#[wasm_bindgen(js_name = lastPanic)]
pub fn last_panic() -> Option<String> {
    LAST_PANIC.lock().ok()?.take()
}

/// The error with its causes: "failed to decode field ..." alone does not say
/// that reading it ran out of memory.
fn js_error(e: impl std::error::Error) -> JsError {
    let mut message = e.to_string();
    let mut source = e.source();
    while let Some(cause) = source {
        message = format!("{message}: {cause}");
        source = cause.source();
    }
    JsError::new(&message)
}

#[wasm_bindgen]
#[derive(Default)]
pub struct UsdLoader {
    inner: Loader,
    scene: Option<Scene>,
}

#[wasm_bindgen]
impl UsdLoader {
    #[wasm_bindgen(constructor)]
    pub fn new() -> UsdLoader {
        UsdLoader::default()
    }

    pub fn has(&self, path: &str) -> bool {
        self.inner.has(path)
    }

    /// Stores a layer and returns the layers it names outside unselected
    /// variants (see [`Loader::add_layer`]).
    #[wasm_bindgen(js_name = addLayer)]
    pub fn add_layer(&mut self, path: &str, bytes: Vec<u8>) -> Result<Vec<String>, JsError> {
        self.inner.add_layer(path, bytes).map_err(js_error)
    }

    #[wasm_bindgen(js_name = markUnavailable)]
    pub fn mark_unavailable(&mut self, path: &str) {
        self.inner.mark_unavailable(path);
    }

    /// Composes the stage at `root`. Returns the layers still missing; when
    /// that is empty the scene is ready for [`take_scene`](Self::take_scene).
    /// The scene draws at most `max_instances` mesh instances.
    pub fn compose(&mut self, root: &str, max_instances: usize) -> Result<Vec<String>, JsError> {
        match self.inner.compose(root, max_instances).map_err(js_error)? {
            Composed::Missing(missing) => Ok(missing),
            Composed::Scene(scene) => {
                self.scene = Some(*scene);
                Ok(Vec::new())
            }
        }
    }

    /// Hands over the extracted scene and drops every stored layer.
    #[wasm_bindgen(js_name = takeScene)]
    pub fn take_scene(&mut self) -> Result<UsdScene, JsError> {
        let scene = self
            .scene
            .take()
            .ok_or_else(|| JsError::new("compose has not produced a scene"))?;
        // Textures inside a USDZ cannot be fetched by URL: keep their packages,
        // to read only the images the texture mode loads, each once.
        let packages = self.inner.take_texture_packages(&scene);
        self.inner.clear();
        Ok(UsdScene {
            scene,
            current: None,
            packages,
        })
    }
}

/// A composed scene whose meshes are read one at a time: `read(i)` makes
/// geometry `i` current, and the array getters move its data out (each once).
/// Only the current mesh's arrays live in WASM memory at any time.
#[wasm_bindgen]
pub struct UsdScene {
    scene: Scene,
    current: Option<crate::extract::Geometry>,
    packages: resolver::Store,
}

#[wasm_bindgen]
impl UsdScene {
    /// Everything but the triangle data, as JSON.
    pub fn meta(&self) -> String {
        crate::json::scene_meta(&self.scene)
    }

    /// Reads geometry `index` and returns its metadata as JSON, or `None` when
    /// the mesh has nothing drawable. A mesh with more than `max_triangles` is
    /// left unread: `{"overBudget": triangles, "path": prim path}`.
    pub fn read(&mut self, index: usize, max_triangles: usize) -> Result<Option<String>, JsError> {
        self.current = None;
        Ok(
            match self
                .scene
                .read_geometry(index, max_triangles)
                .map_err(js_error)?
            {
                Read::Geometry(geometry) => {
                    let json = crate::json::geometry_meta(&geometry);
                    self.current = Some(geometry);
                    Some(json)
                }
                Read::Nothing => None,
                Read::OverBudget { path, triangles } => {
                    let mut json = format!("{{\"overBudget\":{triangles},\"path\":");
                    crate::json::string(&mut json, &path);
                    json.push('}');
                    Some(json)
                }
            },
        )
    }

    /// Releases the stage once every geometry has been read.
    pub fn finish(&mut self) {
        self.current = None;
        self.scene.sources.clear();
    }

    pub fn positions(&mut self) -> Result<Vec<f32>, JsError> {
        Ok(std::mem::take(&mut self.geometry()?.positions))
    }

    pub fn normals(&mut self) -> Result<Vec<f32>, JsError> {
        Ok(std::mem::take(&mut self.geometry()?.normals))
    }

    /// UV set `set` (in the order of the geometry's `uvSets`).
    pub fn uvs(&mut self, set: usize) -> Result<Vec<f32>, JsError> {
        let geometry = self.geometry()?;
        let count = geometry.uvs.len();
        let (_, uvs) = geometry
            .uvs
            .get_mut(set)
            .ok_or_else(|| JsError::new(&format!("no UV set {set}: the geometry has {count}")))?;
        Ok(std::mem::take(uvs))
    }

    pub fn colors(&mut self) -> Result<Vec<f32>, JsError> {
        Ok(std::mem::take(&mut self.geometry()?.colors))
    }

    pub fn indices(&mut self) -> Result<Vec<u32>, JsError> {
        Ok(std::mem::take(&mut self.geometry()?.indices))
    }

    /// Indices as 16-bit, for geometries with fewer than 65536 vertices.
    /// On failure the indices stay in place for [`indices`](Self::indices).
    pub fn indices16(&mut self) -> Result<Vec<u16>, JsError> {
        let geometry = self.geometry()?;
        let indices = geometry
            .indices
            .iter()
            .map(|&i| u16::try_from(i))
            .collect::<Result<_, _>>()
            .map_err(|_| {
                JsError::new(
                    "an index does not fit in 16 bits: use indices() for 65536 vertices or more",
                )
            })?;
        geometry.indices = Vec::new();
        Ok(indices)
    }

    /// A texture that lives inside a USDZ package, if `path` names one there.
    /// Fails rather than expand it past `limit` bytes.
    #[wasm_bindgen(js_name = packagedFile)]
    pub fn packaged_file(&mut self, path: &str, limit: f64) -> Result<Option<Vec<u8>>, JsError> {
        if resolver::split_packaged(path).is_none() {
            return Ok(None);
        }
        // A package not held reads as not found.
        match self.packages.read_packaged_within(path, limit as u64) {
            Ok(file) => Ok(Some(file)),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(js_error(e)),
        }
    }

    fn geometry(&mut self) -> Result<&mut crate::extract::Geometry, JsError> {
        self.current
            .as_mut()
            .ok_or_else(|| JsError::new("no geometry to read: call read() first"))
    }
}
