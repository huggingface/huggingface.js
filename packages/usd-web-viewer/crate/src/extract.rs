//! Walks a composed stage and flattens what a viewer draws: triangle meshes
//! with world transforms and simple PBR materials.

use std::collections::{BTreeMap, HashMap, HashSet};

use openusd::gf::Matrix4d;
use openusd::sdf::{self, Value};
use openusd::usd::{self, PrimPredicate, Stage};
use openusd_schemas::geom::XformCache;
use openusd_schemas::shade::MaterialBindingAPI;

use crate::implicit;
use crate::material::{self, Material};

/// Everything a renderer needs from a stage. [`plan`] fills in all but the
/// triangle data, which [`Scene::read_geometry`] reads one mesh at a time from
/// `sources`; [`Scene::read_all`] reads it all up front into `geometries`.
#[derive(Default)]
pub struct Scene {
    pub up_axis: String,
    pub meters_per_unit: f64,
    /// What to read for each geometry; holding the prims keeps the stage alive.
    pub sources: Vec<Source>,
    /// Triangle data, shared by every instance that draws it (after [`Scene::read_all`]).
    pub geometries: Vec<Geometry>,
    pub instances: Vec<Instance>,
    /// World bounding box of every instance from authored extents (min, then
    /// max), known before any triangle is read; `None` when a mesh has none.
    pub bounds: Option<[[f64; 3]; 2]>,
    pub materials: Vec<Material>,
    pub stats: Stats,
    /// What the viewer could not show faithfully, for the host to surface.
    pub warnings: Vec<Warning>,
}

/// Something the viewer could not show faithfully.
pub struct Warning {
    /// `prim-unsupported`, `material-fallback`, `instance-limit` or
    /// `composition` (the page adds layer, texture, `triangle-limit` and
    /// `nothing-drawable` warnings).
    pub code: &'static str,
    pub message: String,
    /// An example prim or material path, when there is one.
    pub path: Option<String>,
}

#[derive(Default, Debug)]
pub struct Stats {
    pub prims: usize,
    pub meshes: usize,
    pub skipped_invisible: usize,
    pub skipped_purpose: usize,
    pub skipped_empty: usize,
    pub triangles: usize,
}

/// A mesh prim to read, with what its bound materials need from it.
pub struct Source {
    pub prim: usd::Prim,
    /// The primvar per-vertex colors come from, when a bound material shows them.
    pub color_primvar: Option<String>,
    pub uv_sets: Vec<String>,
}

pub struct Geometry {
    pub source: String,
    pub positions: Vec<f32>,
    pub normals: Vec<f32>,
    /// UV sets by primvar name: the default set first, then the ones bound
    /// textures name. Empty when the mesh has no texture coordinates.
    pub uvs: Vec<(String, Vec<f32>)>,
    /// Per-vertex colors from the primvar a bound material reads (usually
    /// `displayColor`); empty unless authored per vertex/face.
    pub colors: Vec<f32>,
    pub indices: Vec<u32>,
    /// Index ranges, one per material subset; a single range without subsets.
    pub groups: Vec<Group>,
    /// Local bounding box of `positions`: min, then max.
    pub bounds: [[f32; 3]; 2],
}

/// What [`Scene::read_geometry`] found.
pub enum Read {
    Geometry(Geometry),
    /// Nothing drawable.
    Nothing,
    /// Left unread: more triangles than allowed.
    OverBudget {
        path: String,
        triangles: usize,
    },
}

pub struct Group {
    pub start: u32,
    pub count: u32,
    /// The `GeomSubset` child (by name) whose binding this range takes.
    pub subset: Option<String>,
}

pub struct Instance {
    pub path: String,
    pub geometry: u32,
    /// Local-to-world, row-major with row vectors (USD); the same 16 numbers
    /// are a column-major matrix for three.js.
    pub matrix: [f64; 16],
    /// The mesh's own material, and the materials its `GeomSubset`s bind (by
    /// subset name): a geometry group takes its subset's, else the mesh's.
    pub material: u32,
    pub subsets: Vec<(String, u32)>,
    pub double_sided: bool,
}

/// Inherited imageable state along the traversal.
#[derive(Clone, Copy, Default)]
struct Inherited {
    invisible: bool,
    /// The nearest authored purpose is `guide` or `proxy`.
    hidden_purpose: bool,
    /// Index into the prototypes: under a PointInstancer prototype, which is
    /// drawn only at that instancer's placements.
    prototype: Option<u32>,
}

/// A PointInstancer prototype and where instancers place it: each
/// placement's instance indices (`[i]`, or `[i][j]` through a nested
/// instancer) and its prototype-to-world transform.
struct Prototype {
    root: sdf::Path,
    placements: Vec<(String, Matrix4d)>,
    /// The instancers that target it.
    instancers: Vec<u32>,
}

/// A PointInstancer, the prototypes it targets and the prototype it is part
/// of, if any: it is then placed wherever that prototype is.
struct Instancer {
    prim: usd::Prim,
    /// Invisible or of `guide` / `proxy` purpose: it places nothing.
    hidden: bool,
    targets: Vec<u32>,
    enclosing: Option<u32>,
    state: Placing,
}

#[derive(Clone, Copy, PartialEq)]
enum Placing {
    Todo,
    InProgress,
    Done,
}

/// Every PointInstancer's placements, nested instancers expanded, at most
/// `max` per prototype.
struct Placer<'a> {
    stage: &'a Stage,
    xforms: &'a mut XformCache,
    instancers: Vec<Instancer>,
    prototypes: Vec<Prototype>,
    max: usize,
    /// An instancer whose placements were left out past `max`.
    truncated: Option<String>,
}

