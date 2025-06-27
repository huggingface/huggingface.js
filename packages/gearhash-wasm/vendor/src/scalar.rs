use crate::Table;

#[inline]
pub(crate) fn next_match(hash: &mut u64, table: &Table, buf: &[u8], mask: u64) -> Option<usize> {
    for (i, b) in buf.iter().enumerate() {
        *hash = (*hash << 1).wrapping_add(table[*b as usize]);

        if *hash & mask == 0 {
            return Some(i + 1);
        }
    }

    None
}
