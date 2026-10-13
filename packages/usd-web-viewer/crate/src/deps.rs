//! The layers one layer names: what a loader prefetches before composing.

use std::collections::HashSet;

use openusd::sdf::{self, AbstractData, Value};

/// Lists the sublayers, references and payloads `data` authors outside
/// variants it does not select, anchored to `anchor`. Fields are read
/// selectively by name so bulk arrays are never decoded; a field that fails
/// to decode is skipped rather than failing the walk (composition reports
/// real problems later).
pub fn layer_dependencies(data: &dyn AbstractData, anchor: &str) -> Vec<String> {
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
    out
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