impl Placer<'_> {
    /// Places prototype `p`: runs every instancer that targets it.
    fn resolve(&mut self, p: u32) -> openusd::Result<()> {
        for k in 0..self.prototypes[p as usize].instancers.len() {
            let i = self.prototypes[p as usize].instancers[k];
            self.place(i)?;
        }
        Ok(())
    }

    /// Adds instancer `i`'s placements to its prototypes, once the prototype
    /// it is part of is placed. One that (through others) places itself
    /// places nothing.
    fn place(&mut self, i: u32) -> openusd::Result<()> {
        let instancer = &mut self.instancers[i as usize];
        if instancer.state != Placing::Todo {
            return Ok(());
        }
        instancer.state = Placing::InProgress;
        let (prim, hidden, enclosing) = (
            instancer.prim.clone(),
            instancer.hidden,
            instancer.enclosing,
        );
        // Where the instancer itself is drawn, as instancer-to-world transforms.
        let bases = match enclosing {
            _ if hidden => Vec::new(),
            None => vec![(
                String::new(),
                self.xforms
                    .local_to_world_transform(&prim)
                    .unwrap_or(Matrix4d::IDENTITY),
            )],
            Some(e) => {
                self.resolve(e)?;
                let prototype = &self.prototypes[e as usize];
                let above_root = self
                    .stage
                    .prim(prototype.root.parent().unwrap_or_else(sdf::Path::abs_root))?;
                let (to_root, _) = self
                    .xforms
                    .compute_relative_transform(&prim, &above_root)
                    .unwrap_or((Matrix4d::IDENTITY, false));
                prototype
                    .placements
                    .iter()
                    .map(|(label, m)| (label.clone(), to_root * *m))
                    .collect()
            }
        };
        if !bases.is_empty() {
            let targets = std::mem::take(&mut self.instancers[i as usize].targets);
            add_placements(
                &prim,
                &targets,
                &bases,
                &mut self.prototypes,
                self.max,
                &mut self.truncated,
            )?;
        }
        self.instancers[i as usize].state = Placing::Done;
        Ok(())
    }
}

impl Instance {
    /// The material a geometry group is drawn with.
    pub fn material_for(&self, group: &Group) -> u32 {
        let subset = group
            .subset
            .as_ref()
            .and_then(|name| self.subsets.iter().find(|(n, _)| n == name));
        subset.map_or(self.material, |&(_, m)| m)
    }
}

impl Scene {
    /// Reads every geometry into `geometries`, dropping instances of meshes
    /// with nothing drawable and counting triangles. Releases the sources
    /// (and with them the stage).
    pub fn read_all(mut self) -> openusd::Result<Scene> {
        let mut index = vec![None; self.sources.len()];
        for (i, slot) in index.iter_mut().enumerate() {
            if let Read::Geometry(geometry) = self.read_geometry(i, usize::MAX)? {
                *slot = Some(self.geometries.len() as u32);
                self.geometries.push(geometry);
            }
        }
        let instances = std::mem::take(&mut self.instances);
        for mut instance in instances {
            let Some(geometry) = index[instance.geometry as usize] else {
                self.stats.meshes -= 1;
                self.stats.skipped_empty += 1;
                continue;
            };
            instance.geometry = geometry;
            self.stats.triangles += self.geometries[geometry as usize].indices.len() / 3;
            self.instances.push(instance);
        }
        self.sources.clear();
        Ok(self)
    }

    /// Reads the triangle data of `sources[index]`, unless it has more than
    /// `max_triangles`: a mesh is counted from its faces before reading the
    /// rest, and anything read by the triangles it emits.
    pub fn read_geometry(&self, index: usize, max_triangles: usize) -> openusd::Result<Read> {
        let Some(source) = self.sources.get(index) else {
            let message = format!("no geometry {index}: the scene has {}", self.sources.len());
            return Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, message).into());
        };
        let path = || source.prim.path().as_str().to_owned();
        let geometry = match source.prim.type_name()? {
            Some(ty) if implicit::is_implicit(ty.as_str()) => {
                implicit::read(&source.prim, ty.as_str())
            }
            _ => {
                // Saturating: on wasm32 a wrapped sum would pass the budget.
                let triangles = ints(source.prim.attribute("faceVertexCounts").get::<Value>()?)
                    .unwrap_or_default()
                    .iter()
                    .fold(0usize, |sum, &n| {
                        sum.saturating_add((n.max(2) - 2) as usize)
                    });
                if triangles > max_triangles {
                    return Ok(Read::OverBudget {
                        path: path(),
                        triangles,
                    });
                }
                read_mesh(
                    &source.prim,
                    source.color_primvar.as_deref(),
                    &source.uv_sets,
                )?
            }
        };
        Ok(match geometry {
            Some(g) if g.indices.len() / 3 > max_triangles => Read::OverBudget {
                path: path(),
                triangles: g.indices.len() / 3,
            },
            Some(g) => Read::Geometry(g),
            None => Read::Nothing,
        })
    }
}

