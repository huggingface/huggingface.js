//! An in-memory asset resolver over layer identifiers.
//!
//! An identifier is an absolute URL without a query (`https://host/a/b.usd`),
//! encoded as authored or requested so the host can fetch it as is, or a plain
//! absolute path (`/a/b.usd`) for native use. Relative asset paths resolve
//! against the identifier of the layer that authored them, as URL references
//! do. Layers live in a shared map filled before composition; nothing is ever
//! read from a filesystem or network.

use std::cell::RefCell;
use std::collections::{BTreeSet, HashMap};
use std::io::{self, Read, Seek, SeekFrom};
use std::rc::Rc;
use std::sync::{Arc, Mutex, MutexGuard};

use openusd::ar::{self, Asset, ResolvedPath};

/// Layer bytes shared between the loader and its resolvers.
pub type Files = Arc<Mutex<Store>>;

/// Extensions composition reads as layers. Anything else (textures, MDL) is
/// an opaque asset that resolves without being present.
pub fn is_layer_path(path: &str) -> bool {
    matches!(extension(path).as_str(), "usd" | "usda" | "usdc" | "usdz")
}

fn extension(path: &str) -> String {
    let path = path.trim_end_matches(']');
    let name = path.rsplit(['/', '[']).next().unwrap_or(path);
    match name.rfind('.') {
        Some(dot) => name[dot + 1..].to_ascii_lowercase(),
        None => String::new(),
    }
}

/// Splits a package-relative path `pkg.usdz[inner]` into its outermost
/// package and the path inside it, which may name a nested package's file:
/// `a.usdz[b.usdz[c.png]]` splits into `a.usdz` and `b.usdz[c.png]`.
pub fn split_packaged(path: &str) -> Option<(&str, &str)> {
    let inner = path.strip_suffix(']')?;
    let open = inner.find('[')?;
    Some((&inner[..open], &inner[open + 1..]))
}

/// Splits a package-relative path at its innermost package:
/// `a.usdz[b.usdz[c.png]]` splits into `a.usdz[b.usdz]` and `c.png`.
fn split_innermost(path: &str) -> Option<(String, &str)> {
    let body = path.trim_end_matches(']');
    let depth = path.len() - body.len();
    let open = body.rfind('[').filter(|_| depth > 0)?;
    Some((
        format!("{}{}", &body[..open], "]".repeat(depth - 1)),
        &body[open + 1..],
    ))
}

/// A path inside `package`, which may itself be inside packages:
/// `a.usdz[b.usdz]` and `c.png` join as `a.usdz[b.usdz[c.png]]`.
fn join_packaged(package: &str, inner: &str) -> String {
    let body = package.trim_end_matches(']');
    format!("{body}[{inner}]{}", &package[body.len()..])
}

/// Turns an authored asset path into an identifier, anchored at the identifier
/// of the layer that authored it. Returns `None` for empty paths. Paths
/// authored inside a USDZ package stay inside it (`https://h/pkg.usdz[tex/a.png]`).
/// Percent-escapes are left as authored: the host's URL parser encodes the rest.
pub fn anchor_path(asset_path: &str, anchor: Option<&str>) -> Option<String> {
    let path = asset_path.trim().replace('\\', "/");
    if path.is_empty() {
        return None;
    }
    if let Some((package, inner)) = split_packaged(&path) {
        let package = anchor_path(package, anchor)?;
        return Some(join_packaged(&package, &normalize(inner)[1..]));
    }
    if !split_origin(&path).0.is_empty() {
        return Some(normalize(&path));
    }
    let (origin, anchor_rest) = anchor.map_or(("", ""), split_origin);
    if path.starts_with('/') {
        return Some(format!("{origin}{}", normalize(&path)));
    }
    if let Some(anchor) = anchor {
        // A package (possibly inside others) anchors paths inside itself; a
        // file in a package, next to itself in that package.
        if extension(anchor) == "usdz" {
            return Some(join_packaged(anchor, &normalize(&path)[1..]));
        }
        if let Some((package, inner)) = split_innermost(anchor) {
            let dir = inner.rsplit_once('/').map_or("", |(dir, _)| dir);
            return Some(join_packaged(
                &package,
                &normalize(&format!("{dir}/{path}"))[1..],
            ));
        }
    }
    let dir = anchor_rest.rsplit_once('/').map_or("", |(dir, _)| dir);
    Some(format!("{origin}{}", normalize(&format!("{dir}/{path}"))))
}

