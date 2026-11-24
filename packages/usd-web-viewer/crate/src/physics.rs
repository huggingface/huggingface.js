//! What a stage authors for simulation (UsdPhysics rigid bodies, colliders,
//! physics materials and joints, plus UsdSemantics labels), read as authored:
//! nothing is estimated. Masses are in kilograms, densities in kg/m³, inertia
//! in kg·m², joint limits and positions in meters or degrees; positions and
//! matrices stay in stage space, like the meshes' own matrices.

use std::collections::HashMap;

use openusd::gf::{self, Mat4d, Quatf, Vec3f};
use openusd::sdf;
use openusd::usd::{self, Stage};
use openusd::vt::Value;
use openusd_schemas::SchemaError;
use openusd_schemas::geom::XformCache;
use openusd_schemas::physics::{self as schema, ParseOptions, desc};
use openusd_schemas::shade::BindingCache;
use serde::Serialize;

use crate::extract::{bound_material, token_attr};
use crate::ser::finite;

#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Physics {
    pub bodies: Vec<Body>,
    pub colliders: Vec<Collider>,
    pub materials: Vec<PhysicsMaterial>,
    pub joints: Vec<Joint>,
    /// Prims with `PhysicsArticulationRootAPI`: where an articulation (bodies
    /// an engine solves together, like a robot) starts.
    pub articulation_roots: Vec<String>,
    /// Xforms under a rigid body, which move with it: often named points with
    /// no mesh, like a gripper's tip.
    pub frames: Vec<Frame>,
}

/// An `Xform` under a rigid body.
#[derive(Serialize)]
pub struct Frame {
    pub path: String,
    /// The nearest rigid body above it.
    pub body: String,
    /// Local-to-world in stage space, laid out like [`crate::extract::Instance::matrix`].
    #[serde(serialize_with = "finite")]
    pub world: [f64; 16],
}

/// A prim with `PhysicsRigidBodyAPI`.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Body {
    pub path: String,
    pub kinematic: bool,
    /// `physics:mass` on the body, else the sum of its colliders' own masses
    /// when every collider has one; `None` otherwise (the engine computes it).
    pub mass: Option<Mass>,
    /// In the body's frame, stage units, as authored.
    #[serde(serialize_with = "finite")]
    pub center_of_mass: Option<[f32; 3]>,
    /// kg·m², about the principal axes.
    #[serde(serialize_with = "finite")]
    pub diagonal_inertia: Option<[f64; 3]>,
    /// `w, x, y, z`.
    #[serde(serialize_with = "finite")]
    pub principal_axes: Option<[f32; 4]>,
    /// Local-to-world in stage space, laid out like [`crate::extract::Instance::matrix`].
    #[serde(serialize_with = "finite")]
    pub world: [f64; 16],
    /// Collider prim paths.
    pub colliders: Vec<String>,
    /// Bodies held to this one by fixed joints, which move with it.
    pub attached: Vec<String>,
}

/// A body's mass in kilograms and where it comes from.
#[derive(Serialize)]
pub struct Mass {
    #[serde(serialize_with = "finite")]
    pub value: f64,
    /// `authored` on the body, or `colliders` summed from its colliders.
    pub source: &'static str,
}

/// A prim with `PhysicsCollisionAPI`.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Collider {
    pub path: String,
    /// The nearest rigid body at or above it; `None` for a static collider.
    pub body: Option<String>,
    /// The prim type as authored: `Mesh`, `Cube`, `Sphere`, `Capsule`, ...
    pub shape: String,
    /// `physics:approximation` on a mesh collider: `none`, `convexHull`, `sdf`, ...
    pub approximation: Option<String>,
    /// Drawn: false for an invisible or guide collision-only mesh.
    pub visual: bool,
    /// The physics material bound with the `physics` purpose.
    pub material: Option<String>,
    #[serde(serialize_with = "finite")]
    pub mass: Option<f64>,
    #[serde(serialize_with = "finite")]
    pub density: Option<f64>,
}

/// A material with `PhysicsMaterialAPI`.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PhysicsMaterial {
    pub path: String,
    #[serde(serialize_with = "finite")]
    pub density: Option<f64>,
    #[serde(serialize_with = "finite")]
    pub static_friction: Option<f32>,
    #[serde(serialize_with = "finite")]
    pub dynamic_friction: Option<f32>,
    #[serde(serialize_with = "finite")]
    pub restitution: Option<f32>,
}

