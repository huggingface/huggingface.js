// From https://github.com/srijs/rust-gearhash/blob/master/src/lib.rs

//! The GEAR hashing function is a fast, rolling hash function that
//! is well suited for content defined chunking. In particular, it is
//! used as a building block for the [FastCDC](https://www.usenix.org/node/196197)
//! algorithm.
//!
//! The implementation provided in this crate consists of both a simple,
//! scalar variant, as well as optimized versions for the SSE4.2 and AVX2
//! instruction sets.
//!
//! ## Example
//!
//! ```
//! fn find_all_chunks(buf: &[u8], mask: u64) -> Vec<&[u8]> {
//!     // set up initial state
//!     let mut chunks = vec![];
//!     let mut offset = 0;
//!
//!     // create new hasher
//!     let mut hasher = gearhash::Hasher::default();
//!
//!     // loop through all matches, and push the corresponding chunks
//!     while let Some(boundary) = hasher.next_match(&buf[offset..], mask) {
//!         chunks.push(&buf[offset..offset + boundary]);
//!         offset += boundary;
//!     }
//!
//!     // push final chunk
//!     chunks.push(&buf[offset..]);
//!     chunks
//! }
//! ```

#![cfg_attr(feature = "bench", feature(test))]

#[cfg(feature = "bench")]
extern crate test;
#[cfg(feature = "bench")]
mod bench;

mod scalar;
mod table;

pub use table::{Table, DEFAULT_TABLE};

/// Gear hash state. Processes bytes to find chunk boundaries.
#[derive(Clone)]
pub struct Hasher<'t> {
    table: &'t Table,
    hash: u64,
}

impl<'t> Hasher<'t> {
    /// Create a new hasher with the given table.
    pub fn new(table: &'t Table) -> Self {
        Self { table, hash: 0 }
    }

    /// Update the hash state by processing all the bytes in the given slice.
    pub fn update(&mut self, buf: &[u8]) {
        for b in buf.iter() {
            self.hash = (self.hash << 1).wrapping_add(self.table[*b as usize]);
        }
    }

    /// Match the current hash state against the given mask.
    ///
    /// Returns true if `hash & mask == 0`, false otherwise.
    pub fn is_match(&self, mask: u64) -> bool {
        self.hash & mask == 0
    }

    /// Processes the given byte slice until a match is found for the given mask.
    ///
    /// If a match is found before the end of the byte slice, it returns the number
    /// of bytes processed. If no match has been found, it returns `None`.
    pub fn next_match(&mut self, buf: &[u8], mask: u64) -> Option<usize> {
        crate::scalar::next_match(&mut self.hash, self.table, buf, mask)
    }

    /// Retrieve the current hash value.
    pub fn get_hash(&self) -> u64 {
        self.hash
    }

    /// Set the hash value to the given integer.
    pub fn set_hash(&mut self, hash: u64) {
        self.hash = hash
    }
}

impl Default for Hasher<'static> {
    fn default() -> Self {
        Hasher::new(&DEFAULT_TABLE)
    }
}

impl<'t> std::fmt::Debug for Hasher<'t> {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        f.debug_struct("Hasher").field("hash", &self.hash).finish()
    }
}