//! The fixture corpus: every `fixtures/*.usda` file is composed as the
//! browser composes it, and a normalised summary of what a viewer would draw
//! is compared with its snapshot in `snapshots/`. Review changes with
//! `cargo insta review`. The binary fixtures are exports of `.usda` ones
//! (`scripts/binary-fixtures.py`), so each must draw the same as its source.

mod common;

use std::fmt::Write;

use usd_wasm::Scene;
use usd_wasm::extract::Geometry;
use usd_wasm::material::{Material, Texture};

#[test]
fn fixtures() {
    let dir = fixtures_dir();
    insta::glob!("../../fixtures", "*.usda", |path| {
        let out = composed(&path.to_string_lossy());
        insta::assert_snapshot!(out.replace(&dir, ""));
    });
}

#[test]
fn binary_fixtures_match_their_usda_source() {
    let dir = fixtures_dir();
    let draw = |name: &str| composed(&format!("{dir}{name}")).replace(&dir, "");

    assert_eq!(draw("implicit_gprims.usdc"), draw("implicit_gprims.usda"));

    // The package holds the texture itself, so the one thing that differs is
    // the texture path: inside the package rather than beside the layer.
    assert_eq!(
        draw("uv_set.usdz").replace("uv_set.usdz[0/quadrants.png]", "quadrants.png"),
        draw("uv_set.usda")
    );
}

/// The fixtures directory, with a trailing slash, to strip from summaries.
fn fixtures_dir() -> String {
    let dir = std::fs::canonicalize(concat!(env!("CARGO_MANIFEST_DIR"), "/../fixtures"))
        .expect("fixtures directory");
    format!("{}/", dir.display())
}

/// The summary of `root` composed as the browser composes it, with the layers
/// that could not be read.
fn composed(root: &str) -> String {
    let loaded =
        common::compose(root, |p| std::fs::read(p).ok()).unwrap_or_else(|e| panic!("{root}: {e}"));
    let mut out = summary(&loaded.scene);
    for path in &loaded.missing {
        writeln!(out, "missing layer: {path}").unwrap();
    }
    out
}

/// What a viewer draws, in a stable, readable form: numbers rounded to 1e-3.
fn summary(s: &Scene) -> String {
    let mut o = String::new();
    let st = &s.stats;
    writeln!(
        o,
        "upAxis {}, metersPerUnit {}",
        s.up_axis,
        num(s.meters_per_unit)
    )
    .unwrap();
    writeln!(
        o,
        "prims {}, meshes {}, triangles {}",
        st.prims, st.meshes, st.triangles
    )
    .unwrap();
    if st.skipped_invisible + st.skipped_purpose + st.skipped_empty > 0 {
        writeln!(
            o,
            "skipped invisible {}, purpose {}, empty {}",
            st.skipped_invisible, st.skipped_purpose, st.skipped_empty
        )
        .unwrap();
    }

    writeln!(o, "\ninstances:").unwrap();
    for i in &s.instances {
        let g = &s.geometries[i.geometry as usize];
        let materials: Vec<u32> = g.groups.iter().map(|group| i.material_for(group)).collect();
        let materials = match materials.as_slice() {
            [m] => format!("material {m}"),
            _ => format!("materials {materials:?}"),
        };
        let sided = if i.double_sided { " double-sided" } else { "" };
        let m = i.matrix;
        let [lo, hi] = world_bounds(&g.bounds, &m);
        writeln!(
            o,
            "  {}: geometry {}, {materials}{sided}",
            i.path, i.geometry
        )
        .unwrap();
        writeln!(
            o,
            "    at {}, world {}..{}",
            vec(&m[12..15]),
            vec(&lo),
            vec(&hi)
        )
        .unwrap();
    }

    writeln!(o, "\ngeometries:").unwrap();
    for (k, g) in s.geometries.iter().enumerate() {
        geometry(&mut o, k, g);
    }

    writeln!(o, "\nmaterials:").unwrap();
    for (k, m) in s.materials.iter().enumerate() {
        material(&mut o, k, m);
    }

    if !s.warnings.is_empty() {
        writeln!(o, "\nwarnings:").unwrap();
    }
    for w in &s.warnings {
        let path = w
            .path
            .as_deref()
            .map(|p| format!(" ({p})"))
            .unwrap_or_default();
        writeln!(o, "  {}: {}{path}", w.code, w.message).unwrap();
    }
    o
}

fn geometry(o: &mut String, k: usize, g: &Geometry) {
    let vertices = g.positions.len() / 3;
    // What every geometry must hold, whatever the file.
    assert_eq!(
        g.normals.len(),
        g.positions.len(),
        "{}: a normal per vertex",
        g.source
    );
    assert!(
        g.uvs.iter().all(|(_, uv)| uv.len() == vertices * 2),
        "{}: a UV per vertex",
        g.source
    );
    assert!(
        g.colors.is_empty() || g.colors.len() == vertices * 3,
        "{}: no color or one per vertex",
        g.source
    );
    assert!(
        g.indices.iter().all(|&i| (i as usize) < vertices),
        "{}: indices in range",
        g.source
    );
    let mut next = 0;
    for group in &g.groups {
        assert_eq!(group.start, next, "{}: groups are contiguous", g.source);
        next += group.count;
    }
    assert_eq!(
        next as usize,
        g.indices.len(),
        "{}: groups cover every index",
        g.source
    );

    let triangles = g.indices.len() / 3;
    let inward = g
        .indices
        .chunks_exact(3)
        .filter(|t| faces_away(g, t))
        .count();
    let winding = if inward == 0 {
        "all outward".to_owned()
    } else {
        format!("{inward} facing inward")
    };
    let [lo, hi] = g.bounds;
    writeln!(
        o,
        "  {k} {}: {triangles} triangles ({winding}), {vertices} vertices, bounds {}..{}",
        g.source,
        vec(&lo),
        vec(&hi)
    )
    .unwrap();
    writeln!(o, "    normals {}", values(&g.normals, 3)).unwrap();
    for (name, uv) in &g.uvs {
        writeln!(o, "    uv {name} {}", values(uv, 2)).unwrap();
    }
    if !g.colors.is_empty() {
        writeln!(o, "    colors {}", values(&g.colors, 3)).unwrap();
    }
    if g.groups.len() > 1 || g.groups.iter().any(|group| group.subset.is_some()) {
        let groups: Vec<String> = g
            .groups
            .iter()
            .map(|group| {
                format!(
                    "{}+{}{}",
                    group.start,
                    group.count,
                    group
                        .subset
                        .as_deref()
                        .map(|s| format!(" {s}"))
                        .unwrap_or_default()
                )
            })
            .collect();
        writeln!(o, "    groups {}", groups.join(", ")).unwrap();
    }
}