/// Composes what a renderer needs except triangle data: materials, instances
/// with their transforms and materials, and the mesh sources to read. Draws
/// at most `max_instances` mesh instances, PointInstancer placements included.
pub fn plan(stage: &Stage, max_instances: usize) -> openusd::Result<Scene> {
    let mut scene = Scene {
        up_axis: stage
            .stage_metadata("upAxis")
            .ok()
            .flatten()
            .as_ref()
            .and_then(material::string)
            .unwrap_or_else(|| "Y".to_owned()),
        meters_per_unit: match stage.stage_metadata("metersPerUnit")? {
            Some(Value::Double(v)) => v,
            Some(Value::Float(v)) => v as f64,
            _ => 0.01,
        },
        ..Scene::default()
    };

    let mut paths = Vec::new();
    stage.traverse(PrimPredicate::DEFAULT_PROXIES, |path| {
        paths.push(path.clone())
    })?;
    scene.stats.prims = paths.len();

    let mut state: HashMap<sdf::Path, Inherited> = HashMap::with_capacity(paths.len());
    let mut xforms = XformCache::new(None);
    let mut geometry_by_source: HashMap<String, u32> = HashMap::new();
    // Each source's local extent, and the world box of the instances so far.
    let mut extents: Vec<Option<[[f32; 3]; 2]>> = Vec::new();
    let mut bounds = Some([[f64::INFINITY; 3], [f64::NEG_INFINITY; 3]]);
    let mut materials = material::Cache::default();
    // Prim type -> (count, first path).
    let mut unsupported: HashMap<String, (usize, String)> = HashMap::new();

    // Visibility and purpose first: an invisible or guide instancer places nothing.
    let mut instancers = Vec::new();
    for path in &paths {
        let prim = stage.prim(path)?;
        let mut own = path
            .parent()
            .and_then(|p| state.get(&p).copied())
            .unwrap_or_default();
        if !own.invisible && token_attr(&prim, "visibility").as_deref() == Some("invisible") {
            own.invisible = true;
        }
        // Only an authored purpose overrides the inherited one; the schema
        // fallback (`default`) on every prim must not.
        if prim.attribute("purpose").has_authored_value()?
            && let Some(purpose) = token_attr(&prim, "purpose")
        {
            own.hidden_purpose = purpose == "guide" || purpose == "proxy";
        }
        state.insert(path.clone(), own);
        if prim.type_name()?.as_deref() == Some("PointInstancer") {
            instancers.push((prim, own.invisible || own.hidden_purpose));
        }
    }

    // Every prototype is registered, placed or not: it is drawn only where placed.
    let mut prototypes: Vec<Prototype> = Vec::new();
    let mut prototype_index: HashMap<sdf::Path, u32> = HashMap::new();
    let mut targets = Vec::with_capacity(instancers.len());
    for (i, (prim, _)) in instancers.iter().enumerate() {
        let mut indices = Vec::new();
        for root in prim.relationship("prototypes").targets()? {
            let index = *prototype_index.entry(root.clone()).or_insert_with(|| {
                prototypes.push(Prototype {
                    root,
                    placements: Vec::new(),
                    instancers: Vec::new(),
                });
                prototypes.len() as u32 - 1
            });
            let instancers = &mut prototypes[index as usize].instancers;
            if instancers.last() != Some(&(i as u32)) {
                instancers.push(i as u32);
            }
            indices.push(index);
        }
        targets.push(indices);
    }
    let instancers = instancers
        .into_iter()
        .zip(targets)
        .map(|((prim, hidden), targets)| {
            // The nearest prototype at or above the instancer.
            let enclosing = std::iter::successors(Some(prim.path().clone()), |p| p.parent())
                .find_map(|p| prototype_index.get(&p).copied());
            Instancer {
                prim,
                hidden,
                targets,
                enclosing,
                state: Placing::Todo,
            }
        })
        .collect();
    let mut placer = Placer {
        stage,
        xforms: &mut xforms,
        instancers,
        prototypes,
        max: max_instances,
        truncated: None,
    };
    for p in 0..placer.prototypes.len() as u32 {
        placer.resolve(p)?;
    }
    let Placer {
        prototypes,
        truncated,
        ..
    } = placer;
    let mut over_limit: Option<String> = None;

    for path in paths {
        let prim = stage.prim(&path)?;
        let inherited = path
            .parent()
            .and_then(|p| state.get(&p))
            .and_then(|s| s.prototype);
        let Some(own) = state.get_mut(&path) else {
            continue;
        };
        own.prototype = prototype_index.get(&path).copied().or(inherited);
        let own = *own;

        let Some(ty) = prim.type_name()? else {
            continue;
        };
        if ty.as_str() != "Mesh" && !implicit::is_implicit(ty.as_str()) {
            // Any other geometric prim (curves, points, implicit shapes,
            // volumes, Gaussian splats, ...) is left out, but not silently.
            if !own.invisible && !own.hidden_purpose && is_gprim(&prim, ty.as_str())? {
                unsupported
                    .entry(ty.as_str().to_owned())
                    .or_insert_with(|| (0, path.as_str().to_owned()))
                    .0 += 1;
            }
            continue;
        }
        if own.invisible {
            scene.stats.skipped_invisible += 1;
            continue;
        }
        if own.hidden_purpose {
            scene.stats.skipped_purpose += 1;
            continue;
        }
        let remaining = max_instances.saturating_sub(scene.instances.len());
        let placements = own.prototype.map(|p| &prototypes[p as usize].placements);
        if remaining < placements.map_or(1, Vec::len) {
            over_limit.get_or_insert_with(|| path.as_str().to_owned());
            if remaining == 0 {
                continue;
            }
        }

        // Instance proxies share their prototype's data: read it once.
        let source = match prim.prim_in_prototype()? {
            Some(proto) => proto,
            None => prim.clone(),
        };
        let binding = MaterialBindingAPI::from_prim_unchecked(prim.clone())
            .compute_bound_material("preview")?;
        let mesh_material = shown_material(
            stage,
            &mut materials,
            &mut scene.materials,
            &prim,
            binding.as_ref(),
        )?;
        let mut subset_materials = HashMap::new();
        for child in prim.children()? {
            if is_material_subset(&child)?
                && let Some(mat) = MaterialBindingAPI::from_prim_unchecked(child.clone())
                    .compute_bound_material("preview")?
                && let Some(name) = child.path().name()
            {
                let index = shown_material(
                    stage,
                    &mut materials,
                    &mut scene.materials,
                    &prim,
                    Some(&mat),
                )?;
                subset_materials.insert(name.to_owned(), index);
            }
        }
        // What the materials sample: per-vertex colors when one still names
        // its color primvar, and the UV primvars their textures name.
        let used = || {
            std::iter::once(&mesh_material)
                .chain(subset_materials.values())
                .map(|&m| &scene.materials[m as usize])
        };
        let color_primvar = used().find_map(|m| m.color_primvar.clone());
        let mut uv_sets: Vec<String> = used()
            .flat_map(|m| m.maps.iter().filter_map(|(_, t)| t.uv_set.clone()))
            .collect();
        uv_sets.sort();
        uv_sets.dedup();
        let key = format!(
            "{}|{}|{}",
            source.path().as_str(),
            color_primvar.as_deref().unwrap_or(""),
            uv_sets.join(",")
        );
        let geometry = *geometry_by_source.entry(key).or_insert_with(|| {
            extents.push(extent(&source, ty.as_str()));
            scene.sources.push(Source {
                prim: source,
                color_primvar,
                uv_sets,
            });
            scene.sources.len() as u32 - 1
        });
        let mut subsets: Vec<(String, u32)> = subset_materials.into_iter().collect();
        subsets.sort();

        let placed = match (own.prototype, placements) {
            (Some(index), Some(placements)) => {
                let prototype = &prototypes[index as usize];
                let above_root =
                    stage.prim(prototype.root.parent().unwrap_or_else(sdf::Path::abs_root))?;
                let (to_root, _) = xforms
                    .compute_relative_transform(&prim, &above_root)
                    .unwrap_or((Matrix4d::IDENTITY, false));
                placements
                    .iter()
                    .take(remaining)
                    .map(|(label, placement)| {
                        (format!("{}{label}", path.as_str()), to_root * *placement)
                    })
                    .collect()
            }
            _ => vec![(
                path.as_str().to_owned(),
                xforms
                    .local_to_world_transform(&prim)
                    .unwrap_or(Matrix4d::IDENTITY),
            )],
        };
        let double_sided = matches!(prim.attribute("doubleSided").get::<bool>(), Ok(Some(true)));
        for (path, matrix) in placed {
            bounds = bounds
                .zip(extents[geometry as usize])
                .map(|(b, e)| grow(b, e, &matrix.0));
            scene.stats.meshes += 1;
            scene.instances.push(Instance {
                path,
                geometry,
                matrix: matrix.0,
                material: mesh_material,
                subsets: subsets.clone(),
                double_sided,
            });
        }
    }
    scene.bounds = bounds.filter(|_| !scene.instances.is_empty());
    if let Some(path) = over_limit.or(truncated) {
        scene.warnings.push(Warning {
            code: "instance-limit",
            message: format!("instances past maxInstances ({max_instances}) not drawn"),
            path: Some(path),
        });
    }
    let mut types: Vec<_> = unsupported.into_iter().collect();
    types.sort();
    for (ty, (count, first)) in types {
        scene.warnings.push(Warning {
            code: "prim-unsupported",
            message: format!("{count} {ty} prim(s) not drawn (unsupported type)"),
            path: Some(first),
        });
    }
    let fallback: Vec<&str> = scene
        .materials
        .iter()
        .filter(|m| m.kind == "fallback" && !m.path.is_empty())
        .map(|m| m.path.as_str())
        .collect();
    if let Some(first) = fallback.first() {
        scene.warnings.push(Warning {
            code: "material-fallback",
            message: format!(
                "{} material(s) have no UsdPreviewSurface or supported MDL material and show as grey",
                fallback.len()
            ),
            path: Some((*first).to_owned()),
        });
    }
    Ok(scene)
}

