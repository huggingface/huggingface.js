//! Triangle meshes for the implicit UsdGeom gprims: `Cube`, `Sphere`,
//! `Cylinder`, `Cone`, `Capsule` and `Plane`, with the schema's sizes, axis and
//! defaults. Tessellation is fixed and low-poly (32 segments around); normals
//! are smooth on curved surfaces and flat on faces and caps. No UVs: Pixar's
//! renderer gives implicit gprims none either.

use std::f32::consts::{FRAC_PI_2, PI, TAU};

use openusd::sdf::Value;
use openusd::usd;

use crate::extract::{Geometry, Group, bounds, token_attr};

/// Segments around the axis of a curved surface.
const SEGMENTS: usize = 32;
/// Bands from pole to pole of a sphere (even, so the equator is a ring).
const BANDS: usize = 16;

pub fn is_implicit(ty: &str) -> bool {
    matches!(
        ty,
        "Cube" | "Sphere" | "Cylinder" | "Cone" | "Capsule" | "Plane"
    )
}

/// The mesh of an implicit gprim of type `ty`; `None` for a zero-sized one.
pub fn read(prim: &usd::Prim, ty: &str) -> Option<Geometry> {
    let size = |name: &str, default: f32| match prim.attribute(name).get::<Value>() {
        Ok(Some(Value::Double(v))) => v as f32,
        Ok(Some(Value::Float(v))) => v,
        _ => default,
    };
    let axis = match token_attr(prim, "axis").as_deref() {
        Some("X") => 0,
        Some("Y") => 1,
        _ => 2,
    };
    let mut mesh = Mesh::default();
    match ty {
        "Cube" => mesh.cube(size("size", 2.0) / 2.0),
        "Sphere" => {
            let r = size("radius", 1.0);
            mesh.lathe(&arc(r, 0.0, PI, BANDS, 0.0));
        }
        "Cylinder" => {
            let (r, h) = (size("radius", 1.0), size("height", 2.0) / 2.0);
            let side = [(r, -h, 1.0, 0.0), (r, h, 1.0, 0.0)];
            mesh.lathe(&[cap(r, -h), side.to_vec(), cap(r, h)].concat());
            mesh.align(axis);
        }
        "Cone" => {
            let (r, h) = (size("radius", 1.0), size("height", 2.0) / 2.0);
            let n = (2.0 * h).hypot(r);
            let (nr, nz) = (2.0 * h / n, r / n);
            mesh.lathe(&[cap(r, -h), vec![(r, -h, nr, nz), (0.0, h, nr, nz)]].concat());
            mesh.align(axis);
        }
        "Capsule" => {
            let (r, h) = (size("radius", 0.5), size("height", 1.0) / 2.0);
            let half = BANDS / 2;
            mesh.lathe(
                &[
                    arc(r, 0.0, FRAC_PI_2, half, -h),
                    arc(r, FRAC_PI_2, PI, half, h),
                ]
                .concat(),
            );
            mesh.align(axis);
        }
        "Plane" => {
            let (w, l) = (size("width", 2.0) / 2.0, size("length", 2.0) / 2.0);
            mesh.quad([0.0; 3], [w, 0.0, 0.0], [0.0, l, 0.0], [0.0, 0.0, 1.0]);
            // Width runs along Z for an X axis and along X otherwise; length
            // along the remaining axis (as Pixar's extents put them).
            match axis {
                0 => mesh.remap([2, 1, 0]),
                1 => mesh.remap([0, 2, 1]),
                _ => {}
            }
        }
        _ => return None,
    }
    mesh.into_geometry(prim)
}

/// A profile point: distance from the axis, height, and the normal's radial
/// and axial parts.
type Row = (f32, f32, f32, f32);

/// A circular arc of radius `r` centered at height `z`, from angle `from` to
/// `to` measured from the bottom pole.
fn arc(r: f32, from: f32, to: f32, bands: usize, z: f32) -> Vec<Row> {
    (0..=bands)
        .map(|i| {
            let a = from + (to - from) * i as f32 / bands as f32;
            let (s, c) = a.sin_cos();
            // sin(PI) is not quite 0: put the pole exactly on the axis.
            let s = if s.abs() < 1e-6 { 0.0 } else { s };
            (r * s, z - r * c, s, -c)
        })
        .collect()
}

/// A flat disc at height `z`, facing away from the middle; listed bottom to
/// top like the rest of a profile.
fn cap(r: f32, z: f32) -> Vec<Row> {
    let n = z.signum();
    if n < 0.0 {
        vec![(0.0, z, 0.0, n), (r, z, 0.0, n)]
    } else {
        vec![(r, z, 0.0, n), (0.0, z, 0.0, n)]
    }
}

