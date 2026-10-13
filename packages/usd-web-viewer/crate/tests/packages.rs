//! A `.usdz` holding a compressed file, a zip bomb among them, is refused
//! when the layer is added, before openusd reads a file out of it.

use std::io::{Cursor, Write};

use usd_wasm::Loader;
use zip::CompressionMethod;

const ROOT: &[u8] = b"#usda 1.0\ndef Xform \"Root\"\n{\n}\n";

/// A package whose root layer is written with `method` and padded with
/// `padding` spaces.
fn package(method: CompressionMethod, padding: usize) -> Vec<u8> {
    let mut zip = zip::ZipWriter::new(Cursor::new(Vec::new()));
    let options = zip::write::SimpleFileOptions::default().compression_method(method);
    zip.start_file("root.usda", options).unwrap();
    zip.write_all(ROOT).unwrap();
    zip.write_all(&vec![b' '; padding]).unwrap();
    zip.finish().unwrap().into_inner()
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
fn compressed_packages_are_refused_when_added() {
    add(package(CompressionMethod::Stored, 0)).expect("a stored package loads");

    let bomb = package(CompressionMethod::Deflated, 4 << 20);
    assert!(bomb.len() < 16 << 10, "a decompression bomb");
    let honest = package(CompressionMethod::Deflated, 0);
    // A zip is found from its end: bytes before it do not hide it.
    let prefixed = [b"JUNK".as_slice(), &bomb].concat();
    for (case, bytes) in [
        ("bomb", bomb),
        ("honest", honest),
        ("junk-prefixed", prefixed),
    ] {
        let error = add(bytes).expect_err(case);
        assert!(error.contains("root.usda is compressed"), "{case}: {error}");
    }
}