/// A gprim's local bounding box: its authored `extent`, or for an implicit
/// shape the bounds of its mesh.
fn extent(prim: &usd::Prim, ty: &str) -> Option<[[f32; 3]; 2]> {
    if implicit::is_implicit(ty) {
        return implicit::read(prim, ty).map(|g| g.bounds);
    }
    match vec3s(&prim.attribute("extent").get::<Value>().ok()??)?[..] {
        [min, max] => Some([min, max]),
        _ => None,
    }
}

/// `bounds` grown to hold the corners of `extent` placed by `matrix`.
fn grow(mut bounds: [[f64; 3]; 2], extent: [[f32; 3]; 2], matrix: &[f64; 16]) -> [[f64; 3]; 2] {
    for corner in 0..8 {
        let p = [0, 1, 2].map(|k| extent[(corner >> k) & 1][k] as f64);
        for k in 0..3 {
            let v = p[0] * matrix[k] + p[1] * matrix[4 + k] + p[2] * matrix[8 + k] + matrix[12 + k];
            bounds[0][k] = bounds[0][k].min(v);
            bounds[1][k] = bounds[1][k].max(v);
        }
    }
    bounds
}

/// A `GeomSubset` of the `materialBind` family: the subsets materials bind
/// through, as Pixar's `GetMaterialBindSubsets` reads them.
fn is_material_subset(prim: &usd::Prim) -> openusd::Result<bool> {
    Ok(prim.type_name()?.as_deref() == Some("GeomSubset")
        && token_attr(prim, "familyName").as_deref() == Some("materialBind"))
}

/// Whether a prim is geometry. The UsdVol schemas are not registered (to keep
/// the module small), so their gprims are known by name.
fn is_gprim(prim: &usd::Prim, ty: &str) -> openusd::Result<bool> {
    Ok(ty == "Volume" || ty.starts_with("ParticleField") || prim.is_a("Gprim")?)
}

