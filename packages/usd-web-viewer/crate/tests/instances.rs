//! Past `maxInstances`, whole copies of a PointInstancer prototype are left
//! out: every mesh of a copy that is drawn is drawn.

use usd_wasm::{Composed, Loader};

const STAGE: &str = r#"#usda 1.0
def PointInstancer "PI"
{
    point3f[] positions = [(0, 0, 0), (1, 0, 0), (2, 0, 0), (3, 0, 0), (4, 0, 0)]
    int[] protoIndices = [0, 0, 0, 0, 0]
    rel prototypes = </PI/Proto>

    def Xform "Proto"
    {
        def Mesh "A"
        {
            int[] faceVertexCounts = [3]
            int[] faceVertexIndices = [0, 1, 2]
            point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        }

        def Mesh "B"
        {
            int[] faceVertexCounts = [3]
            int[] faceVertexIndices = [0, 1, 2]
            point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 0, 1)]
        }
    }
}
"#;

#[test]
fn the_instance_cap_leaves_out_whole_prototype_copies() {
    let mut loader = Loader::new();
    loader
        .add_layer("/h/stage.usda", STAGE.as_bytes().to_vec())
        .expect("layer");
    let Composed::Scene(scene) = loader.compose("/h/stage.usda", 7).expect("compose") else {
        panic!("no layers are missing");
    };
    let scene = scene.read_all().expect("read");

    let count = |mesh: &str| {
        let prefix = format!("/PI/Proto/{mesh}[");
        scene
            .instances
            .iter()
            .filter(|i| i.path.starts_with(&prefix))
            .count()
    };
    // 7 instances fit 3 copies of the 2 meshes, not 4 of A and 3 of B.
    assert_eq!((count("A"), count("B")), (3, 3));
    assert_eq!(scene.instances.len(), 6);
    assert!(
        scene.warnings.iter().any(|w| w.code == "instance-limit"),
        "an instance-limit warning"
    );
}
