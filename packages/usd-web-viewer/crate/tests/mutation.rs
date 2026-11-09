//! Seeded byte mutations of the binary fixtures: a damaged file fails its
//! load with an error, or loads, but never panics (in the browser a panic
//! kills the module).

mod common;

const FIXTURES: [&str; 2] = ["implicit_gprims.usdc", "uv_set.usdz"];
const MUTATIONS: usize = 300;

#[test]
fn damaged_binary_files_error_and_never_panic() {
    let mut rng = Rng(0x9e37_79b9_7f4a_7c15);
    for name in FIXTURES {
        let original = std::fs::read(format!("{}/../fixtures/{name}", env!("CARGO_MANIFEST_DIR")))
            .expect("fixture");
        let root = format!("/h/{name}");
        for i in 0..MUTATIONS {
            let mut bytes = original.clone();
            for _ in 0..=rng.below(3) {
                mutate(&mut bytes, &mut rng);
            }
            let loaded = std::panic::catch_unwind(|| {
                common::compose(&root, |path| (path == root).then(|| bytes.clone()))
            });
            assert!(loaded.is_ok(), "{name}: mutation {i} panicked");
        }
    }
}

/// One random change: bytes overwritten, a run zeroed or filled, a length or
/// offset made extreme, a range repeated elsewhere, or the end cut off.
fn mutate(bytes: &mut Vec<u8>, rng: &mut Rng) {
    if bytes.len() < 8 {
        return;
    }
    let at = rng.below(bytes.len());
    match rng.below(5) {
        0 => {
            for _ in 0..=rng.below(4) {
                let i = rng.below(bytes.len());
                bytes[i] = rng.next() as u8;
            }
        }
        1 => {
            let fill = if rng.below(2) == 0 { 0x00 } else { 0xff };
            let end = (at + 1 + rng.below(16)).min(bytes.len());
            bytes[at..end].fill(fill);
        }
        2 => {
            let extreme = [
                0,
                1,
                0x7fff_ffff,
                0xffff_ffff,
                0x8000_0000,
                bytes.len() as u32,
            ][rng.below(6)];
            let at = at.min(bytes.len() - 4);
            bytes[at..at + 4].copy_from_slice(&extreme.to_le_bytes());
        }
        3 => {
            let len = rng.below(32).min(bytes.len() - at);
            let chunk = bytes[at..at + len].to_vec();
            let to = rng.below(bytes.len() - len + 1);
            bytes[to..to + len].copy_from_slice(&chunk);
        }
        _ => bytes.truncate(at),
    }
}

/// xorshift64: the same mutations on every run.
struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }

    fn below(&mut self, n: usize) -> usize {
        (self.next() % n as u64) as usize
    }
}
