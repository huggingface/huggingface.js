//! UsdPhysics and UsdSemantics as the scene reports them, read as authored.

mod common;

use serde_json::{Value, json};

fn physics(root: &str) -> Value {
    let loaded =
        common::compose(root, |p| std::fs::read(p).ok()).unwrap_or_else(|e| panic!("{root}: {e}"));
    let scene = &loaded.scene;
    json!({
        "physics": serde_json::to_value(&scene.physics).unwrap(),
        "labels": serde_json::to_value(&scene.labels).unwrap(),
        "variantSelections": serde_json::to_value(&scene.variant_selections).unwrap(),
    })
}

fn fixture() -> Value {
    let path = std::fs::canonicalize(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../fixtures/physics.usda"
    ))
    .expect("physics fixture");
    physics(&path.to_string_lossy())
}

fn find<'a>(list: &'a Value, path: &str) -> &'a Value {
    list.as_array()
        .unwrap()
        .iter()
        .find(|v| v["path"] == path)
        .unwrap_or_else(|| panic!("{path} not in {list}"))
}

fn close(value: &Value, expected: f64) -> bool {
    (value.as_f64().unwrap() - expected).abs() < 1e-4
}

#[test]
fn masses_are_kilograms_and_read_as_authored() {
    let out = fixture();
    let bodies = &out["physics"]["bodies"];
    // kilogramsPerUnit = 0.001: grams in the file.
    let body = find(bodies, "/Cabinet/Body");
    assert!(close(&body["mass"]["value"], 100.0));
    assert_eq!(body["mass"]["source"], "authored");
    assert_eq!(body["centerOfMass"], json!([0.0, 0.0, 50.0]));
    // No mass on the drawer: the sum of its colliders' own masses.
    let drawer = find(bodies, "/Cabinet/Drawer");
    assert!(close(&drawer["mass"]["value"], 2.5));
    assert_eq!(drawer["mass"]["source"], "colliders");
    // Nothing authored: nothing guessed.
    let door = find(bodies, "/Cabinet/Door");
    // One of the door's colliders has a mass, the other not: no partial sum.
    assert_eq!(door["mass"], Value::Null);
}

#[test]
fn colliders_know_their_body_shape_and_material() {
    let out = fixture();
    let colliders = &out["physics"]["colliders"];
    let shell = find(colliders, "/Cabinet/Body/Shell");
    assert_eq!(shell["body"], "/Cabinet/Body");
    assert_eq!(shell["shape"], "Cube");
    assert_eq!(shell["approximation"], Value::Null);
    let box_ = find(colliders, "/Cabinet/Drawer/Box");
    assert_eq!(box_["approximation"], "convexHull");
    assert_eq!(box_["material"], "/Cabinet/Materials/Plastic");
    assert_eq!(box_["visual"], true);
    // A guide collision mesh is a collider the viewer does not draw.
    let hull = find(colliders, "/Cabinet/Drawer/Hull");
    assert_eq!(hull["visual"], false);
    // A collider under no rigid body is static.
    assert_eq!(find(colliders, "/Cabinet/Floor")["body"], Value::Null);
    let drawer = find(&out["physics"]["bodies"], "/Cabinet/Drawer");
    assert_eq!(
        drawer["colliders"],
        json!(["/Cabinet/Drawer/Box", "/Cabinet/Drawer/Hull"])
    );
}

#[test]
fn physics_materials_are_in_si_units() {
    let out = fixture();
    let plastic = find(&out["physics"]["materials"], "/Cabinet/Materials/Plastic");
    // 0.95 g/cm³ (kilogramsPerUnit 0.001, metersPerUnit 0.01) is 950 kg/m³.
    assert!(close(&plastic["density"], 950.0));
    assert!(close(&plastic["staticFriction"], 0.4));
    assert!(close(&plastic["dynamicFriction"], 0.3));
    assert!(close(&plastic["restitution"], 0.5));
}

#[test]
fn labels_and_variant_selections() {
    let out = fixture();
    assert_eq!(
        out["labels"],
        json!([
            { "path": "/Cabinet", "taxonomy": "wikidata_class", "values": ["cabinet"] },
            { "path": "/Cabinet/Materials/Plastic", "taxonomy": "material", "values": ["plastic"] },
        ])
    );
    assert_eq!(
        out["variantSelections"],
        json!([{ "prim": "/Cabinet", "set": "Engine", "selection": "PhysX" }])
    );
}