/// Records where a PointInstancer places each of its prototypes (`targets`,
/// by index), at each of `bases`, where the instancer itself is:
/// `scale * orientation * translate(position) * base`, leaving out
/// `invisibleIds` and `inactiveIds`, and at most `max` per prototype.
fn add_placements(
    prim: &usd::Prim,
    targets: &[u32],
    bases: &[(String, Matrix4d)],
    prototypes: &mut [Prototype],
    max: usize,
    truncated: &mut Option<String>,
) -> openusd::Result<()> {
    let Some(proto_indices) = ints(prim.attribute("protoIndices").get::<Value>()?) else {
        return Ok(());
    };
    let Some(positions) = prim
        .attribute("positions")
        .get::<Value>()?
        .as_ref()
        .and_then(vec3s)
    else {
        return Ok(());
    };
    let orientations: Vec<[f64; 4]> = match prim.attribute("orientations").get::<Value>()? {
        Some(Value::QuathVec(q)) => q
            .iter()
            .map(|q| [q.w, q.x, q.y, q.z].map(|v| v.to_f32() as f64))
            .collect(),
        _ => match prim.attribute("orientationsf").get::<Value>()? {
            Some(Value::QuatfVec(q)) => q.iter().map(|&q| q.into()).collect(),
            _ => Vec::new(),
        },
    };
    let scales = prim
        .attribute("scales")
        .get::<Value>()?
        .as_ref()
        .and_then(vec3s)
        .unwrap_or_default();
    let ids = match prim.attribute("ids").get::<Value>()? {
        Some(Value::Int64Vec(ids)) => ids,
        _ => Vec::new(),
    };
    let mut hidden: HashSet<i64> = match prim.attribute("invisibleIds").get::<Value>()? {
        Some(Value::Int64Vec(ids)) => ids.into_iter().collect(),
        _ => HashSet::new(),
    };
    if let Some(Value::Int64ListOp(op)) = prim.get_metadata::<Value>("inactiveIds")? {
        hidden.extend(op.compose_over(&[]));
    }

    // The instances drawn, by target. A nested instancer repeats them at
    // every base, so a full target must cost nothing per base.
    let mut by_target: BTreeMap<u32, Vec<usize>> = BTreeMap::new();
    for (i, &proto) in proto_indices.iter().enumerate() {
        let Some(&target) = targets.get(proto as usize) else {
            continue;
        };
        if i < positions.len() && !hidden.contains(&ids.get(i).copied().unwrap_or(i as i64)) {
            by_target.entry(target).or_default().push(i);
        }
    }
    let mut groups: Vec<(u32, Vec<usize>)> = by_target.into_iter().collect();
    for (label, base) in bases {
        groups.retain(|(target, _)| {
            let open = prototypes[*target as usize].placements.len() < max;
            if !open {
                truncated.get_or_insert_with(|| prim.path().as_str().to_owned());
            }
            open
        });
        if groups.is_empty() {
            return Ok(());
        }
        for (target, instances) in &groups {
            let placements = &mut prototypes[*target as usize].placements;
            for &i in instances {
                if placements.len() >= max {
                    truncated.get_or_insert_with(|| prim.path().as_str().to_owned());
                    break;
                }
                let orientation = orientations.get(i).copied().unwrap_or([1.0, 0.0, 0.0, 0.0]);
                let scale = scales.get(i).copied().unwrap_or([1.0; 3]);
                let placement = Matrix4d::scale(scale.map(f64::from))
                    * Matrix4d::from_quat(orientation)
                    * Matrix4d::translation(positions[i].map(f64::from))
                    * *base;
                placements.push((format!("{label}[{i}]"), placement));
            }
        }
    }
    Ok(())
}

/// The material `binding` names for the mesh `prim` (or a face subset of it),
/// or without one a material showing the mesh's `displayColor` (neutral grey
/// without one) so geometry always shows. A material reading a color primvar
/// of the mesh is tinted by a constant value, or left to per-vertex colors (it
/// keeps `color_primvar`) when the primvar varies.
fn shown_material(
    stage: &Stage,
    cache: &mut material::Cache,
    out: &mut Vec<Material>,
    prim: &usd::Prim,
    binding: Option<&sdf::Path>,
) -> openusd::Result<u32> {
    let index = match binding {
        Some(mat) => cache.get(stage, mat, out)?,
        None => cache.display_color(out),
    };
    let Some(name) = out[index as usize].color_primvar.clone() else {
        return Ok(index);
    };
    // Without the mesh's sizes at hand, a varying primvar is read unexpanded:
    // whether it holds more than one value is all that is asked of it.
    let expected = |interp| (interp == Interp::Constant).then_some(1);
    match read_primvar(
        prim,
        &format!("primvars:{name}"),
        Interp::Constant,
        vec3s,
        expected,
    )? {
        Some(pv) if pv.interp != Interp::Constant && pv.values.len() > 1 => Ok(index),
        Some(pv) if !pv.values.is_empty() => Ok(cache.with_primvar_color(index, pv.values[0], out)),
        _ if binding.is_none() => Ok(cache.fallback(out)),
        _ => Ok(index),
    }
}

pub(crate) fn token_attr(prim: &usd::Prim, name: &str) -> Option<String> {
    prim.attribute(name)
        .get::<Value>()
        .ok()
        .flatten()
        .as_ref()
        .and_then(material::string)
}

/// How a primvar's values map onto the mesh.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Interp {
    Constant,
    Uniform,
    Vertex,
    FaceVarying,
}

struct Primvar<T> {
    values: Vec<T>,
    interp: Interp,
}

/// Reads a primvar, its indices expanded. `expected` gives how many values
/// an interpolation needs on the mesh, where known: indices of any other
/// count are refused before they are expanded, and without a count the
/// authored values come back unexpanded.
fn read_primvar<T>(
    prim: &usd::Prim,
    name: &str,
    default_interp: Interp,
    convert: fn(&Value) -> Option<Vec<T>>,
    expected: impl Fn(Interp) -> Option<usize>,
) -> openusd::Result<Option<Primvar<T>>>
where
    T: Copy,
{
    let attr = prim.attribute(name);
    let Some(value) = attr.get::<Value>()? else {
        return Ok(None);
    };
    let Some(mut values) = convert(&value) else {
        return Ok(None);
    };
    let interp = match attr.get_metadata::<Value>("interpolation")? {
        Some(Value::Token(t)) => match t.as_str() {
            "constant" => Interp::Constant,
            "uniform" => Interp::Uniform,
            "faceVarying" => Interp::FaceVarying,
            _ => Interp::Vertex,
        },
        _ => default_interp,
    };
    let indices_attr = prim.attribute(format!("{name}:indices").as_str());
    if let Some(Value::IntVec(indices)) = indices_attr.get::<Value>()? {
        let mut flat = Vec::with_capacity(indices.len());
        let Some(count) = expected(interp) else {
            return Ok(Some(Primvar { values, interp }));
        };
        if indices.len() != count {
            return Ok(None);
        }
        for i in indices {
            match values.get(i as usize) {
                Some(&v) => flat.push(v),
                None => return Ok(None),
            }
        }
        values = flat;
    }
    Ok(Some(Primvar { values, interp }))
}