/// A UsdPhysics joint between two bodies.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Joint {
    pub path: String,
    /// The prim type as authored, e.g. `PhysicsRevoluteJoint`.
    #[serde(rename = "type")]
    pub type_name: String,
    #[serde(flatten)]
    pub limits: Limits,
    /// `physics:jointEnabled`: a disabled joint constrains nothing.
    pub enabled: bool,
    /// Only when authored.
    pub display_name: Option<String>,
    /// The `physics:body0` / `physics:body1` targets as authored; `None` is the world.
    pub target0: Option<String>,
    pub target1: Option<String>,
    /// The rigid bodies it connects: the nearest rigid body at or above each
    /// target, else the topmost collider above it, else the target itself;
    /// `None` is the world.
    pub body0: Option<String>,
    pub body1: Option<String>,
    /// The joint frame on each target, local-to-world in stage space with the
    /// scale removed, laid out like [`crate::extract::Instance::matrix`].
    #[serde(serialize_with = "finite")]
    pub frame0: [f64; 16],
    #[serde(serialize_with = "finite")]
    pub frame1: [f64; 16],
    /// Computed from the two frames: where the authored poses put the joint,
    /// in degrees for a revolute joint, meters for a prismatic one, 0 for the others.
    #[serde(serialize_with = "finite")]
    pub rest: f64,
    /// A PhysX mimic joint: `position + gearing * reference + offset = 0`.
    pub mimic: Option<Mimic>,
    /// `PhysicsDriveAPI` instances: the motors or springs on the joint.
    pub drives: Vec<Drive>,
}

/// A `PhysicsDriveAPI:<axis>` instance, with the schema's fallbacks for what
/// is not authored and `None` for an infinite value, in SI units: positions in meters or
/// degrees; for a force drive (the default), forces in newtons and torques in
/// newton-meters (per meter or degree for stiffness, per meter or degree per
/// second for damping); for an acceleration drive, gains in 1/s² and 1/s and
/// the limit in m/s² or °/s².
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Drive {
    /// `linear`, `angular`, `transX`, `transY`, `transZ`, `rotX`, `rotY` or `rotZ`.
    pub axis: String,
    /// `force` or `acceleration`, as authored.
    #[serde(rename = "type")]
    pub drive_type: Option<String>,
    #[serde(serialize_with = "finite")]
    pub target_position: Option<f64>,
    #[serde(serialize_with = "finite")]
    pub target_velocity: Option<f64>,
    #[serde(serialize_with = "finite")]
    pub stiffness: Option<f64>,
    #[serde(serialize_with = "finite")]
    pub damping: Option<f64>,
    #[serde(serialize_with = "finite")]
    pub max_force: Option<f64>,
}

#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Limits {
    Revolute {
        axis: String,
        #[serde(serialize_with = "finite")]
        lower: Option<f32>,
        #[serde(serialize_with = "finite")]
        upper: Option<f32>,
    },
    Prismatic {
        axis: String,
        #[serde(serialize_with = "finite")]
        lower: Option<f32>,
        #[serde(serialize_with = "finite")]
        upper: Option<f32>,
    },
    Spherical {
        axis: String,
        #[serde(serialize_with = "finite")]
        cone0: Option<f32>,
        #[serde(serialize_with = "finite")]
        cone1: Option<f32>,
    },
    Distance {
        #[serde(serialize_with = "finite")]
        min: Option<f32>,
        #[serde(serialize_with = "finite")]
        max: Option<f32>,
    },
    Fixed,
    /// A `PhysicsJoint`, constrained per degree of freedom by `PhysicsLimitAPI`.
    Generic {
        dofs: Vec<Dof>,
    },
}

