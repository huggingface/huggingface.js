//! Zip bombs in a `.usdz` are refused when the layer is added, before
//! openusd reads a file out of it.

use std::io::{Cursor, Write};

use usd_wasm::Loader;

const ROOT: &[u8] = b"#usda 1.0\ndef Xform \"Root\"\n{\n}\n";

/// A package whose root layer is deflated and padded with `padding` spaces.
fn package(padding: usize) -> Vec<u8> {
    let mut zip = zip::ZipWriter::new(Cursor::new(Vec::new()));
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);
    zip.start_file("root.usda", options).unwrap();
    zip.write_all(ROOT).unwrap();
    zip.write_all(&vec![b' '; padding]).unwrap();
    zip.finish().unwrap().into_inner()
}

/// `package` with its one file's declared expanded size set to `size`, in
/// both its local header and the central directory.
fn declaring(mut package: Vec<u8>, size: u32) -> Vec<u8> {
    for (signature, offset) in [(b"PK\x03\x04", 22), (b"PK\x01\x02", 24)] {
        let at = package
            .windows(4)
            .position(|w| w == signature)
            .expect("zip header")
            + offset;
        package[at..at + 4].copy_from_slice(&size.to_le_bytes());
    }
    package
}

/// Adds `bytes` as a package; an error comes with its causes joined.
fn add(bytes: Vec<u8>) -> Result<Vec<String>, String> {
    Loader::new().add_layer("/h/bomb.usdz", bytes).map_err(|e| {
        let mut message = e.to_string();
        let mut source = std::error::Error::source(&e);
        while let Some(cause) = source {
            message = format!("{message}: {cause}");
            source = cause.source();
        }
        message
    })
}

#[test]
fn package_bombs_are_refused_when_added() {
    let bomb = package(4 << 20);
    assert!(bomb.len() < 16 << 10, "a decompression bomb");
    add(bomb.clone()).expect("an honest package loads");

    let over_declared = declaring(bomb.clone(), 600 << 20);
    let under_declared = declaring(bomb, 1 << 10);
    // A zip is found from its end: bytes before it do not hide it.
    let prefixed = [b"JUNK".as_slice(), &under_declared].concat();
    for (case, bytes, expected) in [
        ("over-declared", over_declared, "resource limit exceeded"),
        (
            "under-declared",
            under_declared,
            "does not expand to the size",
        ),
        ("junk-prefixed", prefixed, "does not expand to the size"),
    ] {
        let error = add(bytes).expect_err(case);
        assert!(error.contains(expected), "{case}: {error}");
    }
}