fn vec3s(value: &Value) -> Option<Vec<[f32; 3]>> {
    match value {
        Value::Vec3fVec(v) => Some(v.iter().map(|p| [p.x, p.y, p.z]).collect()),
        Value::Vec3dVec(v) => Some(
            v.iter()
                .map(|p| [p.x as f32, p.y as f32, p.z as f32])
                .collect(),
        ),
        Value::Vec3hVec(v) => Some(
            v.iter()
                .map(|p| [p.x.to_f32(), p.y.to_f32(), p.z.to_f32()])
                .collect(),
        ),
        _ => None,
    }
}

fn vec2s(value: &Value) -> Option<Vec<[f32; 2]>> {
    match value {
        Value::Vec2fVec(v) => Some(v.iter().map(|p| [p.x, p.y]).collect()),
        Value::Vec2dVec(v) => Some(v.iter().map(|p| [p.x as f32, p.y as f32]).collect()),
        Value::Vec2hVec(v) => Some(v.iter().map(|p| [p.x.to_f32(), p.y.to_f32()]).collect()),
        _ => None,
    }
}

fn ints(value: Option<Value>) -> Option<Vec<i32>> {
    match value {
        Some(Value::IntVec(v)) => Some(v),
        _ => None,
    }
}

/// Primvars tried, in order, for the default UV set.
const UV_NAMES: [&str; 6] = ["st", "st0", "UVMap", "uv", "map1", "st_0"];

