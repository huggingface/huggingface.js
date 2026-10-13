//! A tiny JSON writer for scene metadata (keeps serde out of the WASM binary).

use std::fmt::Write;

use crate::Scene;
use crate::extract::Geometry;
use crate::material::Texture;

pub fn scene_meta(scene: &Scene) -> String {
    let mut o = String::with_capacity(1024 + scene.instances.len() * 256);
    o.push('{');
    o.push_str("\"upAxis\":");
    string(&mut o, &scene.up_axis);
    let _ = write!(o, ",\"metersPerUnit\":{}", num(scene.meters_per_unit));
    if let Some([min, max]) = scene.bounds {
        let [a, b, c, d, e, f] = [min[0], min[1], min[2], max[0], max[1], max[2]].map(num);
        let _ = write!(o, ",\"bounds\":[{a},{b},{c},{d},{e},{f}]");
    }

    o.push_str(",\"warnings\":[");
    for (i, w) in scene.warnings.iter().enumerate() {
        if i > 0 {
            o.push(',');
        }
        o.push_str("{\"code\":");
        string(&mut o, w.code);
        o.push_str(",\"message\":");
        string(&mut o, &w.message);
        if let Some(path) = &w.path {
            o.push_str(",\"path\":");
            string(&mut o, path);
        }
        o.push('}');
    }
    o.push(']');
    let _ = write!(o, ",\"geometryCount\":{}", scene.sources.len());
    o.push_str(",\"instances\":[");
    for (i, inst) in scene.instances.iter().enumerate() {
        if i > 0 {
            o.push(',');
        }
        o.push_str("{\"path\":");
        string(&mut o, &inst.path);
        let _ = write!(
            o,
            ",\"geometry\":{},\"doubleSided\":{},\"matrix\":[",
            inst.geometry, inst.double_sided
        );
        for (j, v) in inst.matrix.iter().enumerate() {
            if j > 0 {
                o.push(',');
            }
            o.push_str(&num(*v));
        }
        let _ = write!(o, "],\"material\":{},\"subsets\":{{", inst.material);
        for (j, (name, m)) in inst.subsets.iter().enumerate() {
            if j > 0 {
                o.push(',');
            }
            string(&mut o, name);
            let _ = write!(o, ":{m}");
        }
        o.push_str("}}");
    }

    o.push_str("],\"materials\":[");
    for (i, m) in scene.materials.iter().enumerate() {
        if i > 0 {
            o.push(',');
        }
        o.push_str("{\"path\":");
        string(&mut o, &m.path);
        o.push_str(",\"kind\":");
        string(&mut o, m.kind);
        o.push_str(",\"color\":");
        floats(&mut o, &m.color);
        o.push_str(",\"emissive\":");
        floats(&mut o, &m.emissive);
        let _ = write!(
            o,
            ",\"opacity\":{},\"opacityThreshold\":{},\"roughness\":{},\"metallic\":{}",
            num(m.opacity.into()),
            num(m.opacity_threshold.into()),
            num(m.roughness.into()),
            num(m.metallic.into())
        );
        if let Some(name) = &m.color_primvar {
            o.push_str(",\"colorPrimvar\":");
            string(&mut o, name);
        }
        o.push_str(",\"maps\":{");
        for (j, (input, t)) in m.maps.iter().enumerate() {
            if j > 0 {
                o.push(',');
            }
            string(&mut o, input);
            o.push(':');
            texture(&mut o, t);
        }
        o.push_str("}}");
    }
    o.push_str("]}");
    o
}

/// One geometry's metadata (everything but the bulk arrays), as JSON.
pub fn geometry_meta(g: &Geometry) -> String {
    let mut o = String::with_capacity(256);
    let [[x0, y0, z0], [x1, y1, z1]] = g.bounds.map(|p| p.map(|v| num(v.into())));
    let _ = write!(
        o,
        "{{\"vertices\":{},\"maxIndex\":{},\"hasColors\":{},\"bounds\":[{x0},{y0},{z0},{x1},{y1},{z1}],\"uvSets\":[",
        g.positions.len() / 3,
        g.indices.iter().max().copied().unwrap_or(0),
        !g.colors.is_empty()
    );
    for (j, (name, _)) in g.uvs.iter().enumerate() {
        if j > 0 {
            o.push(',');
        }
        string(&mut o, name);
    }
    o.push_str("],\"groups\":[");
    for (j, group) in g.groups.iter().enumerate() {
        if j > 0 {
            o.push(',');
        }
        let _ = write!(o, "[{},{}", group.start, group.count);
        if let Some(subset) = &group.subset {
            o.push(',');
            string(&mut o, subset);
        }
        o.push(']');
    }
    o.push_str("]}");
    o
}

fn texture(o: &mut String, t: &Texture) {
    o.push_str("{\"path\":");
    string(o, &t.path);
    o.push_str(",\"channel\":");
    string(o, &t.channel);
    o.push_str(",\"scale\":");
    floats(o, &t.scale);
    o.push_str(",\"bias\":");
    floats(o, &t.bias);
    if let Some(value) = &t.value {
        o.push_str(",\"value\":");
        floats(o, value);
    }
    let tokens = [
        ("colorSpace", &t.color_space),
        ("uvSet", &t.uv_set),
        ("wrapS", &t.wrap[0]),
        ("wrapT", &t.wrap[1]),
    ];
    for (key, value) in tokens {
        if let Some(value) = value {
            let _ = write!(o, ",\"{key}\":");
            string(o, value);
        }
    }
    o.push_str(",\"uvScale\":");
    floats(o, &t.uv_scale);
    let _ = write!(
        o,
        ",\"uvRotation\":{},\"uvTranslation\":",
        num(t.uv_rotation.into())
    );
    floats(o, &t.uv_translation);
    o.push('}');
}

fn floats(o: &mut String, values: &[f32]) {
    o.push('[');
    for (i, v) in values.iter().enumerate() {
        if i > 0 {
            o.push(',');
        }
        o.push_str(&num((*v).into()));
    }
    o.push(']');
}

fn num(v: f64) -> String {
    if v.is_finite() {
        format!("{v}")
    } else {
        "0".to_owned()
    }
}

pub(crate) fn string(o: &mut String, s: &str) {
    o.push('"');
    for c in s.chars() {
        match c {
            '"' => o.push_str("\\\""),
            '\\' => o.push_str("\\\\"),
            c if (c as u32) < 0x20 => {
                let _ = write!(o, "\\u{:04x}", c as u32);
            }
            c => o.push(c),
        }
    }
    o.push('"');
}