/// Splits an identifier into its `scheme://authority` (empty for a plain path)
/// and the rest.
fn split_origin(id: &str) -> (&str, &str) {
    let Some(colon) = id.find("://") else {
        return ("", id);
    };
    let scheme = &id[..colon];
    let is_scheme = scheme.len() > 1
        && scheme.starts_with(|c: char| c.is_ascii_alphabetic())
        && scheme
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "+-.".contains(c));
    if !is_scheme {
        return ("", id);
    }
    let authority = colon + 3;
    let end = id[authority..]
        .find(['/', '?', '#'])
        .map_or(id.len(), |i| authority + i);
    id.split_at(end)
}

/// Most bytes one file inside a package may expand to.
pub const MAX_PACKAGED_FILE_BYTES: u64 = 512 << 20;
/// Most bytes all package reads during one composition, or all the files of
/// one package together, may expand to.
pub const MAX_PACKAGED_TOTAL_BYTES: u64 = 1 << 30;

/// What a file expands to by its headers: its stored length if stored.
fn expanded_size(entry: &zip::read::ZipFile<'_, impl Read>) -> u64 {
    match entry.compression() {
        zip::CompressionMethod::Stored => entry.compressed_size(),
        _ => entry.size(),
    }
}

/// Whether a layer is a package: named `.usdz`, or anything a zip reader
/// opens. Zip archives are found from their end, so bytes before one (not
/// `PK` magic) still read as a package.
pub fn is_package(path: &str, bytes: &[u8]) -> bool {
    extension(path) == "usdz" || zip::ZipArchive::new(io::Cursor::new(bytes)).is_ok()
}

/// Refuses a package whose files would expand past the limits, before
/// openusd reads them whole (it trusts no limit of its own). Stored files
/// cannot outgrow the package; a compressed file's declared size is checked
/// against what it actually inflates to, read into nothing.
pub fn check_package(package: &[u8]) -> io::Result<()> {
    let mut archive = zip::ZipArchive::new(io::Cursor::new(package)).map_err(io::Error::other)?;
    let mut total = 0u64;
    for i in 0..archive.len() {
        let entry = archive.by_index(i).map_err(io::Error::other)?;
        let declared = expanded_size(&entry);
        total = total.saturating_add(declared);
        if declared > MAX_PACKAGED_FILE_BYTES || total > MAX_PACKAGED_TOTAL_BYTES {
            return Err(io::Error::other(format!(
                "resource limit exceeded: package files expand past {MAX_PACKAGED_FILE_BYTES} bytes each or {MAX_PACKAGED_TOTAL_BYTES} together"
            )));
        }
        if entry.compression() != zip::CompressionMethod::Stored {
            let name = entry.name().to_owned();
            if io::copy(&mut entry.take(declared + 1), &mut io::sink())? != declared {
                return Err(io::Error::other(format!(
                    "{name} does not expand to the size its header declares"
                )));
            }
        }
    }
    Ok(())
}

/// Reads one file out of a USDZ (zip) package held in memory, refusing to
/// expand it past `limit` bytes. Zip headers are untrusted: the declared size
/// only sizes the buffer up to the package's own length. Packages nested in
/// it are opened by [`Store`].
pub fn read_packaged(package: &[u8], inner: &str, limit: u64) -> io::Result<Vec<u8>> {
    let mut archive = zip::ZipArchive::new(io::Cursor::new(package)).map_err(io::Error::other)?;
    let entry = archive
        .by_name(inner)
        .map_err(|e| io::Error::new(io::ErrorKind::NotFound, e))?;
    if expanded_size(&entry) > limit {
        return Err(io::Error::other(format!(
            "resource limit exceeded: {inner} expands past {limit} bytes"
        )));
    }
    let mut out = Vec::with_capacity(entry.size().min(package.len() as u64) as usize);
    entry.take(limit + 1).read_to_end(&mut out)?;
    if out.len() as u64 > limit {
        return Err(io::Error::other(format!(
            "resource limit exceeded: {inner} expands past {limit} bytes"
        )));
    }
    Ok(out)
}

/// Collapses `.`, `..` and repeated separators in an identifier's path, keeps
/// its origin and drops a query string.
fn normalize(id: &str) -> String {
    let (origin, rest) = split_origin(id);
    let path = rest.split(['?', '#']).next().unwrap_or(rest);
    let mut parts: Vec<&str> = Vec::new();
    for part in path.split('/') {
        match part {
            "" | "." => {}
            ".." => {
                parts.pop();
            }
            part => parts.push(part),
        }
    }
    format!("{origin}/{}", parts.join("/"))
}