#[derive(Serialize)]
pub struct Dof {
    /// `transX`, `transY`, `transZ`, `rotX`, `rotY`, `rotZ` or `distance`.
    pub dof: String,
    /// Locked when `low > high`; `None` is unbounded on that side.
    #[serde(serialize_with = "finite")]
    pub low: Option<f32>,
    #[serde(serialize_with = "finite")]
    pub high: Option<f32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Mimic {
    pub reference: String,
    #[serde(serialize_with = "finite")]
    pub gearing: f32,
    #[serde(serialize_with = "finite")]
    pub offset: f32,
}

/// A UsdSemantics labels instance: `semantics:labels:<taxonomy>` on a prim.
#[derive(Serialize)]
pub struct Label {
    pub path: String,
    pub taxonomy: String,
    pub values: Vec<String>,
}

/// A variant selection on the default prim, e.g. `PhysX = Enabled`.
#[derive(Serialize)]
pub struct VariantSelection {
    pub prim: String,
    pub set: String,
    pub selection: String,
}

/// Collects physics from prims in traversal order (parents first).
pub struct Reader<'a> {
    stage: &'a Stage,
    kilograms_per_unit: f64,
    meters_per_unit: f64,
    /// Prim -> the index of the nearest rigid body at or above it.
    body_of: HashMap<sdf::Path, Option<usize>>,
    bindings: BindingCache,
    physics: Physics,
    labels: Vec<Label>,
}

impl<'a> Reader<'a> {
    pub fn new(stage: &'a Stage, meters_per_unit: f64) -> openusd::Result<Self> {
        let kilograms_per_unit = match stage.stage_metadata("kilogramsPerUnit")? {
            Some(Value::Double(v)) if v > 0.0 => v,
            Some(Value::Float(v)) if v > 0.0 => v as f64,
            _ => 1.0,
        };
        Ok(Self {
            stage,
            kilograms_per_unit,
            meters_per_unit,
            body_of: HashMap::new(),
            bindings: BindingCache::default(),
            physics: Physics::default(),
            labels: Vec::new(),
        })
    }

    /// Reads what `prim` authors. `drawn` is false for an invisible or guide prim.
    pub fn visit(
        &mut self,
        prim: &usd::Prim,
        ty: Option<&str>,
        drawn: bool,
        xforms: &mut XformCache,
    ) -> openusd::Result<()> {
        let path = prim.path();
        let inherited = path
            .parent()
            .and_then(|p| self.body_of.get(&p).copied())
            .flatten();
        let schemas = prim.api_schemas()?;
        let has = |name: &str| schemas.iter().any(|s| s.as_str() == name);

        let mut body = inherited;
        if has("PhysicsRigidBodyAPI") {
            self.physics.bodies.push(Body {
                path: path.as_str().to_owned(),
                kinematic: prim
                    .attribute("physics:kinematicEnabled")
                    .get::<bool>()
                    .ok()
                    .flatten()
                    .unwrap_or(false),
                mass: self.mass(prim).map(|value| Mass {
                    value,
                    source: "authored",
                }),
                center_of_mass: vec3(prim, "physics:centerOfMass"),
                diagonal_inertia: vec3(prim, "physics:diagonalInertia").map(|v| {
                    v.map(|c| c as f64 * self.kilograms_per_unit * self.meters_per_unit.powi(2))
                }),
                principal_axes: quat(prim, "physics:principalAxes"),
                world: world(xforms, prim),
                colliders: Vec::new(),
                attached: Vec::new(),
            });
            body = Some(self.physics.bodies.len() - 1);
        }
        self.body_of.insert(path.clone(), body);

        if let (Some(b), Some("Xform")) = (inherited, ty)
            && !has("PhysicsRigidBodyAPI")
        {
            self.physics.frames.push(Frame {
                path: path.as_str().to_owned(),
                body: self.physics.bodies[b].path.clone(),
                world: world(xforms, prim),
            });
        }

        if has("PhysicsCollisionAPI") {
            let material = bound_material(prim, "physics", &mut self.bindings)
                .ok()
                .flatten()
                .map(|p| p.as_str().to_owned());
            let shape = ty.unwrap_or("").to_owned();
            self.physics.colliders.push(Collider {
                path: path.as_str().to_owned(),
                body: body.map(|b| self.physics.bodies[b].path.clone()),
                approximation: (shape == "Mesh")
                    .then(|| token_attr(prim, "physics:approximation"))
                    .flatten(),
                shape,
                visual: drawn,
                material,
                mass: self.mass(prim),
                density: self.density(prim),
            });
            if let Some(b) = body {
                self.physics.bodies[b]
                    .colliders
                    .push(path.as_str().to_owned());
            }
        }

        if has("PhysicsArticulationRootAPI") {
            self.physics
                .articulation_roots
                .push(path.as_str().to_owned());
        }

        if has("PhysicsMaterialAPI") {
            self.physics.materials.push(PhysicsMaterial {
                path: path.as_str().to_owned(),
                density: self.density(prim),
                static_friction: float(prim, "physics:staticFriction"),
                dynamic_friction: float(prim, "physics:dynamicFriction"),
                restitution: float(prim, "physics:restitution"),
            });
        }

        for taxonomy in prim.api_schema_instance_names("SemanticsLabelsAPI")? {
            let values = match prim
                .attribute(format!("semantics:labels:{}", taxonomy.as_str()))
                .get::<Value>()
                .ok()
                .flatten()
            {
                Some(Value::TokenVec(v)) => v.iter().map(|t| t.as_str().to_owned()).collect(),
                Some(Value::StringVec(v)) => v,
                _ => continue,
            };
            self.labels.push(Label {
                path: path.as_str().to_owned(),
                taxonomy: taxonomy.as_str().to_owned(),
                values,
            });
        }
        Ok(())
    }

