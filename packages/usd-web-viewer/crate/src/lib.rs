//! OpenUSD composition and mesh extraction for web viewers.
//!
//! The host fetches layers, hands them to a [`Loader`], fetches whatever the
//! loader reports missing, and finally composes and extracts a [`Scene`].

#![forbid(unsafe_code)]

use std::cell::RefCell;
use std::collections::{BTreeSet, HashSet};
use std::rc::Rc;

use openusd::{sdf, usd};

pub mod deps;
pub mod extract;
mod implicit;
pub mod material;
pub mod resolver;
#[cfg(target_arch = "wasm32")]
mod wasm;

pub use extract::Scene;
use resolver::{Files, MemoryResolver};

#[derive(Default)]
pub struct Loader {
    files: Files,
    /// Layers the host could not fetch; composition goes on without them.
    unavailable: HashSet<String>,
}

/// What [`Loader::compose`] produced: a planned scene (triangle data still to
/// read, see [`Scene::read_geometry`] and [`Scene::read_all`]), or the layers
/// it still needs.
pub enum Composed {
    Scene(Box<Scene>),
    Missing(Vec<String>),
}

impl Loader {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn has(&self, path: &str) -> bool {
        resolver::lock(&self.files).bytes.contains_key(path)
    }

    /// Stores a layer under its identifier and returns the layers it names
    /// outside unselected variants, so the host can prefetch them in parallel.
    pub fn add_layer(&mut self, path: &str, bytes: Vec<u8>) -> openusd::Result<Vec<String>> {
        if resolver::is_package(path, &bytes) {
            resolver::check_package(&bytes)?;
        }
        resolver::lock(&self.files)
            .bytes
            .insert(path.to_owned(), bytes);
        let read = || -> openusd::Result<Vec<String>> {
            let layer = sdf::Layer::open_with(self.resolver(false), path)?;
            let real_path = layer.resolved_path().unwrap_or(path).to_owned();
            Ok(deps::layer_dependencies(layer.data(), &real_path)?)
        };
        // A refused layer must not stay where composition would read it.
        let mut deps = read().inspect_err(|_| {
            resolver::lock(&self.files).bytes.remove(path);
        })?;
        // Files inside a package we hold need no fetching.
        let files = resolver::lock(&self.files);
        deps.retain(|d| {
            resolver::split_packaged(d)
                .is_none_or(|(package, _)| !files.bytes.contains_key(package))
        });
        // Arcs to formats nothing here reads (MaterialX) are not worth fetching.
        deps.retain(|d| resolver::is_layer_path(d));
        Ok(deps)
    }

    /// Records a layer the host failed to fetch, so `compose` stops asking.
    pub fn mark_unavailable(&mut self, path: &str) {
        self.unavailable.insert(path.to_owned());
    }

    /// Composes the stage rooted at `root`. When composition asks for layers
    /// that were never added, returns them instead so the host can fetch them
    /// and call again. The stage takes ownership of the layer bytes, so the
    /// returned list also names the layers this attempt consumed: the host
    /// adds those again too (normally from its HTTP cache). The scene draws
    /// at most `max_instances` mesh instances.
    pub fn compose(&self, root: &str, max_instances: usize) -> openusd::Result<Composed> {
        resolver::lock(&self.files).restart_budget();
        let resolver = self.resolver(true);
        let missing = resolver.missing.clone();
        let stage = usd::Stage::builder()
            .resolver(resolver)
            .schema_registry(openusd_schemas::schema_registry())
            .open(root)?;
        // Composition opens references and payloads lazily: walk the whole
        // stage first so every layer it needs is asked for before extracting.
        stage.traverse(usd::PrimPredicate::DEFAULT_PROXIES, |_| {})?;
        let mut missing: Vec<String> = missing
            .borrow()
            .iter()
            .filter(|m| !self.unavailable.contains(*m))
            .cloned()
            .collect();
        let taken = std::mem::take(&mut resolver::lock(&self.files).taken);
        if !missing.is_empty() {
            missing.extend(taken);
            return Ok(Composed::Missing(missing));
        }
        let mut scene = extract::plan(&stage, max_instances)?;
        let diagnostics = stage.composition_errors();
        for d in diagnostics.iter().take(5) {
            scene.warnings.push(extract::Warning {
                code: "composition",
                message: d.to_string(),
                path: None,
            });
        }
        if diagnostics.len() > 5 {
            let message = format!("{} more composition diagnostics", diagnostics.len() - 5);
            scene.warnings.push(extract::Warning {
                code: "composition",
                message,
                path: None,
            });
        }
        Ok(Composed::Scene(Box::new(scene)))
    }