/// Whether a triangle winds clockwise seen from where its normals point.
fn faces_away(g: &Geometry, t: &[u32]) -> bool {
    let p = |i: u32| [0, 1, 2].map(|k| g.positions[i as usize * 3 + k]);
    let n = |i: u32| [0, 1, 2].map(|k| g.normals[i as usize * 3 + k]);
    let (a, b, c) = (p(t[0]), p(t[1]), p(t[2]));
    let (u, v) = (
        [0, 1, 2].map(|k| b[k] - a[k]),
        [0, 1, 2].map(|k| c[k] - a[k]),
    );
    let face = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
    ];
    let normal = [0, 1, 2].map(|k| n(t[0])[k] + n(t[1])[k] + n(t[2])[k]);
    (0..3).map(|k| face[k] * normal[k]).sum::<f32>() < 0.0
}

fn material(o: &mut String, k: usize, m: &Material) {
    let path = if m.path.is_empty() {
        "(unbound)"
    } else {
        &m.path
    };
    write!(
        o,
        "  {k} {path} {}: color {}, opacity {}, roughness {}, metallic {}",
        m.kind,
        vec(&m.color),
        num(m.opacity),
        num(m.roughness),
        num(m.metallic)
    )
    .unwrap();
    if m.emissive != [0.0; 3] {
        write!(o, ", emissive {}", vec(&m.emissive)).unwrap();
    }
    if m.opacity_threshold != 0.0 {
        write!(o, ", opacityThreshold {}", num(m.opacity_threshold)).unwrap();
    }
    if let Some(name) = &m.color_primvar {
        write!(o, ", color from primvar {name}").unwrap();
    }
    writeln!(o).unwrap();
    for (input, t) in &m.maps {
        texture(o, input, t);
    }
}

fn texture(o: &mut String, input: &str, t: &Texture) {
    write!(o, "    {input} <- {}.{}", t.path, t.channel).unwrap();
    if let Some(value) = &t.value {
        write!(o, ", value {}", vec(value)).unwrap();
    }
    if t.scale != [1.0; 4] || t.bias != [0.0; 4] {
        write!(o, ", scale {}, bias {}", vec(&t.scale), vec(&t.bias)).unwrap();
    }
    for (key, value) in [
        ("uv", &t.uv_set),
        ("colorSpace", &t.color_space),
        ("wrapS", &t.wrap[0]),
        ("wrapT", &t.wrap[1]),
    ] {
        if let Some(value) = value {
            write!(o, ", {key} {value}").unwrap();
        }
    }
    if t.uv_scale != [1.0; 2] || t.uv_rotation != 0.0 || t.uv_translation != [0.0; 2] {
        write!(
            o,
            ", uv scale {} rotation {} translation {}",
            vec(&t.uv_scale),
            num(t.uv_rotation),
            vec(&t.uv_translation)
        )
        .unwrap();
    }
    writeln!(o).unwrap();
}

/// The distinct values of a per-vertex attribute, in order of first use, with
/// how many vertices share each; past six, only that there are more.
fn values(data: &[f32], width: usize) -> String {
    let mut distinct: Vec<(String, usize)> = Vec::new();
    for value in data.chunks_exact(width) {
        let value = vec(value);
        if let Some((_, n)) = distinct.iter_mut().find(|(v, _)| *v == value) {
            *n += 1;
        } else if distinct.len() == 6 {
            return "of more than 6 distinct values".to_owned();
        } else {
            distinct.push((value, 1));
        }
    }
    let shown: Vec<String> = distinct
        .into_iter()
        .map(|(v, n)| if n > 1 { format!("{v} x{n}") } else { v })
        .collect();
    shown.join(", ")
}

/// The world-space box around a local box drawn with row-major, row-vector `m`.
fn world_bounds(bounds: &[[f32; 3]; 2], m: &[f64; 16]) -> [[f64; 3]; 2] {
    let mut out = [[f64::INFINITY; 3], [f64::NEG_INFINITY; 3]];
    for corner in 0..8 {
        let p = [0, 1, 2].map(|k| bounds[(corner >> k) & 1][k] as f64);
        for k in 0..3 {
            let v = p[0] * m[k] + p[1] * m[4 + k] + p[2] * m[8 + k] + m[12 + k];
            out[0][k] = out[0][k].min(v);
            out[1][k] = out[1][k].max(v);
        }
    }
    out
}

fn vec<T: Copy + Into<f64>>(values: &[T]) -> String {
    let parts: Vec<String> = values.iter().map(|&v| num(v)).collect();
    format!("({})", parts.join(", "))
}

fn num(v: impl Into<f64>) -> String {
    let v = (v.into() * 1000.0).round() / 1000.0;
    // -0 prints as 0.
    format!("{}", v + 0.0)
}
