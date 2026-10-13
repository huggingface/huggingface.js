//! Reduces bound materials to the handful of PBR parameters a web renderer uses.
//!
//! `UsdPreviewSurface` networks are read as specified. Materials that only carry
//! an MDL surface are read by their parameter names for the two MDL modules
//! SimReady content uses most (`OmniPBR` and the glTF `pbr.mdl`); no MDL code is
//! ever loaded or run. Anything else falls back to neutral grey so geometry
//! always shows.

use std::collections::HashMap;

use openusd::sdf::{self, Value};
use openusd::usd::Stage;

#[derive(Clone, Debug, PartialEq)]
pub struct Material {
    pub path: String,
    /// `preview`, `omnipbr`, `gltf-pbr`, `displayColor` or `fallback`.
    pub kind: &'static str,
    pub color: [f32; 3],
    pub opacity: f32,
    pub roughness: f32,
    pub metallic: f32,
    pub emissive: [f32; 3],
    /// `opacityThreshold`: above zero, opacity is a cutout mask.
    pub opacity_threshold: f32,
    /// Textured inputs, by `UsdPreviewSurface` input name (`diffuseColor`,
    /// `roughness`, `normal`, ...).
    pub maps: Vec<(&'static str, Texture)>,
    /// The diffuse color comes from this primvar of the bound mesh
    /// (`UsdPrimvarReader_float3`, usually `displayColor`).
    pub color_primvar: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Texture {
    /// Virtual path of the image file.
    pub path: String,
    /// The `UsdUVTexture` output read: `rgb`, `r`, `g`, `b` or `a`.
    pub channel: String,
    /// `value = texel * scale + bias`, per channel (`UsdUVTexture`).
    pub scale: [f32; 4],
    pub bias: [f32; 4],
    /// What the input shows when the image cannot be read: its own value
    /// (authored or the shader's default), as for an input with no texture.
    pub value: Option<[f32; 3]>,
    /// `sourceColorSpace`: `raw`, `sRGB` or `auto` (unset).
    pub color_space: Option<String>,
    /// `primvars:<name>` the texture is sampled with, when it says.
    pub uv_set: Option<String>,
    /// UV transform from `UsdTransform2d` / MDL texture scale, when authored:
    /// `st' = rotate(st * uv_scale) + uv_translation`, rotation in degrees.
    pub uv_scale: [f32; 2],
    pub uv_rotation: f32,
    pub uv_translation: [f32; 2],
    /// `wrapS` / `wrapT` tokens, when authored.
    pub wrap: [Option<String>; 2],
}

impl Texture {
    fn new(path: String) -> Self {
        Self {
            path,
            channel: "rgb".to_owned(),
            scale: [1.0; 4],
            bias: [0.0; 4],
            value: None,
            color_space: None,
            uv_set: None,
            uv_scale: [1.0, 1.0],
            uv_rotation: 0.0,
            uv_translation: [0.0, 0.0],
            wrap: [None, None],
        }
    }
}

impl Material {
    fn neutral(path: String, kind: &'static str, color: [f32; 3]) -> Self {
        Self {
            path,
            kind,
            color,
            opacity: 1.0,
            roughness: 0.5,
            metallic: 0.0,
            emissive: [0.0; 3],
            opacity_threshold: 0.0,
            maps: Vec::new(),
            color_primvar: None,
        }
    }
}

/// Materials converted so far, by material prim path.
#[derive(Default)]
pub struct Cache {
    by_path: HashMap<String, u32>,
    by_primvar_color: HashMap<(u32, [u32; 3]), u32>,
    display: Option<u32>,
    fallback: Option<u32>,
}

impl Cache {
    pub fn get(
        &mut self,
        stage: &Stage,
        path: &sdf::Path,
        out: &mut Vec<Material>,
    ) -> openusd::Result<u32> {
        if let Some(&index) = self.by_path.get(path.as_str()) {
            return Ok(index);
        }
        let material = read_material(stage, path)?;
        let index = out.len() as u32;
        out.push(material);
        self.by_path.insert(path.as_str().to_owned(), index);
        Ok(index)
    }

    /// `material` with its diffuse color taken from a mesh primvar value.
    pub fn with_primvar_color(
        &mut self,
        material: u32,
        color: [f32; 3],
        out: &mut Vec<Material>,
    ) -> u32 {
        let key = (material, color.map(f32::to_bits));
        *self.by_primvar_color.entry(key).or_insert_with(|| {
            let mut m = out[material as usize].clone();
            m.color = color;
            m.color_primvar = None;
            out.push(m);
            out.len() as u32 - 1
        })
    }

    /// The material for unbound geometry: white, tinted by its `displayColor`.
    pub fn display_color(&mut self, out: &mut Vec<Material>) -> u32 {
        *self.display.get_or_insert_with(|| {
            let mut m = Material::neutral(String::new(), "displayColor", [1.0; 3]);
            m.color_primvar = Some("displayColor".to_owned());
            out.push(m);
            out.len() as u32 - 1
        })
    }

    /// Neutral grey, for unbound geometry without a `displayColor`.
    pub fn fallback(&mut self, out: &mut Vec<Material>) -> u32 {
        *self.fallback.get_or_insert_with(|| {
            out.push(Material::neutral(String::new(), "fallback", [0.7; 3]));
            out.len() as u32 - 1
        })
    }
}

fn read_material(stage: &Stage, path: &sdf::Path) -> openusd::Result<Material> {
    let name = path.as_str().to_owned();
    if let Some(shader) = surface_shader(stage, path, "outputs:surface")?
        && shader_id(stage, &shader)?.as_deref() == Some("UsdPreviewSurface")
    {
        return read_preview_surface(stage, &shader, name);
    }
    if let Some(shader) = surface_shader(stage, path, "outputs:mdl:surface")? {
        match mdl_material(stage, &shader)?.as_deref() {
            // OmniPBR and its ClearCoat / Opacity variants share OmniPBR's inputs.
            Some(id) if id.starts_with("OmniPBR") => return read_omnipbr(stage, &shader, name),
            // glTF's pbr.mdl, whatever the copy of the module is named (pbr_1.mdl, ...).
            Some("gltf_material") => return read_gltf_pbr(stage, &shader, name),
            _ => {}
        }
    }
    Ok(Material::neutral(name, "fallback", [0.7, 0.7, 0.7]))
}

/// The shader prim a material terminal connects to, through node graphs.
fn surface_shader(
    stage: &Stage,
    material: &sdf::Path,
    output: &str,
) -> openusd::Result<Option<sdf::Path>> {
    let attr = material
        .append_property(output)
        .map_err(openusd::Error::from)?;
    Ok(match follow(stage, &attr, 0)? {
        Source::Output(prim, _) => Some(prim),
        Source::Value(_) | Source::None => None,
    })
}

fn shader_id(stage: &Stage, shader: &sdf::Path) -> openusd::Result<Option<String>> {
    Ok(crate::extract::token_attr(&stage.prim(shader)?, "info:id"))
}

/// Which MDL material a shader instantiates: its `subIdentifier`, else the
/// module's file name (`OmniPBR` for `@../source_assets/OmniPBR.mdl@`).
fn mdl_material(stage: &Stage, shader: &sdf::Path) -> openusd::Result<Option<String>> {
    let prim = stage.prim(shader)?;
    if let Some(id) = crate::extract::token_attr(&prim, "info:mdl:sourceAsset:subIdentifier") {
        return Ok(Some(id));
    }
    Ok(prim
        .attribute("info:mdl:sourceAsset")
        .get::<Value>()
        .ok()
        .flatten()
        .and_then(|value| match value {
            Value::AssetPath(a) => Some(a.asset_path().to_owned()),
            _ => None,
        })
        .and_then(|path| {
            let file = path.rsplit('/').next()?;
            Some(file.strip_suffix(".mdl").unwrap_or(file).to_owned())
        }))
}

enum Source {
    /// A shader output: shader prim and output name (`rgb`, `r`, ...).
    Output(sdf::Path, String),
    Value(Value),
    None,
}

/// Follows an input or terminal through interface connections to a value or a
/// shader output.
fn follow(stage: &Stage, attr_path: &sdf::Path, depth: u32) -> openusd::Result<Source> {
    let attr = stage
        .attribute(attr_path.clone())
        .map_err(openusd::Error::from)?;
    if let Some(target) = attr.connections()?.into_iter().next() {
        let name = property_name(&target);
        if let Some(output) = name.strip_prefix("outputs:") {
            let prim = target.prim_path();
            // A node graph output forwards to whatever it connects to.
            if depth < 8 && !is_shader(stage, &prim)? {
                return follow(stage, &target, depth + 1);
            }
            return Ok(Source::Output(prim, output.to_owned()));
        }
        if name.starts_with("inputs:") && depth < 8 {
            return follow(stage, &target, depth + 1);
        }
        return Ok(Source::None);
    }
    Ok(match attr.get::<Value>()? {
        Some(value) => Source::Value(value),
        None => Source::None,
    })
}

/// The property part of a property path (`outputs:rgb` of `/M/Tex.outputs:rgb`).
fn property_name(path: &sdf::Path) -> &str {
    let s = path.as_str();
    let last = s.rsplit('/').next().unwrap_or(s);
    last.split_once('.').map_or("", |(_, prop)| prop)
}

fn is_shader(stage: &Stage, prim: &sdf::Path) -> openusd::Result<bool> {
    Ok(stage.prim(prim)?.type_name()?.as_deref() == Some("Shader"))
}

fn input(shader: &sdf::Path, name: &str) -> openusd::Result<sdf::Path> {
    shader
        .append_property(format!("inputs:{name}"))
        .map_err(openusd::Error::from)
}

/// The value input `name` of `node` resolves to, through interface
/// connections; `None` when it is unset or connected to a shader output.
fn value(stage: &Stage, node: &sdf::Path, name: &str) -> openusd::Result<Option<Value>> {
    Ok(match follow(stage, &input(node, name)?, 0)? {
        Source::Value(v) => Some(v),
        _ => None,
    })
}

fn read_preview_surface(
    stage: &Stage,
    shader: &sdf::Path,
    path: String,
) -> openusd::Result<Material> {
    let mut m = Material::neutral(path, "preview", [0.18, 0.18, 0.18]);
    // Packed maps (e.g. occlusion/roughness/metallic) read one texture node
    // through several outputs: read each node once.
    let mut nodes: HashMap<sdf::Path, Option<Texture>> = HashMap::new();
    for name in [
        "diffuseColor",
        "emissiveColor",
        "roughness",
        "metallic",
        "occlusion",
        "opacity",
        "opacityThreshold",
        "normal",
    ] {
        let constant = match follow(stage, &input(shader, name)?, 0)? {
            Source::Value(v) => color_or_scalar(&v),
            Source::Output(node, output) => match shader_id(stage, &node)?.as_deref() {
                Some("UsdUVTexture") => match texture_node(stage, &mut nodes, &node)? {
                    Some(mut texture) => {
                        texture.channel = output;
                        let own = stage
                            .attribute(input(shader, name)?)
                            .map_err(openusd::Error::from)?
                            .get::<Value>()?;
                        texture.value = Some(
                            own.as_ref()
                                .and_then(color_or_scalar)
                                .unwrap_or(preview_default(name)),
                        );
                        if name == "diffuseColor" {
                            m.color = [1.0; 3];
                        }
                        m.maps.push((name, texture));
                        None
                    }
                    // No image: the texture yields its fallback (Hydra's default is black).
                    None => {
                        let fallback = value(stage, &node, "fallback")?.as_ref().and_then(vec4);
                        let [r, g, b, a] = fallback.unwrap_or([0.0, 0.0, 0.0, 1.0]);
                        Some(match output.as_str() {
                            "r" => [r; 3],
                            "g" => [g; 3],
                            "b" => [b; 3],
                            "a" => [a; 3],
                            _ => [r, g, b],
                        })
                    }
                },
                Some(id) if name == "diffuseColor" && id.starts_with("UsdPrimvarReader") => {
                    m.color = [1.0; 3];
                    m.color_primvar = value(stage, &node, "varname")?.as_ref().and_then(string);
                    None
                }
                _ => None,
            },
            Source::None => None,
        };
        if let Some(c) = constant {
            match name {
                "diffuseColor" => m.color = c,
                "emissiveColor" => m.emissive = c,
                "roughness" => m.roughness = c[0],
                "metallic" => m.metallic = c[0],
                "opacity" => m.opacity = c[0],
                "opacityThreshold" => m.opacity_threshold = c[0],
                _ => {}
            }
        }
    }
    Ok(m)
}

/// A UsdPreviewSurface input's value when none is authored.
fn preview_default(input: &str) -> [f32; 3] {
    match input {
        "diffuseColor" => [0.18; 3],
        "roughness" => [0.5; 3],
        "occlusion" | "opacity" => [1.0; 3],
        "normal" => [0.0, 0.0, 1.0],
        _ => [0.0; 3],
    }
}

fn texture_node(
    stage: &Stage,
    nodes: &mut HashMap<sdf::Path, Option<Texture>>,
    node: &sdf::Path,
) -> openusd::Result<Option<Texture>> {
    if let Some(texture) = nodes.get(node) {
        return Ok(texture.clone());
    }
    let texture = uv_texture(stage, node)?;
    nodes.insert(node.clone(), texture.clone());
    Ok(texture)
}

/// The image a `UsdUVTexture` samples, how its channels are remapped, and the
/// primvar and transform it is sampled with.
fn uv_texture(stage: &Stage, shader: &sdf::Path) -> openusd::Result<Option<Texture>> {
    let Some(path) = value(stage, shader, "file")?.as_ref().and_then(asset) else {
        return Ok(None);
    };
    let mut texture = Texture::new(path);
    if let Some(v) = value(stage, shader, "scale")?.as_ref().and_then(vec4) {
        texture.scale = v;
    }
    if let Some(v) = value(stage, shader, "bias")?.as_ref().and_then(vec4) {
        texture.bias = v;
    }
    texture.color_space = value(stage, shader, "sourceColorSpace")?
        .as_ref()
        .and_then(string);
    texture.wrap = [
        value(stage, shader, "wrapS")?.as_ref().and_then(string),
        value(stage, shader, "wrapT")?.as_ref().and_then(string),
    ];
    let Source::Output(mut reader, _) = follow(stage, &input(shader, "st")?, 0)? else {
        return Ok(Some(texture));
    };
    // A UsdTransform2d between texture and reader carries the tiling.
    if shader_id(stage, &reader)?.as_deref() == Some("UsdTransform2d") {
        if let Some(v) = value(stage, &reader, "scale")?.as_ref().and_then(vec2) {
            texture.uv_scale = v;
        }
        texture.uv_rotation = value(stage, &reader, "rotation")?
            .as_ref()
            .and_then(float)
            .unwrap_or(0.0);
        if let Some(v) = value(stage, &reader, "translation")?
            .as_ref()
            .and_then(vec2)
        {
            texture.uv_translation = v;
        }
        match follow(stage, &input(&reader, "in")?, 0)? {
            Source::Output(next, _) => reader = next,
            _ => return Ok(Some(texture)),
        }
    }
    texture.uv_set = value(stage, &reader, "varname")?.as_ref().and_then(string);
    Ok(Some(texture))
}

fn read_omnipbr(stage: &Stage, shader: &sdf::Path, path: String) -> openusd::Result<Material> {
    let mut m = Material::neutral(path, "omnipbr", [0.2, 0.2, 0.2]);
    let get = |name: &str| value(stage, shader, name);
    if let Some(c) = get("diffuse_color_constant")?.as_ref().and_then(color) {
        m.color = c;
    }
    if let Some(r) = get("reflection_roughness_constant")?
        .as_ref()
        .and_then(float)
    {
        m.roughness = r;
    }
    if let Some(v) = get("metallic_constant")?.as_ref().and_then(float) {
        m.metallic = v;
    }
    let scale = get("texture_scale")?
        .as_ref()
        .and_then(vec2)
        .unwrap_or([1.0, 1.0]);
    let texture = |path| Texture {
        uv_scale: scale,
        ..Texture::new(path)
    };
    if let Some(file) = get("diffuse_texture")?.as_ref().and_then(asset) {
        let constant = m.color;
        m.maps.push((
            "diffuseColor",
            Texture {
                value: Some(constant),
                ..texture(file)
            },
        ));
        // OmniPBR multiplies the texture by diffuse_tint, not the constant.
        m.color = get("diffuse_tint")?
            .as_ref()
            .and_then(color)
            .unwrap_or([1.0; 3]);
    }
    if let Some(file) = get("normalmap_texture")?.as_ref().and_then(asset) {
        // OmniPBR normal maps are stored in [0, 1].
        m.maps.push((
            "normal",
            Texture {
                scale: [2.0; 4],
                bias: [-1.0; 4],
                ..texture(file)
            },
        ));
    }
    if get("enable_emission")?.as_ref().and_then(boolean) == Some(true) {
        let c = get("emissive_color")?
            .as_ref()
            .and_then(color)
            .unwrap_or([1.0; 3]);
        let k = get("emissive_intensity")?
            .as_ref()
            .and_then(float)
            .unwrap_or(0.0);
        // OmniPBR intensities are in nits-like units; squash into [0, 1].
        let k = (k / 1000.0).min(1.0);
        m.emissive = [c[0] * k, c[1] * k, c[2] * k];
    }
    if get("enable_opacity")?.as_ref().and_then(boolean) == Some(true) {
        m.opacity = get("opacity_constant")?
            .as_ref()
            .and_then(float)
            .unwrap_or(1.0);
    }
    Ok(m)
}

fn read_gltf_pbr(stage: &Stage, shader: &sdf::Path, path: String) -> openusd::Result<Material> {
    let mut m = Material::neutral(path, "gltf-pbr", [1.0, 1.0, 1.0]);
    let get = |name: &str| value(stage, shader, name);
    if let Some(v) = get("base_color_factor")? {
        if let Some(c) = color(&v) {
            m.color = c;
        }
        if let Value::Vec4f(c) = v {
            m.opacity = c.w;
        }
    }
    m.roughness = get("roughness_factor")?
        .as_ref()
        .and_then(float)
        .unwrap_or(1.0);
    m.metallic = get("metallic_factor")?
        .as_ref()
        .and_then(float)
        .unwrap_or(1.0);
    if let Some(t) = gltf_texture(stage, shader, "base_color_texture")? {
        m.maps.push((
            "diffuseColor",
            Texture {
                value: Some(m.color),
                ..t
            },
        ));
    }
    if let Some(t) = gltf_texture(stage, shader, "normal_texture")? {
        m.maps.push((
            "normal",
            Texture {
                scale: [2.0; 4],
                bias: [-1.0; 4],
                ..t
            },
        ));
    }
    Ok(m)
}

/// A glTF `pbr.mdl` texture input: an asset value, or a connection to a
/// `gltf_texture_lookup` shader carrying the file and its tiling.
fn gltf_texture(stage: &Stage, shader: &sdf::Path, name: &str) -> openusd::Result<Option<Texture>> {
    let (file, scale) = match follow(stage, &input(shader, name)?, 0)? {
        Source::Value(v) => (asset(&v), None),
        Source::Output(lookup, _) => {
            let file = value(stage, &lookup, "texture")?.as_ref().and_then(asset);
            let scale = value(stage, &lookup, "scale")?.as_ref().and_then(vec2);
            (file, scale)
        }
        Source::None => (None, None),
    };
    Ok(file.map(|path| Texture {
        uv_scale: scale.unwrap_or([1.0, 1.0]),
        ..Texture::new(path)
    }))
}

/// A texture file's path. A UDIM set (`name.<UDIM>.png`) loads only its first
/// tile, 1001: drawing the others needs a texture per tile.
fn asset(value: &Value) -> Option<String> {
    match value {
        Value::AssetPath(a) if !a.is_empty() => {
            let path = match a.resolved_path() {
                Some(resolved) if !resolved.is_empty() => resolved,
                _ => a.asset_path(),
            };
            Some(path.replace("<UDIM>", "1001"))
        }
        _ => None,
    }
}

fn color(value: &Value) -> Option<[f32; 3]> {
    match value {
        Value::Vec3f(c) => Some([c.x, c.y, c.z]),
        Value::Vec3d(c) => Some([c.x as f32, c.y as f32, c.z as f32]),
        Value::Vec4f(c) => Some([c.x, c.y, c.z]),
        Value::Vec4d(c) => Some([c.x as f32, c.y as f32, c.z as f32]),
        _ => None,
    }
}

/// A color, or a scalar as grey.
fn color_or_scalar(value: &Value) -> Option<[f32; 3]> {
    color(value).or_else(|| float(value).map(|f| [f; 3]))
}

fn vec4(value: &Value) -> Option<[f32; 4]> {
    match value {
        Value::Vec4f(v) => Some([v.x, v.y, v.z, v.w]),
        Value::Vec4d(v) => Some([v.x as f32, v.y as f32, v.z as f32, v.w as f32]),
        _ => None,
    }
}

fn vec2(value: &Value) -> Option<[f32; 2]> {
    match value {
        Value::Vec2f(v) => Some([v.x, v.y]),
        Value::Vec2d(v) => Some([v.x as f32, v.y as f32]),
        _ => None,
    }
}

fn float(value: &Value) -> Option<f32> {
    match value {
        Value::Float(v) => Some(*v),
        Value::Double(v) => Some(*v as f32),
        Value::Half(v) => Some(v.to_f32()),
        _ => None,
    }
}

fn boolean(value: &Value) -> Option<bool> {
    match value {
        Value::Bool(v) => Some(*v),
        Value::Int(v) => Some(*v != 0),
        _ => None,
    }
}

/// A token or string value.
pub(crate) fn string(value: &Value) -> Option<String> {
    match value {
        Value::Token(t) => Some(t.as_str().to_owned()),
        Value::String(s) => Some(s.clone()),
        _ => None,
    }
}
