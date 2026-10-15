//! The JavaScript surface, used from a Web Worker.

use std::sync::Mutex;

use serde::Serialize;
use wasm_bindgen::prelude::*;

use crate::extract::{Geometry, Group, Instance, Read, Warning};
use crate::material::Material;
use crate::ser::finite;
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

/// What [`UsdScene::meta`] returns: everything but the triangle data.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SceneMeta<'a> {
    up_axis: &'a str,
    #[serde(serialize_with = "finite")]
    meters_per_unit: f64,
    /// World bounds, min then max, flattened.
    #[serde(skip_serializing_if = "Option::is_none", serialize_with = "finite")]
    bounds: Option<[f64; 6]>,
    warnings: &'a [Warning],
    geometry_count: usize,
    instances: &'a [Instance],
    materials: &'a [Material],
}

impl<'a> SceneMeta<'a> {
    fn new(scene: &'a Scene) -> Self {
        Self {
            up_axis: &scene.up_axis,
            meters_per_unit: scene.meters_per_unit,
            bounds: scene
                .bounds
                .map(|[a, b]| [a[0], a[1], a[2], b[0], b[1], b[2]]),
            warnings: &scene.warnings,
            geometry_count: scene.sources.len(),
            instances: &scene.instances,
            materials: &scene.materials,
        }
    }
}

/// What [`UsdScene::read`] returns for a geometry: everything but the bulk
/// arrays.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GeometryMeta<'a> {
    vertices: usize,
    max_index: u32,
    has_colors: bool,
    /// Local bounds, min then max, flattened.
    #[serde(serialize_with = "finite")]
    bounds: [f32; 6],
    uv_sets: Vec<&'a str>,
    groups: &'a [Group],
}

impl<'a> GeometryMeta<'a> {
    fn new(g: &'a Geometry) -> Self {
        let [a, b] = g.bounds;
        Self {
            vertices: g.positions.len() / 3,
            max_index: g.indices.iter().max().copied().unwrap_or(0),
            has_colors: !g.colors.is_empty(),
            bounds: [a[0], a[1], a[2], b[0], b[1], b[2]],
            uv_sets: g.uvs.iter().map(|(name, _)| name.as_str()).collect(),
            groups: &g.groups,
        }
    }
}

/// As JSON. Serializing these structs to a string cannot fail.
fn json(value: &impl Serialize) -> String {
    serde_json::to_string(value).expect("JSON serialization")
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
    current: Option<Geometry>,
    packages: resolver::Store,
}

#[wasm_bindgen]
impl UsdScene {
    /// Everything but the triangle data, as JSON.
    pub fn meta(&self) -> String {
        json(&SceneMeta::new(&self.scene))
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
                    let meta = json(&GeometryMeta::new(&geometry));
                    self.current = Some(geometry);
                    Some(meta)
                }
                Read::Nothing => None,
                Read::OverBudget { path, triangles } => Some(format!(
                    "{{\"overBudget\":{triangles},\"path\":{}}}",
                    json(&path)
                )),
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

    fn geometry(&mut self) -> Result<&mut Geometry, JsError> {
        self.current
            .as_mut()
            .ok_or_else(|| JsError::new("no geometry to read: call read() first"))
    }
}