/// Fetched layers by identifier.
#[derive(Default)]
pub struct Store {
    /// Bytes not yet handed to a composing stage.
    pub bytes: HashMap<String, Vec<u8>>,
    /// Layers a composing stage took ownership of: present for this stage,
    /// gone for any later one.
    pub taken: Vec<String>,
    /// Packages inside packages (`/h/a.usdz[b.usdz]`), each expanded once
    /// per load rather than on every read of a file inside it.
    pub nested: HashMap<String, Vec<u8>>,
    /// Bytes package reads expanded to since the last composition began,
    /// the nested packages held included.
    pub expanded: u64,
}

impl Store {
    /// Reads a packaged file (`/h/pkg.usdz[inner]`, nested packages allowed)
    /// within the per-file and total expansion limits.
    pub fn read_packaged(&mut self, path: &str) -> io::Result<Vec<u8>> {
        self.read_packaged_within(path, MAX_PACKAGED_FILE_BYTES)
    }

    /// [`read_packaged`](Self::read_packaged) of a file at most `limit` bytes.
    pub fn read_packaged_within(&mut self, path: &str, limit: u64) -> io::Result<Vec<u8>> {
        if extension(path) == "usdz" && split_packaged(path).is_some() {
            self.open_package(path)?;
            return Ok(self.nested[path].clone());
        }
        self.expand(path, limit)
    }

    /// Expands a nested package into `nested`, unless it is already there
    /// (or is not nested), charging its size once.
    fn open_package(&mut self, path: &str) -> io::Result<()> {
        if split_packaged(path).is_none() || self.nested.contains_key(path) {
            return Ok(());
        }
        let bytes = self.expand(path, MAX_PACKAGED_FILE_BYTES)?;
        check_package(&bytes)?;
        self.nested.insert(path.to_owned(), bytes);
        Ok(())
    }

    /// Expands one file out of its innermost package.
    fn expand(&mut self, path: &str, limit: u64) -> io::Result<Vec<u8>> {
        let not_found = || io::Error::new(io::ErrorKind::NotFound, path.to_owned());
        let (package, inner) = split_innermost(path).ok_or_else(not_found)?;
        self.open_package(&package)?;
        let source = self
            .nested
            .get(&package)
            .or_else(|| self.bytes.get(&package))
            .ok_or_else(not_found)?;
        let budget = MAX_PACKAGED_TOTAL_BYTES.saturating_sub(self.expanded);
        let bytes = read_packaged(
            source,
            inner,
            limit.min(MAX_PACKAGED_FILE_BYTES).min(budget),
        )?;
        self.expanded += bytes.len() as u64;
        Ok(bytes)
    }

    /// Restarts the expansion budget, still charged for the nested packages held.
    pub fn restart_budget(&mut self) {
        self.expanded = self.nested.values().map(|b| b.len() as u64).sum();
    }
}

/// Resolves identifiers against the [`Store`], recording every layer that
/// was asked for but is not there yet so the caller can fetch it and recompose.
pub struct MemoryResolver {
    pub files: Files,
    pub missing: Rc<RefCell<BTreeSet<String>>>,
    /// Move bytes into the stage instead of copying them, so a layer is held
    /// once (by the stage) rather than twice while composing.
    pub take: bool,
}

impl ar::Resolver for MemoryResolver {
    fn create_identifier(&self, asset_path: &str, anchor: Option<&ResolvedPath>) -> String {
        let anchor = anchor.map(|a| a.to_string_lossy().into_owned());
        anchor_path(asset_path, anchor.as_deref()).unwrap_or_default()
    }

    fn resolve(&self, asset_path: &str) -> Option<ResolvedPath> {
        if asset_path.is_empty() {
            return None;
        }
        let key = split_packaged(asset_path).map_or(asset_path, |(package, _)| package);
        let present = {
            let files = lock(&self.files);
            files.bytes.contains_key(key) || (self.take && files.taken.iter().any(|t| t == key))
        };
        // MaterialX documents are only ever referenced as layers, and no format
        // here reads them: leave them unresolved so composition goes on without.
        if extension(asset_path) == "mtlx" {
            return None;
        }
        if !is_layer_path(asset_path) || present {
            return Some(ResolvedPath::new(asset_path));
        }
        self.missing.borrow_mut().insert(key.to_owned());
        None
    }