    /// The physics, with the joints upstream's parse reports, each body's mass
    /// completed from its colliders and its fixed attachments listed, and the labels.
    pub fn finish(mut self) -> openusd::Result<(Physics, Vec<Label>)> {
        let options = ParseOptions {
            include: vec![sdf::Path::abs_root()],
            ..ParseOptions::default()
        };
        let parsed = schema::parse(self.stage, &options).map_err(|e| match e {
            SchemaError::Core(e) => e,
            e => openusd::Error::Convert(Box::new(e)),
        })?;
        let mut xforms = XformCache::new(None);
        for joint in &parsed.joints {
            let joint = self.joint(joint, &mut xforms)?;
            self.physics.joints.push(joint);
        }
        let physics = &mut self.physics;
        let collider_mass: HashMap<&str, f64> = physics
            .colliders
            .iter()
            .filter_map(|c| Some((c.path.as_str(), c.mass?)))
            .collect();
        for body in &mut physics.bodies {
            if body.mass.is_some() || body.colliders.is_empty() {
                continue;
            }
            // Only a complete sum: a collider without a mass leaves the body's unknown.
            let masses: Option<Vec<f64>> = body
                .colliders
                .iter()
                .map(|c| collider_mass.get(c.as_str()).copied())
                .collect();
            body.mass = masses.map(|m| Mass {
                value: m.iter().sum(),
                source: "colliders",
            });
        }
        let index: HashMap<String, usize> = physics
            .bodies
            .iter()
            .enumerate()
            .map(|(i, b)| (b.path.clone(), i))
            .collect();
        for joint in physics.joints.iter().filter(|j| j.enabled) {
            if let (Limits::Fixed, Some(b0), Some(b1)) = (&joint.limits, &joint.body0, &joint.body1)
                && let Some(&i) = index.get(b0)
            {
                physics.bodies[i].attached.push(b1.clone());
            }
        }
        Ok((self.physics, self.labels))
    }

    fn mass(&self, prim: &usd::Prim) -> Option<f64> {
        float(prim, "physics:mass")
            .filter(|m| *m > 0.0)
            .map(|m| m as f64 * self.kilograms_per_unit)
    }

    /// kg/m³ from kilograms per cubic stage unit.
    fn density(&self, prim: &usd::Prim) -> Option<f64> {
        float(prim, "physics:density")
            .filter(|d| *d > 0.0)
            .map(|d| d as f64 * self.kilograms_per_unit / self.meters_per_unit.powi(3))
    }

    /// A drive in SI units: lengths scale by metersPerUnit, masses by
    /// kilogramsPerUnit; angles stay in degrees.
    fn drive(&self, axis: &str, drive: &desc::Drive) -> Drive {
        let (kg, m) = (self.kilograms_per_unit, self.meters_per_unit);
        let length = if matches!(axis, "linear" | "transX" | "transY" | "transZ") {
            m
        } else {
            1.0
        };
        // A force drive's gains are force per length (kg/s², kg/s) or torque per
        // degree (kg·m²/s² per degree), and its limit a force or torque. An
        // acceleration drive's gains carry no mass or length, and its limit is an
        // acceleration (m/s² or °/s²).
        let (gain, force) = if drive.acceleration {
            (1.0, length)
        } else {
            (kg * m * m / length / length, kg * m * m / length)
        };
        let scaled = |v: f32, by: f64| v.is_finite().then_some(v as f64 * by);
        Drive {
            axis: axis.to_owned(),
            drive_type: Some(
                if drive.acceleration {
                    "acceleration"
                } else {
                    "force"
                }
                .to_owned(),
            ),
            target_position: scaled(drive.target_position, length),
            target_velocity: scaled(drive.target_velocity, length),
            stiffness: scaled(drive.stiffness, gain),
            damping: scaled(drive.damping, gain),
            max_force: scaled(drive.force_limit, force),
        }
    }