#[test]
fn joints_report_limits_by_kind() {
    let out = fixture();
    let joints = &out["physics"]["joints"];
    let slide = find(joints, "/Cabinet/Joints/Slide");
    assert_eq!(slide["kind"], "prismatic");
    assert_eq!(slide["axis"], "X");
    // Centimeters in the file, meters out.
    assert!(
        close(&slide["lower"], 0.0) && close(&slide["upper"], 0.3),
        "{slide}"
    );
    assert_eq!(slide["displayName"], "Top drawer");
    // A target inside a rigid body is that body.
    assert_eq!(slide["body0"], "/Cabinet/Body");
    assert_eq!(slide["body1"], "/Cabinet/Drawer");

    let hinge = find(joints, "/Cabinet/Joints/Hinge");
    assert_eq!(hinge["kind"], "revolute");
    assert_eq!(hinge["displayName"], Value::Null);

    assert_eq!(find(joints, "/Cabinet/Joints/Pane")["kind"], "fixed");
    let ball = find(joints, "/Cabinet/Joints/Ball");
    assert_eq!(
        (ball["kind"].as_str(), ball["cone0"].as_f64()),
        (Some("spherical"), Some(30.0))
    );
    assert_eq!(ball["body0"], Value::Null);
    let rope = find(joints, "/Cabinet/Joints/Rope");
    assert!(
        close(&rope["min"], 0.05) && close(&rope["max"], 0.5),
        "{rope}"
    );
    let custom = find(joints, "/Cabinet/Joints/Custom");
    assert_eq!(custom["kind"], "generic");
    // Rotations stay in degrees; translations are in meters.
    let dofs = custom["dofs"].as_array().unwrap();
    assert_eq!(
        dofs.iter()
            .map(|d| d["dof"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["rotX", "transY", "rotY"]
    );
    assert!(close(&dofs[0]["low"], -10.0) && close(&dofs[0]["high"], 10.0));
    assert!(
        close(&dofs[1]["low"], 0.01) && close(&dofs[1]["high"], -0.01),
        "{}",
        dofs[1]
    );
    assert!(close(&dofs[2]["low"], -5.0) && dofs[2]["high"].is_null());
    let follower = find(joints, "/Cabinet/Joints/Follower");
    assert_eq!(
        follower["mimic"],
        json!({ "reference": "/Cabinet/Joints/Hinge", "gearing": -1.0, "offset": 0.0 })
    );
}

#[test]
fn joints_know_their_frame_and_where_the_authored_pose_puts_them() {
    let out = fixture();
    let joints = &out["physics"]["joints"];
    // The drawer's prim sits 40 up, where the slide's frame on the body is: at 0.
    let slide = find(joints, "/Cabinet/Joints/Slide");
    assert!(close(&slide["rest"], 0.0));
    assert_eq!(
        slide["frame0"].as_array().unwrap()[12..15],
        [json!(0.0), json!(0.0), json!(40.0)]
    );
    // The door's frame is turned 90° about Z from the hinge's frame on the body.
    let hinge = find(joints, "/Cabinet/Joints/Hinge");
    assert!(close(&hinge["rest"], 90.0), "{}", hinge["rest"]);
}

#[test]
fn inertia_is_in_kilogram_square_meters() {
    let out = fixture();
    let body = find(&out["physics"]["bodies"], "/Cabinet/Body");
    // g·cm² (kilogramsPerUnit 0.001, metersPerUnit 0.01) to kg·m²: × 1e-7.
    let inertia = body["diagonalInertia"].as_array().unwrap();
    for (v, expected) in inertia.iter().zip([1e-4, 2e-4, 3e-4]) {
        assert!(
            (v.as_f64().unwrap() - expected).abs() < 1e-12,
            "{inertia:?}"
        );
    }
}

#[test]
fn joints_keep_their_authored_type_targets_and_both_frames() {
    let out = fixture();
    let joints = &out["physics"]["joints"];
    let slide = find(joints, "/Cabinet/Joints/Slide");
    assert_eq!(slide["type"], "PhysicsPrismaticJoint");
    assert_eq!(slide["target1"], "/Cabinet/Drawer/Box");
    assert_eq!(slide["body1"], "/Cabinet/Drawer");
    assert_eq!(slide["frame1"].as_array().unwrap().len(), 16);
    assert_eq!(
        find(joints, "/Cabinet/Joints/Custom")["type"],
        "PhysicsJoint"
    );
    // An axis outside the schema's X, Y, Z reads as its default, X.
    assert_eq!(find(joints, "/Cabinet/Joints/Ball")["axis"], "X");
}

#[test]
fn drives_and_articulation_roots_are_in_si_units() {
    let out = fixture();
    assert_eq!(
        out["physics"]["articulationRoots"],
        json!(["/Cabinet/Body"])
    );
    let joints = &out["physics"]["joints"];
    // Grams and centimeters in the file: a linear drive's gains are in kg/s² and kg/s,
    // its position in meters and its force in newtons.
    let slide = &find(joints, "/Cabinet/Joints/Slide")["drives"][0];
    assert_eq!(
        (slide["axis"].as_str(), slide["type"].as_str()),
        (Some("linear"), Some("force"))
    );
    for (key, expected) in [
        ("targetPosition", 0.1),
        ("stiffness", 1.0),
        ("damping", 0.2),
        ("maxForce", 1.0),
    ] {
        assert!(close(&slide[key], expected), "{key}: {}", slide[key]);
    }
    assert_eq!(slide["targetVelocity"], Value::Null);
    // An angular drive keeps degrees; its stiffness is in N·m per degree.
    let hinge = &find(joints, "/Cabinet/Joints/Hinge")["drives"][0];
    assert!(close(&hinge["targetPosition"], 45.0));
    assert!(close(&hinge["stiffness"], 1.0), "{}", hinge["stiffness"]);
    assert_eq!(find(joints, "/Cabinet/Joints/Pane")["drives"], json!([]));
    // An acceleration drive's gains carry no mass: only its limit, an acceleration, scales to m/s².
    let custom = &find(joints, "/Cabinet/Joints/Custom")["drives"][0];
    assert_eq!(custom["type"], "acceleration");
    assert!(close(&custom["stiffness"], 5.0), "{}", custom["stiffness"]);
    assert!(close(&custom["maxForce"], 1.0), "{}", custom["maxForce"]);
}

#[test]
fn fixed_joints_attach_bodies_to_the_one_that_moves_them() {
    let out = fixture();
    let door = find(&out["physics"]["bodies"], "/Cabinet/Door");
    assert_eq!(door["attached"], json!(["/Cabinet/Glass"]));
}

/// `USD_PHYSICS_DUMP=<root layer> cargo test --test physics dump -- --nocapture --ignored`
#[test]
#[ignore]
fn dump() {
    let root = std::env::var("USD_PHYSICS_DUMP").expect("USD_PHYSICS_DUMP");
    println!("{}", serde_json::to_string_pretty(&physics(&root)).unwrap());
}