fn read_mesh(
    prim: &usd::Prim,
    color_primvar: Option<&str>,
    uv_sets: &[String],
) -> openusd::Result<Option<Geometry>> {
    let Some(points) = prim
        .attribute("points")
        .get::<Value>()?
        .as_ref()
        .and_then(vec3s)
    else {
        return Ok(None);
    };
    let Some(counts) = ints(prim.attribute("faceVertexCounts").get::<Value>()?) else {
        return Ok(None);
    };
    let Some(face_indices) = ints(prim.attribute("faceVertexIndices").get::<Value>()?) else {
        return Ok(None);
    };
    if points.is_empty() || counts.is_empty() {
        return Ok(None);
    }
    // Checked: on wasm32 a few huge counts would wrap round to the index count.
    let Some(corners) = counts
        .iter()
        .try_fold(0usize, |sum, &c| sum.checked_add(c.max(0) as usize))
    else {
        return Ok(None);
    };
    if corners != face_indices.len()
        || face_indices
            .iter()
            .any(|&i| i < 0 || i as usize >= points.len())
    {
        return Ok(None);
    }
    let left_handed = token_attr(prim, "orientation").as_deref() == Some("leftHanded");

    let expected = |interp| {
        Some(match interp {
            Interp::Constant => 1,
            Interp::Uniform => counts.len(),
            Interp::Vertex => points.len(),
            Interp::FaceVarying => corners,
        })
    };
    // Primvars fall back to constant interpolation; the `normals` attribute to vertex.
    let normals = match read_primvar(prim, "primvars:normals", Interp::Constant, vec3s, expected)? {
        Some(n) => Some(n),
        None => read_primvar(prim, "normals", Interp::Vertex, vec3s, expected)?,
    };
    // The default UV set first, then the ones bound textures name.
    let mut uvs = Vec::new();
    for name in UV_NAMES {
        if let Some(uv) = read_primvar(
            prim,
            &format!("primvars:{name}"),
            Interp::Constant,
            vec2s,
            expected,
        )? {
            uvs.push((name.to_owned(), uv));
            break;
        }
    }
    for name in uv_sets {
        if !uvs.iter().any(|(n, _)| n == name)
            && let Some(uv) = read_primvar(
                prim,
                &format!("primvars:{name}"),
                Interp::Constant,
                vec2s,
                expected,
            )?
        {
            uvs.push((name.clone(), uv));
        }
    }
    // Per-vertex colors, only for meshes whose material shows them.
    let colors = match color_primvar {
        Some(name) => read_primvar(
            prim,
            &format!("primvars:{name}"),
            Interp::Constant,
            vec3s,
            expected,
        )?
        .filter(|c| c.interp != Interp::Constant),
        None => None,
    };
    let fit = |interp, len| fits(interp, len, points.len(), counts.len(), corners);
    let normals = normals.filter(|n| fit(n.interp, n.values.len()));
    uvs.retain(|(_, uv)| fit(uv.interp, uv.values.len()));
    let colors = colors.filter(|c| fit(c.interp, c.values.len()));

    // A polygonal mesh with no normals is drawn faceted; a subdivision surface
    // (the schema fallback) gets smooth normals as its approximation.
    let faceted =
        normals.is_none() && token_attr(prim, "subdivisionScheme").as_deref() == Some("none");
    // Per-point layout when every attribute is per point; otherwise one vertex
    // per face corner, which faceVarying and uniform data need.
    let per_corner = faceted
        || [
            normals.as_ref().map(|n| n.interp),
            colors.as_ref().map(|c| c.interp),
        ]
        .into_iter()
        .flatten()
        .chain(uvs.iter().map(|(_, uv)| uv.interp))
        .any(|i| matches!(i, Interp::FaceVarying | Interp::Uniform));

    let vertex_count = if per_corner { corners } else { points.len() };
    // Maps an output vertex to (point index, face index, corner index).
    let mut point_of = Vec::with_capacity(vertex_count);
    let mut face_of = Vec::with_capacity(if per_corner { corners } else { 0 });
    if per_corner {
        for (face, &count) in counts.iter().enumerate() {
            for _ in 0..count.max(0) {
                face_of.push(face as u32);
            }
        }
        point_of.extend(face_indices.iter().map(|&i| i as u32));
    } else {
        point_of.extend(0..points.len() as u32);
    }

    let mut hole = vec![false; counts.len()];
    for i in ints(prim.attribute("holeIndices").get::<Value>()?).unwrap_or_default() {
        if let Some(h) = hole.get_mut(i as usize) {
            *h = true;
        }
    }
    let mut normals = match normals {
        Some(n) => expand(&n, &point_of, &face_of),
        None if faceted => face_normals(&points, &counts, &face_indices, &face_of, left_handed),
        None => smooth_normals(
            &points,
            &counts,
            &face_indices,
            &hole,
            &point_of,
            left_handed,
        ),
    };
    let mut uvs: Vec<(String, Vec<f32>)> = uvs
        .into_iter()
        .map(|(name, uv)| (name, expand(&uv, &point_of, &face_of)))
        .collect();
    let mut colors = match colors {
        Some(c) => expand(&c, &point_of, &face_of),
        None => Vec::new(),
    };

    // Corners that agree on point, normal, UV and color become one vertex
    // again; positions come straight from the authored points.
    let (positions, remap) = if per_corner {
        let mut attrs = vec![(&mut normals, 3)];
        attrs.extend(uvs.iter_mut().map(|(_, uv)| (uv, 2)));
        if !colors.is_empty() {
            attrs.push((&mut colors, 3));
        }
        let (remap, first_corner) = weld(&point_of, points.len(), &mut attrs);
        let positions = first_corner
            .iter()
            .flat_map(|&c| points[point_of[c as usize] as usize])
            .collect();
        (positions, Some(remap))
    } else {
        (points.as_flattened().to_vec(), None)
    };

    // Triangle fans, ordered by subset so each subset is one contiguous range.
    let subsets = read_subsets(prim, counts.len())?;
    let mut face_start = Vec::with_capacity(counts.len());
    let mut offset = 0u32;
    for &count in &counts {
        face_start.push(offset);
        offset += count.max(0) as u32;
    }
    let vertex = |corner: u32| -> u32 {
        match &remap {
            Some(remap) => remap[corner as usize],
            None => face_indices[corner as usize] as u32,
        }
    };
    let mut indices = Vec::with_capacity((corners.saturating_sub(2 * counts.len())) * 3);
    let mut groups = Vec::new();
    let mut emit =
        |faces: &mut dyn Iterator<Item = usize>, subset: Option<String>, indices: &mut Vec<u32>| {
            let start = indices.len() as u32;
            for face in faces {
                let n = counts[face];
                if n < 3 || hole[face] {
                    continue;
                }
                let base = face_start[face];
                for k in 1..(n as u32 - 1) {
                    let (a, b, c) = (vertex(base), vertex(base + k), vertex(base + k + 1));
                    if left_handed {
                        indices.extend_from_slice(&[a, c, b]);
                    } else {
                        indices.extend_from_slice(&[a, b, c]);
                    }
                }
            }
            let count = indices.len() as u32 - start;
            if count > 0 {
                groups.push(Group {
                    start,
                    count,
                    subset,
                });
            }
        };
    if subsets.is_empty() {
        emit(&mut (0..counts.len()), None, &mut indices);
    } else {
        let mut covered = vec![false; counts.len()];
        for (name, faces) in &subsets {
            for &f in faces {
                covered[f] = true;
            }
            emit(&mut faces.iter().copied(), Some(name.clone()), &mut indices);
        }
        emit(
            &mut (0..counts.len()).filter(|&f| !covered[f]),
            None,
            &mut indices,
        );
    }
    if indices.is_empty() {
        return Ok(None);
    }
    Ok(Some(Geometry {
        bounds: bounds(&positions),
        source: prim.path().as_str().to_owned(),
        positions,
        normals,
        uvs,
        colors,
        indices,
        groups,
    }))
}

/// Distinct vertices a point's chain keeps: past this, corners of the same
/// point are not welded, which costs vertices but keeps welding linear.
const WELD_CHAIN: usize = 64;

/// Merges per-corner vertices that share a point and have bit-identical
/// attributes, rewriting `attrs` (each with its width) in place. Returns the
/// corner-to-vertex map and each vertex's first corner. Candidates are chained
/// per point, so the search stays local.
fn weld(
    point_of: &[u32],
    point_count: usize,
    attrs: &mut [(&mut Vec<f32>, usize)],
) -> (Vec<u32>, Vec<u32>) {
    const NONE: u32 = u32::MAX;
    let mut head = vec![NONE; point_count];
    let mut next: Vec<u32> = Vec::new();
    let mut first_corner: Vec<u32> = Vec::new();
    let mut remap = Vec::with_capacity(point_of.len());
    for (corner, &point) in point_of.iter().enumerate() {
        let same = |other: usize| {
            attrs.iter().all(|(data, w)| {
                let (a, b) = (
                    &data[other * w..other * w + w],
                    &data[corner * w..corner * w + w],
                );
                a.iter().zip(b).all(|(x, y)| x.to_bits() == y.to_bits())
            })
        };
        let mut candidate = head[point as usize];
        let mut chain = 0;
        while candidate != NONE && !same(first_corner[candidate as usize] as usize) {
            candidate = next[candidate as usize];
            chain += 1;
        }
        if candidate == NONE {
            candidate = first_corner.len() as u32;
            first_corner.push(corner as u32);
            next.push(NONE);
            if chain < WELD_CHAIN {
                next[candidate as usize] = head[point as usize];
                head[point as usize] = candidate;
            }
        }
        remap.push(candidate);
    }
    for (data, w) in attrs.iter_mut() {
        let w = *w;
        let mut out = Vec::with_capacity(first_corner.len() * w);
        for &c in &first_corner {
            out.extend_from_slice(&data[c as usize * w..c as usize * w + w]);
        }
        **data = out;
    }
    (remap, first_corner)
}