#[derive(Default)]
struct Mesh {
    positions: Vec<[f32; 3]>,
    normals: Vec<[f32; 3]>,
    indices: Vec<u32>,
}

impl Mesh {
    /// A surface of revolution about +Z through `profile`, listed from bottom
    /// to top so the triangles face outward.
    fn lathe(&mut self, profile: &[Row]) {
        let base = self.positions.len() as u32;
        for &(radius, z, nr, nz) in profile {
            for j in 0..SEGMENTS {
                let (s, c) = (TAU * j as f32 / SEGMENTS as f32).sin_cos();
                self.positions.push([radius * c, radius * s, z]);
                self.normals.push([nr * c, nr * s, nz]);
            }
        }
        let at = |row: usize, j: usize| base + (row * SEGMENTS + j % SEGMENTS) as u32;
        for (row, pair) in profile.windows(2).enumerate() {
            // Where a cap meets a side the rows coincide (only normals differ).
            if (pair[0].0, pair[0].1) == (pair[1].0, pair[1].1) {
                continue;
            }
            for j in 0..SEGMENTS {
                let (a0, a1, b0, b1) = (
                    at(row, j),
                    at(row, j + 1),
                    at(row + 1, j),
                    at(row + 1, j + 1),
                );
                // A ring on the axis is a single point: one triangle per segment.
                if pair[0].0 != 0.0 {
                    self.indices.extend([a0, a1, b1]);
                }
                if pair[1].0 != 0.0 {
                    self.indices.extend([a0, b1, b0]);
                }
            }
        }
    }

    /// A cube of half-size `h`: six flat faces.
    fn cube(&mut self, h: f32) {
        for k in 0..3 {
            let (mut u, mut v, mut n) = ([0.0; 3], [0.0; 3], [0.0; 3]);
            u[(k + 1) % 3] = h;
            v[(k + 2) % 3] = h;
            for sign in [1.0, -1.0] {
                n[k] = sign;
                let center = n.map(|c| c * h);
                // Swapping u and v turns the face to look the other way.
                if sign > 0.0 {
                    self.quad(center, u, v, n)
                } else {
                    self.quad(center, v, u, n)
                }
            }
        }
    }

    /// A rectangle `center ± u ± v` facing `n` (= u × v direction).
    fn quad(&mut self, center: [f32; 3], u: [f32; 3], v: [f32; 3], n: [f32; 3]) {
        let base = self.positions.len() as u32;
        for (su, sv) in [(-1.0, -1.0), (1.0, -1.0), (1.0, 1.0), (-1.0, 1.0)] {
            self.positions
                .push([0, 1, 2].map(|k| center[k] + su * u[k] + sv * v[k]));
            self.normals.push(n);
        }
        self.indices
            .extend([base, base + 1, base + 2, base, base + 2, base + 3]);
    }

    /// Turns a mesh built about +Z to run along `axis` (a rotation).
    fn align(&mut self, axis: usize) {
        match axis {
            0 => self.remap([2, 0, 1]),
            1 => self.remap([1, 2, 0]),
            _ => {}
        }
    }

    /// Moves coordinate `from[k]` to axis `k`. A swap of two axes mirrors the
    /// mesh, so its triangles are turned back to face outward.
    fn remap(&mut self, from: [usize; 3]) {
        for p in self.positions.iter_mut().chain(self.normals.iter_mut()) {
            *p = from.map(|k| p[k]);
        }
        let mirrored = from == [2, 1, 0] || from == [0, 2, 1] || from == [1, 0, 2];
        if mirrored {
            for tri in self.indices.chunks_exact_mut(3) {
                tri.swap(1, 2);
            }
        }
    }

    fn into_geometry(self, prim: &usd::Prim) -> Option<Geometry> {
        if self.indices.is_empty() || self.positions.iter().flatten().all(|&c| c == 0.0) {
            return None;
        }
        let positions: Vec<f32> = self.positions.into_iter().flatten().collect();
        Some(Geometry {
            source: prim.path().as_str().to_owned(),
            bounds: bounds(&positions),
            positions,
            normals: self.normals.into_iter().flatten().collect(),
            uvs: Vec::new(),
            colors: Vec::new(),
            groups: vec![Group {
                start: 0,
                count: self.indices.len() as u32,
                subset: None,
            }],
            indices: self.indices,
        })
    }
}
