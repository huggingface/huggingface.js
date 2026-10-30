//! What a stage authors for simulation (UsdPhysics rigid bodies, colliders,
//! physics materials and joints, plus UsdSemantics labels), read as authored:
//! nothing is estimated. Masses are in kilograms, densities in kg/m³, inertia
//! in kg·m², joint limits and positions in meters or degrees; positions and
//! matrices stay in stage space, like the meshes' own matrices.

use std::collections::HashMap;

use openusd::gf::{Matrix4d, Quatf, Vec3f};
use openusd::sdf::{self, Value};
use openusd::usd::{self, Stage};
use openusd_schemas::geom::XformCache;
use openusd_schemas::shade::MaterialBindingAPI;
use serde::Serialize;

use crate::extract::token_attr;
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
    /// Only when authored.
    pub display_name: Option<String>,
    /// The `physics:body0` / `physics:body1` targets as authored; `None` is the world.
    pub target0: Option<String>,
    pub target1: Option<String>,
    /// The rigid bodies it connects: the nearest rigid body at or above each
    /// target, else the target itself; `None` is the world.
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

/// A `PhysicsDriveAPI:<axis>` instance, in SI units: positions in meters or
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

        if has("PhysicsCollisionAPI") {
            let material = MaterialBindingAPI::from_prim_unchecked(prim.clone())
                .compute_bound_material("physics")
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

        if let Some(ty) = ty
            && ty.starts_with("Physics")
            && ty.ends_with("Joint")
        {
            let joint = self.joint(prim, ty, &schemas, xforms)?;
            self.physics.joints.push(joint);
        }
        Ok(())
    }

    /// The physics, with each body's mass completed from its colliders and
    /// its fixed attachments listed, and the labels.
    pub fn finish(mut self) -> (Physics, Vec<Label>) {
        // A joint may come before the bodies it names, so its targets resolve now.
        let resolved: Vec<_> = self
            .physics
            .joints
            .iter()
            .map(|j| (self.resolve(&j.body0), self.resolve(&j.body1)))
            .collect();
        for (joint, (body0, body1)) in self.physics.joints.iter_mut().zip(resolved) {
            (joint.body0, joint.body1) = (body0, body1);
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
        for joint in &physics.joints {
            if let (Limits::Fixed, Some(b0), Some(b1)) = (&joint.limits, &joint.body0, &joint.body1)
                && let Some(&i) = index.get(b0)
            {
                physics.bodies[i].attached.push(b1.clone());
            }
        }
        (self.physics, self.labels)
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

    /// The rigid body a `physics:body` target belongs to: the nearest at or
    /// above it, else the target itself.
    fn resolve(&self, target: &Option<String>) -> Option<String> {
        let target = target.as_ref()?;
        let Ok(path) = sdf::Path::new(target) else {
            return Some(target.clone());
        };
        Some(
            std::iter::successors(Some(path), |p| p.parent())
                .find_map(|p| self.body_of.get(&p).copied().flatten())
                .map_or_else(|| target.clone(), |b| self.physics.bodies[b].path.clone()),
        )
    }

    /// A drive in SI units: lengths scale by metersPerUnit, masses by
    /// kilogramsPerUnit; angles stay in degrees.
    fn drive(&self, prim: &usd::Prim, axis: &str) -> Drive {
        let attr = |name: &str| float(prim, &format!("drive:{axis}:physics:{name}")).map(f64::from);
        let drive_type = token_attr(prim, &format!("drive:{axis}:physics:type"));
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
        let (gain, force) = if drive_type.as_deref() == Some("acceleration") {
            (1.0, length)
        } else {
            (kg * m * m / length / length, kg * m * m / length)
        };
        Drive {
            axis: axis.to_owned(),
            drive_type,
            target_position: attr("targetPosition").map(|v| v * length),
            target_velocity: attr("targetVelocity").map(|v| v * length),
            stiffness: attr("stiffness").map(|v| v * gain),
            damping: attr("damping").map(|v| v * gain),
            max_force: attr("maxForce").map(|v| v * force),
        }
    }

    fn joint(
        &self,
        prim: &usd::Prim,
        ty: &str,
        schemas: &[openusd::tf::Token],
        xforms: &mut XformCache,
    ) -> openusd::Result<Joint> {
        let target = |name: &str| -> openusd::Result<Option<sdf::Path>> {
            Ok(prim.relationship(name).targets()?.into_iter().next())
        };
        let target0 = target("physics:body0")?;
        let target1 = target("physics:body1")?;
        let mut world_of = |target: &Option<sdf::Path>| -> openusd::Result<[f64; 16]> {
            Ok(match target {
                Some(path) => world(xforms, &self.stage.prim(path)?),
                None => Matrix4d::IDENTITY.0,
            })
        };
        let frame0 = rigid_frame(
            &world_of(&target0)?,
            vec3(prim, "physics:localPos0").unwrap_or([0.0; 3]),
            quat(prim, "physics:localRot0").unwrap_or([1.0, 0.0, 0.0, 0.0]),
        );
        let frame1 = rigid_frame(
            &world_of(&target1)?,
            vec3(prim, "physics:localPos1").unwrap_or([0.0; 3]),
            quat(prim, "physics:localRot1").unwrap_or([1.0, 0.0, 0.0, 0.0]),
        );
        // The schema's tokens; anything else falls back to the schema's default, X.
        let axis = || match token_attr(prim, "physics:axis").as_deref() {
            Some(axis @ ("Y" | "Z")) => axis.to_owned(),
            _ => "X".to_owned(),
        };
        // Translation limits and positions in meters; rotations stay in degrees.
        let m = self.meters_per_unit;
        let meters = |v: Option<f32>| v.map(|v| (v as f64 * m) as f32);
        let limits = match ty {
            "PhysicsRevoluteJoint" => Limits::Revolute {
                axis: axis(),
                lower: float(prim, "physics:lowerLimit"),
                upper: float(prim, "physics:upperLimit"),
            },
            "PhysicsPrismaticJoint" => Limits::Prismatic {
                axis: axis(),
                lower: meters(float(prim, "physics:lowerLimit")),
                upper: meters(float(prim, "physics:upperLimit")),
            },
            "PhysicsSphericalJoint" => Limits::Spherical {
                axis: axis(),
                cone0: float(prim, "physics:coneAngle0Limit"),
                cone1: float(prim, "physics:coneAngle1Limit"),
            },
            "PhysicsDistanceJoint" => Limits::Distance {
                min: meters(float(prim, "physics:minDistance")),
                max: meters(float(prim, "physics:maxDistance")),
            },
            "PhysicsFixedJoint" => Limits::Fixed,
            _ => Limits::Generic {
                dofs: prim
                    .api_schema_instance_names("PhysicsLimitAPI")?
                    .into_iter()
                    .filter_map(|dof| {
                        let dof = dof.as_str();
                        let scale = |v| if dof.starts_with("rot") { v } else { meters(v) };
                        let low = scale(float(prim, &format!("limit:{dof}:physics:low")));
                        let high = scale(float(prim, &format!("limit:{dof}:physics:high")));
                        (low.is_some() || high.is_some()).then(|| Dof {
                            dof: dof.to_owned(),
                            low,
                            high,
                        })
                    })
                    .collect(),
            },
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
        let mimic = schemas
            .iter()
            .find_map(|s| s.as_str().strip_prefix("PhysxMimicJointAPI:"))
            .and_then(|dof| {
                let reference = prim
                    .relationship(format!("physxMimicJoint:{dof}:referenceJoint"))
                    .targets()
                    .ok()?
                    .into_iter()
                    .next()?;
                Some(Mimic {
                    reference: reference.as_str().to_owned(),
                    gearing: float(prim, &format!("physxMimicJoint:{dof}:gearing")).unwrap_or(1.0),
                    // In the joint's own units: meters for a prismatic joint, whatever the instance is named.
                    offset: float(prim, &format!("physxMimicJoint:{dof}:offset"))
                        .map(|v| match ty {
                            "PhysicsPrismaticJoint" => (v as f64 * m) as f32,
                            _ => v,
                        })
                        .unwrap_or(0.0),
                })
            });
        let target0 = target0.map(|t| t.as_str().to_owned());
        let target1 = target1.map(|t| t.as_str().to_owned());
        let drives = prim
            .api_schema_instance_names("PhysicsDriveAPI")?
            .into_iter()
            .map(|axis| self.drive(prim, axis.as_str()))
            .collect();
        Ok(Joint {
            path: prim.path().as_str().to_owned(),
            type_name: ty.to_owned(),
            limits,
            display_name: prim.get_metadata::<String>("displayName").ok().flatten(),
            // The targets for now: [`Reader::finish`] resolves them to bodies once every prim is read.
            body0: target0.clone(),
            body1: target1.clone(),
            target0,
            target1,
            frame0,
            frame1,
            rest,
            mimic,
            drives,
        })
    }
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
        .get_all_variant_selections()?
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
        .unwrap_or(Matrix4d::IDENTITY)
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

/// The world matrix of a joint frame (position and rotation in a body whose
/// local-to-world is `world`), orthonormalized so lengths along it are in
/// stage units whatever the body's scale. Row-vector convention, row-major.
fn rigid_frame(world: &[f64; 16], pos: [f32; 3], rot: [f32; 4]) -> [f64; 16] {
    let [w, x, y, z] = rot.map(|v| v as f64);
    let n = (w * w + x * x + y * y + z * z)
        .sqrt()
        .max(f64::MIN_POSITIVE);
    let [w, x, y, z] = [w / n, x / n, y / n, z / n];
    // The frame's axes in the body: the rotated basis vectors.
    let local = [
        [
            1.0 - 2.0 * (y * y + z * z),
            2.0 * (x * y + w * z),
            2.0 * (x * z - w * y),
        ],
        [
            2.0 * (x * y - w * z),
            1.0 - 2.0 * (x * x + z * z),
            2.0 * (y * z + w * x),
        ],
        [
            2.0 * (x * z + w * y),
            2.0 * (y * z - w * x),
            1.0 - 2.0 * (x * x + y * y),
        ],
    ];
    let dir = |d: [f64; 3]| -> [f64; 3] {
        [0, 1, 2].map(|k| d[0] * world[k] + d[1] * world[4 + k] + d[2] * world[8 + k])
    };
    let p = pos.map(|v| v as f64);
    let origin = [0, 1, 2].map(|k| dir(p)[k] + world[12 + k]);
    // Gram-Schmidt: x, then y without its x part, then z = x × y.
    let unit = |v: [f64; 3]| {
        let l = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
        if l > 0.0 { v.map(|c| c / l) } else { v }
    };
    let dot = |a: [f64; 3], b: [f64; 3]| a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    let ax = unit(dir(local[0]));
    let y0 = dir(local[1]);
    let ay = unit([0, 1, 2].map(|k| y0[k] - dot(y0, ax) * ax[k]));
    let az = [
        ax[1] * ay[2] - ax[2] * ay[1],
        ax[2] * ay[0] - ax[0] * ay[2],
        ax[0] * ay[1] - ax[1] * ay[0],
    ];
    [
        ax[0], ax[1], ax[2], 0.0, ay[0], ay[1], ay[2], 0.0, az[0], az[1], az[2], 0.0, origin[0],
        origin[1], origin[2], 1.0,
    ]
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
