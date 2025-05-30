// The entry file of your WebAssembly module.

import { DEFAULT_TABLE } from "./table";

export { DEFAULT_TABLE };

// Function to find the next match in the buffer
export function nextMatch(hash: u64, buf: Uint8Array, mask: u64, table: StaticArray<u64> = DEFAULT_TABLE): i32 {
	for (let i = 0; i < buf.length; i++) {
		const b = buf[i];
		hash = (hash << 1) + table[b];

		if ((hash & mask) == 0) {
			return i + 1;
		}
	}

	return -1; // Return -1 to indicate no match found (equivalent to None in Rust)
}
