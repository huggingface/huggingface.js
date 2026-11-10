//! The layers one layer names: what a loader prefetches before composing.

use std::collections::HashSet;
use std::io;

use openusd::sdf::{self, AbstractData, Value};

/// Deepest prim nesting a layer may author. Composing takes time that grows
/// steeply with depth (seconds at 1,000 levels), far beyond any real scene.
pub const MAX_PRIM_DEPTH: usize = 256;

/// Lists the sublayers, references and payloads `data` authors outside
/// variants it does not select, anchored to `anchor`. Fields are read
/// selectively by name so bulk arrays are never decoded; a field that fails
/// to decode is skipped rather than failing the walk (composition reports
/// real problems later). Fails on prims nested past [`MAX_PRIM_DEPTH`].
pub fn layer_dependencies(data: &dyn AbstractData, anchor: &str) -> io::Result<Vec<String>> {
    let mut out = Vec::new();
    let mut seen = HashSet::new();
    let mut push = |path: &str| {
        if let Some(path) = crate::resolver::anchor_path(path, Some(anchor))
            && seen.insert(path.clone())
        {
            out.push(path);
        }
    };

    for spec in data.spec_paths() {
        if spec.prim_element_count() > MAX_PRIM_DEPTH {
            return Err(io::Error::other(format!(
                "resource limit exceeded: prims nest more than {MAX_PRIM_DEPTH} levels deep"
            )));
        }
        // Only needed if a stronger layer selects that variant; composition
        // then asks for it.
        if !selected_here(data, spec.as_str()) {
            continue;
        }
        let field = |name: &str| data.try_field(&spec, name).ok().flatten();

        if let Some(value) = field("subLayers")
            && let Value::StringVec(paths) = &*value
        {
            for path in paths {
                push(path);
            }
        }
        if let Some(value) = field("references")
            && let Value::ReferenceListOp(op) = &*value
        {
            for item in live_items(op) {
                push(&item.asset_path);
            }
        }
        if let Some(value) = field("payload") {
            match &*value {
                Value::PayloadListOp(op) => {
                    for item in live_items(op) {
                        push(&item.asset_path);
                    }
                }
                Value::Payload(item) => push(&item.asset_path),
                _ => {}
            }
        }
    }
    Ok(out)
}

/// Whether every variant on the way to `spec` (`/A{set=sel}B{set2=sel2}`) is
/// the one the same layer selects. Stronger layers can still select another
/// variant; composition then reports what is missing.
fn selected_here(data: &dyn AbstractData, spec: &str) -> bool {
    let mut rest = spec;
    let mut prefix = String::new();
    while let Some(open) = rest.find('{') {
        let Some(close) = rest[open..].find('}').map(|c| open + c) else {
            return false;
        };
        prefix.push_str(&rest[..open]);
        let Some((set, choice)) = rest[open + 1..close].split_once('=') else {
            return false;
        };
        let Ok(owner) = sdf::Path::new(&prefix) else {
            return false;
        };
        let selection = match data
            .try_field(&owner, "variantSelection")
            .ok()
            .flatten()
            .as_deref()
        {
            Some(Value::VariantSelectionMap(map)) => map.get(set).cloned(),
            _ => None,
        };
        if selection.as_deref() != Some(choice) {
            return false;
        }
        prefix.push_str(&rest[open..=close]);
        rest = &rest[close + 1..];
    }
    true
}

/// Items a list op adds; deleted items add no opinion.
fn live_items<T: Default + Clone + PartialEq>(op: &sdf::ListOp<T>) -> impl Iterator<Item = &T> {
    op.explicit_items
        .iter()
        .chain(&op.prepended_items)
        .chain(&op.appended_items)
        .chain(&op.added_items)
}

#[cfg(test)]
mod tests {
    use crate::{Composed, Loader};

    /// A layer of prims nested `depth` deep.
    fn nested(depth: usize) -> Vec<u8> {
        let mut layer = "#usda 1.0\n".to_owned();
        layer += &"def Xform \"a\" {\n".repeat(depth);
        layer += &"}\n".repeat(depth);
        layer.into_bytes()
    }

    #[test]
    fn layers_nested_too_deeply_are_refused_before_composing() {
        let mut loader = Loader::new();
        loader
            .add_layer("/h/ok.usda", nested(super::MAX_PRIM_DEPTH))
            .expect("a layer at the depth limit loads");
        let error = loader
            .add_layer("/h/deep.usda", nested(super::MAX_PRIM_DEPTH + 1))
            .unwrap_err();
        assert!(
            error
                .to_string()
                .contains("prims nest more than 256 levels deep"),
            "{error}"
        );
        assert!(!loader.has("/h/deep.usda"));

        // Composition goes on without the refused layer.
        let root = b"#usda 1.0\n(\n    subLayers = [@./deep.usda@]\n)\n".to_vec();
        loader.add_layer("/h/root.usda", root).unwrap();
        loader.mark_unavailable("/h/deep.usda");
        let Composed::Scene(scene) = loader.compose("/h/root.usda", usize::MAX).unwrap() else {
            panic!("the refused layer is asked for again");
        };
        assert_eq!(scene.stats.prims, 0);
    }
}