    fn resolve_for_new_asset(&self, asset_path: &str) -> Option<ResolvedPath> {
        Some(ResolvedPath::new(asset_path))
    }

    fn open_asset(&self, resolved_path: &ResolvedPath) -> io::Result<Box<dyn Asset>> {
        let key = resolved_path.to_string_lossy().into_owned();
        if split_packaged(&key).is_some() {
            let bytes = lock(&self.files).read_packaged(&key)?;
            return Ok(Box::new(MemAsset(io::Cursor::new(bytes))));
        }
        // A package is read entry by entry, so it stays in the store.
        let take = self.take && extension(&key) != "usdz";
        let size = match lock(&self.files).bytes.get(&key) {
            Some(bytes) => bytes.len() as u64,
            None => return Err(io::Error::new(io::ErrorKind::NotFound, key)),
        };
        Ok(Box::new(StoredAsset {
            files: self.files.clone(),
            key,
            size,
            pos: 0,
            take,
        }))
    }

    fn get_modification_timestamp(
        &self,
        _: &str,
        _: &ResolvedPath,
    ) -> Option<std::time::SystemTime> {
        None
    }

    fn identity(&self) -> String {
        "usd-wasm-memory".to_owned()
    }
}

/// An extracted package entry.
struct MemAsset(io::Cursor<Vec<u8>>);

impl Read for MemAsset {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        self.0.read(buf)
    }
}

impl Seek for MemAsset {
    fn seek(&mut self, pos: SeekFrom) -> io::Result<u64> {
        self.0.seek(pos)
    }
}

impl Asset for MemAsset {
    fn size(&self) -> io::Result<u64> {
        Ok(self.0.get_ref().len() as u64)
    }

    fn read_all(&mut self) -> io::Result<Vec<u8>> {
        if self.0.position() == 0 {
            return Ok(std::mem::take(self.0.get_mut()));
        }
        let mut rest = Vec::new();
        self.0.read_to_end(&mut rest)?;
        Ok(rest)
    }
}

pub(crate) fn lock(files: &Files) -> MutexGuard<'_, Store> {
    files
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// A layer in the [`Store`], read in place. A full read in take mode moves
/// the buffer out of the store instead of copying it: format sniffing opens a
/// layer more than once, so ownership moves only when it is read whole.
struct StoredAsset {
    files: Files,
    key: String,
    size: u64,
    pos: u64,
    take: bool,
}

impl Read for StoredAsset {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let files = lock(&self.files);
        let Some(bytes) = files.bytes.get(&self.key) else {
            return Err(io::Error::new(io::ErrorKind::NotFound, self.key.clone()));
        };
        let start = (self.pos as usize).min(bytes.len());
        let n = buf.len().min(bytes.len() - start);
        buf[..n].copy_from_slice(&bytes[start..start + n]);
        self.pos += n as u64;
        Ok(n)
    }
}

impl Seek for StoredAsset {
    fn seek(&mut self, pos: SeekFrom) -> io::Result<u64> {
        let next = match pos {
            SeekFrom::Start(n) => n as i64,
            SeekFrom::End(n) => self.size as i64 + n,
            SeekFrom::Current(n) => self.pos as i64 + n,
        };
        if next < 0 {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "seek before start",
            ));
        }
        self.pos = next as u64;
        Ok(self.pos)
    }
}

impl Asset for StoredAsset {
    fn size(&self) -> io::Result<u64> {
        Ok(self.size)
    }

