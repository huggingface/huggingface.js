//! Composes test stages through the same Loader the browser uses.

// Each test binary uses part of it.
#![allow(dead_code)]

use std::collections::BTreeSet;

use usd_wasm::{Composed, Loader, Scene};

/// A composed scene with its triangle data, and the layers that could not be
/// read (as the host would report them).
pub struct Loaded {
    pub scene: Scene,
    pub missing: BTreeSet<String>,
}

/// Composes `root` as the browser does, with `read` standing in for fetch:
/// every layer a layer names is read ahead, then whatever composition still
/// asks for, round after round.
pub fn compose(root: &str, read: impl Fn(&str) -> Option<Vec<u8>>) -> Result<Loaded, String> {
    let mut loader = Loader::new();
    let mut missing = BTreeSet::new();
    let mut queue = vec![root.to_owned()];
    for _ in 0..16 {
        while let Some(path) = queue.pop() {
            if loader.has(&path) {
                continue;
            }
            let Some(bytes) = read(&path) else {
                loader.mark_unavailable(&path);
                missing.insert(path);
                continue;
            };
            match loader.add_layer(&path, bytes) {
                Ok(deps) => queue.extend(deps),
                Err(e) if path == root => return Err(e.to_string()),
                Err(_) => {
                    loader.mark_unavailable(&path);
                    missing.insert(path);
                }
            }
        }
        match loader
            .compose(root, usize::MAX)
            .map_err(|e| e.to_string())?
        {
            Composed::Scene(scene) => {
                return Ok(Loaded {
                    scene: scene.read_all().map_err(|e| e.to_string())?,
                    missing,
                });
            }
            Composed::Missing(paths) => queue.extend(paths),
        }
    }
    Err("composition still missing layers after 16 rounds".to_owned())
}