    fn joint(&self, joint: &desc::Joint, xforms: &mut XformCache) -> openusd::Result<Joint> {
        let prim = self.stage.prim(&joint.path)?;
        let ty = prim
            .type_name()?
            .map(|t| t.as_str().to_owned())
            .unwrap_or_default();
        // Each anchor placed on its body (the world for none), without scale.
        let mut frame = |body: &Option<sdf::Path>,
                         pos: Vec3f,
                         rot: Quatf|
         -> openusd::Result<[f64; 16]> {
            let body = match body {
                Some(path) => Mat4d(world(xforms, &self.stage.prim(path)?)).remove_scale_shear(),
                None => Mat4d::IDENTITY,
            };
            Ok((Mat4d::from_trs(pos, rot, gf::vec3f(1.0, 1.0, 1.0)) * body).0)
        };
        let frame0 = frame(&joint.body0, joint.local_pos0, joint.local_rot0)?;
        let frame1 = frame(&joint.body1, joint.local_pos1, joint.local_rot1)?;
        // Translation limits and positions in meters; rotations stay in degrees.
        let m = self.meters_per_unit;
        let meters = |v: Option<f32>| v.map(|v| (v as f64 * m) as f32);
        let mut drives = Vec::new();
        let limits = match &joint.kind {
            desc::JointKind::Revolute { axis, limit, drive } => {
                drives.extend(drive.map(|d| self.drive("angular", &d)));
                let (lower, upper) = bounds(limit);
                Limits::Revolute {
                    axis: axis.as_token().to_owned(),
                    lower,
                    upper,
                }
            }
            desc::JointKind::Prismatic { axis, limit, drive } => {
                drives.extend(drive.map(|d| self.drive("linear", &d)));
                let (lower, upper) = bounds(limit);
                Limits::Prismatic {
                    axis: axis.as_token().to_owned(),
                    lower: meters(lower),
                    upper: meters(upper),
                }
            }
            desc::JointKind::Spherical { axis, limit } => Limits::Spherical {
                axis: axis.as_token().to_owned(),
                cone0: limit.enabled.then_some(limit.lower),
                cone1: limit.enabled.then_some(limit.upper),
            },
            desc::JointKind::Distance {
                min_enabled,
                max_enabled,
                limit,
            } => Limits::Distance {
                min: meters(min_enabled.then_some(limit.lower)),
                max: meters(max_enabled.then_some(limit.upper)),
            },
            desc::JointKind::Fixed => Limits::Fixed,
            desc::JointKind::D6 {
                limits,
                drives: dof_drives,
            } => {
                drives.extend(
                    dof_drives
                        .iter()
                        .map(|(dof, d)| self.drive(dof.as_token(), d)),
                );
                Limits::Generic {
                    dofs: limits
                        .iter()
                        .filter(|(_, limit)| limit.enabled)
                        .map(|(dof, limit)| {
                            let (low, high) = bounds(limit);
                            let rotation = dof.as_token().starts_with("rot");
                            Dof {
                                dof: dof.as_token().to_owned(),
                                low: if rotation { low } else { meters(low) },
                                high: if rotation { high } else { meters(high) },
                            }
                        })
                        .collect(),
                }
            }
            // Parse reports custom joints only for the types its options name, and ours name none.
            desc::JointKind::Custom => Limits::Generic { dofs: Vec::new() },
        };
        let rest = match &limits {
            Limits::Revolute { axis, .. } => rest_angle(&frame0, &frame1, axis_index(axis)),
            Limits::Prismatic { axis, .. } => {
                let k = axis_index(axis);
                (0..3)
                    .map(|i| (frame1[12 + i] - frame0[12 + i]) * frame0[4 * k + i])
                    .sum::<f64>()
                    * m
            }
            _ => 0.0,
        };
        let mimic = prim
            .api_schemas()?
            .iter()
            .find_map(|s| {
                s.as_str()
                    .strip_prefix("PhysxMimicJointAPI:")
                    .map(str::to_owned)
            })
            .and_then(|dof| {
                let reference = prim
                    .relationship(format!("physxMimicJoint:{dof}:referenceJoint"))
                    .targets()
                    .ok()?
                    .into_iter()
                    .next()?;
                Some(Mimic {
                    reference: reference.as_str().to_owned(),
                    gearing: float(&prim, &format!("physxMimicJoint:{dof}:gearing")).unwrap_or(1.0),
                    // In the joint's own units: meters for a prismatic joint, whatever the instance is named.
                    offset: float(&prim, &format!("physxMimicJoint:{dof}:offset"))
                        .map(|v| match ty.as_str() {
                            "PhysicsPrismaticJoint" => (v as f64 * m) as f32,
                            _ => v,
                        })
                        .unwrap_or(0.0),
                })
            });
        let path = |p: &Option<sdf::Path>| p.as_ref().map(|p| p.as_str().to_owned());
        Ok(Joint {
            path: joint.path.as_str().to_owned(),
            type_name: ty,
            limits,
            enabled: joint.enabled,
            display_name: prim.metadata::<String>("displayName").ok().flatten(),
            target0: path(&joint.rel0),
            target1: path(&joint.rel1),
            body0: path(&joint.body0).or_else(|| path(&joint.rel0)),
            body1: path(&joint.body1).or_else(|| path(&joint.rel1)),
            frame0,
            frame1,
            rest,
            mimic,
            drives,
        })
    }
}