    fn read_all(&mut self) -> io::Result<Vec<u8>> {
        if self.pos != 0 {
            let mut rest = Vec::new();
            self.read_to_end(&mut rest)?;
            return Ok(rest);
        }
        let mut files = lock(&self.files);
        let bytes = if self.take {
            let bytes = files.bytes.remove(&self.key);
            if bytes.is_some() {
                files.taken.push(self.key.clone());
            }
            bytes
        } else {
            files.bytes.get(&self.key).cloned()
        };
        self.pos = self.size;
        bytes.ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, self.key.clone()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn anchors_asset_paths() {
        let hub = "/huggingface.co/datasets/a/b/resolve/main/x/root.usd";
        // [authored, anchor, identifier]
        for (asset, anchor, expected) in [
            (
                "./payloads/base.usda",
                hub,
                "/huggingface.co/datasets/a/b/resolve/main/x/payloads/base.usda",
            ),
            (
                "../tex/a.png",
                hub,
                "/huggingface.co/datasets/a/b/resolve/main/tex/a.png",
            ),
            (
                "http://cdn.example/a/./b%20c.usd?x=1",
                hub,
                "http://cdn.example/a/b%20c.usd",
            ),
            ("../b.usd", "https://h/a/r.usd", "https://h/b.usd"),
            ("/c/d.usd", "https://h/a/r.usd", "https://h/c/d.usd"),
            (
                "SubUSDs\\textures\\t.jpg",
                "/h/r.usd",
                "/h/SubUSDs/textures/t.jpg",
            ),
            // Inside a package, and inside packages nested in it.
            ("t.png", "https://h/p.usdz", "https://h/p.usdz[t.png]"),
            ("a.usdc", "/h/p.usdz", "/h/p.usdz[a.usdc]"),
            ("tex/a.png", "/h/p.usdz[root.usdc]", "/h/p.usdz[tex/a.png]"),
            ("./p.usdz[x/y.usd]", "/h/r.usda", "/h/p.usdz[x/y.usd]"),
            (
                "0/deep.usdz",
                "/h/a.usdz[0/mid.usdz]",
                "/h/a.usdz[0/mid.usdz[0/deep.usdz]]",
            ),
            (
                "0/t.png",
                "/h/a.usdz[0/mid.usdz[0/deep.usdz[root.usda]]]",
                "/h/a.usdz[0/mid.usdz[0/deep.usdz[0/t.png]]]",
            ),
            (
                "../t.png",
                "/h/a.usdz[b.usdz[x/r.usda]]",
                "/h/a.usdz[b.usdz[t.png]]",
            ),
        ] {
            assert_eq!(
                anchor_path(asset, Some(anchor)).as_deref(),
                Some(expected),
                "{asset} from {anchor}"
            );
        }
        for (path, layer) in [
            ("/h/p.usdz[x/y.usdc]", true),
            ("/h/a.usdz[0/mid.usdz[0/deep.usdz]]", true),
            ("/h/a.usdz[0/mid.usdz[0/t.png]]", false),
        ] {
            assert_eq!(is_layer_path(path), layer, "{path}");
        }
    }

    fn zip_with(name: &str, data: &[u8]) -> Vec<u8> {
        let mut zip = zip::ZipWriter::new(io::Cursor::new(Vec::new()));
        zip.start_file(name, zip::write::SimpleFileOptions::default())
            .unwrap();
        io::Write::write_all(&mut zip, data).unwrap();
        zip.finish().unwrap().into_inner()
    }

    /// A package with one deflated entry of `size` zero bytes.
    fn zeros_package(size: usize) -> Vec<u8> {
        let mut zip = zip::ZipWriter::new(io::Cursor::new(Vec::new()));
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);
        zip.start_file("big.usdc", options).unwrap();
        io::Write::write_all(&mut zip, &vec![0; size]).unwrap();
        zip.finish().unwrap().into_inner()
    }

    #[test]
    fn packaged_file_expanding_past_the_limit_is_refused() {
        let package = zeros_package(1 << 20);
        assert!(package.len() < 4096, "a decompression bomb");
        let error = read_packaged(&package, "big.usdc", 1 << 16).unwrap_err();
        assert!(
            error.to_string().contains("resource limit exceeded"),
            "{error}"
        );
        assert_eq!(
            read_packaged(&package, "big.usdc", 1 << 20).unwrap().len(),
            1 << 20
        );
    }

    #[test]
    fn packaged_files_share_one_expansion_budget() {
        let mut store = Store::default();
        store
            .bytes
            .insert("/h/p.usdz".to_owned(), zeros_package(100));
        store.expanded = MAX_PACKAGED_TOTAL_BYTES - 150;
        assert_eq!(
            store.read_packaged("/h/p.usdz[big.usdc]").unwrap().len(),
            100
        );
        let error = store.read_packaged("/h/p.usdz[big.usdc]").unwrap_err();
        assert!(
            error.to_string().contains("resource limit exceeded"),
            "{error}"
        );

        // A nested package is expanded and charged once, however many of its files are read.
        let inner = zeros_package(1 << 20);
        let mut store = Store::default();
        store
            .bytes
            .insert("/h/o.usdz".to_owned(), zip_with("inner.usdz", &inner));
        for _ in 0..4 {
            assert_eq!(
                store
                    .read_packaged("/h/o.usdz[inner.usdz[big.usdc]]")
                    .unwrap()
                    .len(),
                1 << 20
            );
        }
        assert_eq!(store.expanded, inner.len() as u64 + (4 << 20));
    }
}