fn fits(interp: Interp, len: usize, points: usize, faces: usize, corners: usize) -> bool {
    match interp {
        Interp::Constant => len >= 1,
        Interp::Uniform => len >= faces,
        Interp::Vertex => len >= points,
        Interp::FaceVarying => len >= corners,
    }
}

/// Picks the primvar value for output vertex `v`.
fn pick(interp: Interp, v: usize, point_of: &[u32], face_of: &[u32]) -> usize {
    match interp {
        Interp::Constant => 0,
        Interp::Vertex => point_of[v] as usize,
        Interp::Uniform => face_of[v] as usize,
        // Only reachable in the per-corner layout, where vertex == corner.
        Interp::FaceVarying => v,
    }
}

/// A primvar's values at each output vertex, flattened.
fn expand<const N: usize>(pv: &Primvar<[f32; N]>, point_of: &[u32], face_of: &[u32]) -> Vec<f32> {
    let mut out = Vec::with_capacity(point_of.len() * N);
    for v in 0..point_of.len() {
        out.extend_from_slice(&pv.values[pick(pv.interp, v, point_of, face_of)]);
    }
    out
}

/// The bounding box of flattened `positions`: min, then max.
pub(crate) fn bounds(positions: &[f32]) -> [[f32; 3]; 2] {
    let mut bounds = [[f32::INFINITY; 3], [f32::NEG_INFINITY; 3]];
    for p in positions.chunks_exact(3) {
        for k in 0..3 {
            bounds[0][k] = bounds[0][k].min(p[k]);
            bounds[1][k] = bounds[1][k].max(p[k]);
        }
    }
    bounds
}

/// Each face's corners, as point indices.
fn faces<'a>(counts: &'a [i32], face_indices: &'a [i32]) -> impl Iterator<Item = &'a [i32]> {
    let mut corner = 0;
    counts.iter().map(move |&count| {
        let n = count.max(0) as usize;
        corner += n;
        &face_indices[corner - n..corner]
    })
}

/// Area-weighted smooth normals per point, the shading Hydra gives meshes
/// that author none. Hole faces are not drawn, so they do not count.
fn smooth_normals(
    points: &[[f32; 3]],
    counts: &[i32],
    face_indices: &[i32],
    hole: &[bool],
    point_of: &[u32],
    left_handed: bool,
) -> Vec<f32> {
    let mut acc = vec![[0f32; 3]; points.len()];
    for (face, &hole) in faces(counts, face_indices).zip(hole) {
        if hole {
            continue;
        }
        let normal = newell(points, face, left_handed);
        for &p in face {
            let a = &mut acc[p as usize];
            a[0] += normal[0];
            a[1] += normal[1];
            a[2] += normal[2];
        }
    }
    let mut out = Vec::with_capacity(point_of.len() * 3);
    for &p in point_of {
        out.extend_from_slice(&unit(acc[p as usize]));
    }
    out
}

/// One normal per face, repeated at each of its corners (per-corner layout).
fn face_normals(
    points: &[[f32; 3]],
    counts: &[i32],
    face_indices: &[i32],
    face_of: &[u32],
    left_handed: bool,
) -> Vec<f32> {
    let per_face: Vec<[f32; 3]> = faces(counts, face_indices)
        .map(|face| unit(newell(points, face, left_handed)))
        .collect();
    let mut out = Vec::with_capacity(face_of.len() * 3);
    for &f in face_of {
        out.extend_from_slice(&per_face[f as usize]);
    }
    out
}

/// A polygon's area-weighted normal by Newell's method, which handles
/// non-planar polygons; zero for degenerate faces.
fn newell(points: &[[f32; 3]], face: &[i32], left_handed: bool) -> [f32; 3] {
    let n = face.len();
    let mut normal = [0f32; 3];
    if n < 3 {
        return normal;
    }
    for i in 0..n {
        let a = points[face[i] as usize];
        let b = points[face[(i + 1) % n] as usize];
        normal[0] += (a[1] - b[1]) * (a[2] + b[2]);
        normal[1] += (a[2] - b[2]) * (a[0] + b[0]);
        normal[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    if left_handed {
        normal.map(|v| -v)
    } else {
        normal
    }
}

fn unit([x, y, z]: [f32; 3]) -> [f32; 3] {
    let len = (x * x + y * y + z * z).sqrt();
    if len > 0.0 {
        [x / len, y / len, z / len]
    } else {
        [0.0, 0.0, 1.0]
    }
}

/// `materialBind` face subsets, by child name, keeping only valid face
/// indices. Pixar requires a family's indices to be unique: a face named
/// again would be drawn again, so each is kept once, in the first subset
/// that names it.
fn read_subsets(prim: &usd::Prim, face_count: usize) -> openusd::Result<Vec<(String, Vec<usize>)>> {
    let mut out = Vec::new();
    let mut claimed = vec![false; face_count];
    for child in prim.children()? {
        if !is_material_subset(&child)?
            || token_attr(&child, "elementType").is_some_and(|t| t != "face")
        {
            continue;
        }
        let Some(indices) = ints(child.attribute("indices").get::<Value>()?) else {
            continue;
        };
        let faces: Vec<usize> = indices
            .into_iter()
            .filter_map(|i| usize::try_from(i).ok())
            .filter(|&i| i < face_count && !std::mem::replace(&mut claimed[i], true))
            .collect();
        if let Some(name) = child.path().name() {
            out.push((name.to_owned(), faces));
        }
    }
    Ok(out)
}