/// Each side of `limit` that bounds the joint: finite and inside the schema's
/// sentinel, past which a limit means none.
fn bounds(limit: &desc::Limit) -> (Option<f32>, Option<f32>) {
    let sentinel = desc::Limit::SENTINEL;
    (
        (limit.lower.is_finite() && limit.lower > -sentinel).then_some(limit.lower),
        (limit.upper.is_finite() && limit.upper < sentinel).then_some(limit.upper),
    )
}

/// The variant selections on the stage's default prim, where an asset offers
/// its physics engines, e.g. `PhysX = Enabled`.
pub fn variant_selections(stage: &Stage) -> openusd::Result<Vec<VariantSelection>> {
    let Some(name) = stage.default_prim() else {
        return Ok(Vec::new());
    };
    let path = sdf::Path::new(&format!("/{}", name.as_str()))?;
    let prim = stage.prim(&path)?;
    Ok(prim
        .variant_sets()
        .selections()?
        .into_iter()
        .map(|(set, selection)| VariantSelection {
            prim: path.as_str().to_owned(),
            set,
            selection,
        })
        .collect())
}

fn world(xforms: &mut XformCache, prim: &usd::Prim) -> [f64; 16] {
    xforms
        .local_to_world_transform(prim)
        .unwrap_or(Mat4d::IDENTITY)
        .0
}

fn float(prim: &usd::Prim, name: &str) -> Option<f32> {
    let v = match prim.attribute(name).get::<Value>().ok()?? {
        Value::Float(v) => v,
        Value::Double(v) => v as f32,
        Value::Half(v) => f32::from(v),
        _ => return None,
    };
    v.is_finite().then_some(v)
}

fn vec3(prim: &usd::Prim, name: &str) -> Option<[f32; 3]> {
    let v = prim.attribute(name).get::<Vec3f>().ok()??;
    Some([v.x, v.y, v.z])
}

fn quat(prim: &usd::Prim, name: &str) -> Option<[f32; 4]> {
    let q = prim.attribute(name).get::<Quatf>().ok()??;
    Some([q.w, q.x, q.y, q.z])
}

fn axis_index(axis: &str) -> usize {
    match axis {
        "Y" => 1,
        "Z" => 2,
        _ => 0,
    }
}

/// The angle in degrees, about axis `k` of `frame0`, from frame0 to frame1.
fn rest_angle(frame0: &[f64; 16], frame1: &[f64; 16], k: usize) -> f64 {
    let (u, v) = ((k + 1) % 3, (k + 2) % 3);
    let row = |m: &[f64; 16], i: usize| [m[4 * i], m[4 * i + 1], m[4 * i + 2]];
    let dot = |a: [f64; 3], b: [f64; 3]| a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    let moved = row(frame1, u);
    dot(moved, row(frame0, v))
        .atan2(dot(moved, row(frame0, u)))
        .to_degrees()
}