    /// Moves out the USDZ packages `scene`'s textures live in, by package path,
    /// with the packages nested in them, so their images can still be read
    /// once the layers are dropped.
    pub fn take_texture_packages(&mut self, scene: &Scene) -> resolver::Store {
        let mut files = resolver::lock(&self.files);
        let mut packages = resolver::Store::default();
        for (_, texture) in scene.materials.iter().flat_map(|m| &m.maps) {
            if let Some((package, _)) = resolver::split_packaged(&texture.path)
                && let Some(bytes) = files.bytes.remove(package)
            {
                packages.bytes.insert(package.to_owned(), bytes);
            }
        }
        let nested = std::mem::take(&mut files.nested);
        packages.nested = nested
            .into_iter()
            .filter(|(path, _)| {
                resolver::split_packaged(path)
                    .is_some_and(|(package, _)| packages.bytes.contains_key(package))
            })
            .collect();
        packages.restart_budget();
        packages
    }

    /// Drops every stored layer.
    pub fn clear(&mut self) {
        let mut files = resolver::lock(&self.files);
        files.bytes.clear();
        files.nested.clear();
    }

    fn resolver(&self, take: bool) -> MemoryResolver {
        MemoryResolver {
            files: self.files.clone(),
            missing: Rc::new(RefCell::new(BTreeSet::new())),
            take,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Composed, Loader};

    #[test]
    fn unreadable_layers_are_left_out_of_composition() {
        let mut loader = Loader::new();
        let bad = b"#usda 1.0\ndef Xform \"A\" {\n".to_vec();
        loader.add_layer("/h/bad.usda", bad).unwrap_err();
        assert!(!loader.has("/h/bad.usda"));

        let root = b"#usda 1.0\n(\n    subLayers = [@./bad.usda@]\n)\ndef Xform \"Root\" {\n}\n";
        loader.add_layer("/h/root.usda", root.to_vec()).unwrap();
        loader.mark_unavailable("/h/bad.usda");
        let Composed::Scene(scene) = loader.compose("/h/root.usda", usize::MAX).unwrap() else {
            panic!("the unreadable layer is asked for again");
        };
        assert_eq!(scene.stats.prims, 1);
        let messages: Vec<_> = scene.warnings.iter().map(|w| &w.message).collect();
        assert!(
            !messages.iter().any(|m| m.contains("malformed")),
            "{messages:?}"
        );
    }
}

/// Helpers for serializing the scene's metadata to JSON.
pub(crate) mod ser {
    use serde::{Serialize, Serializer};

    /// Writes NaN and ±Infinity as 0: JSON has no such numbers.
    pub fn finite<T: Finite + Serialize, S: Serializer>(v: &T, s: S) -> Result<S::Ok, S::Error> {
        v.finite().serialize(s)
    }

    pub trait Finite {
        fn finite(&self) -> Self;
    }

    impl Finite for f32 {
        fn finite(&self) -> Self {
            if self.is_finite() { *self } else { 0.0 }
        }
    }

    impl Finite for f64 {
        fn finite(&self) -> Self {
            if self.is_finite() { *self } else { 0.0 }
        }
    }

    impl<T: Finite, const N: usize> Finite for [T; N] {
        fn finite(&self) -> Self {
            self.each_ref().map(T::finite)
        }
    }

    impl<T: Finite> Finite for Option<T> {
        fn finite(&self) -> Self {
            self.as_ref().map(T::finite)
        }
    }

    /// Name-value pairs as a JSON object.
    pub fn as_map<K: Serialize, V: Serialize, S: Serializer>(
        pairs: &[(K, V)],
        s: S,
    ) -> Result<S::Ok, S::Error> {
        s.collect_map(pairs.iter().map(|(k, v)| (k, v)))
    }

    #[cfg(test)]
    mod tests {
        use crate::material::Material;

        #[test]
        fn numbers_json_cannot_hold_are_written_as_zero() {
            let material = Material {
                path: "/M".to_owned(),
                kind: "preview",
                color: [f32::NAN, f32::INFINITY, 0.5],
                opacity: f32::NEG_INFINITY,
                roughness: 0.5,
                metallic: 0.0,
                emissive: [0.0; 3],
                opacity_threshold: 0.0,
                maps: Vec::new(),
                color_primvar: None,
            };
            let json: serde_json::Value = serde_json::to_value(&material).unwrap();
            assert_eq!(json["color"], serde_json::json!([0.0, 0.0, 0.5]));
            assert_eq!(json["opacity"], serde_json::json!(0.0));
        }
    }
}
