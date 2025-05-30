// The entry file of your WebAssembly module.

import { DEFAULT_TABLE } from "./table";

// Interface for the match result
export class MatchResult {
	position: i32 = -1;
	hash: u64 = 0;
}

// Function to find the next match in the buffer
export function nextMatch(buf: Uint8Array, mask: u64, hash: u64 = 0): MatchResult {
	for (let i = 0; i < buf.length; i++) {
		const b = buf[i];
		hash = (hash << 1) + DEFAULT_TABLE[b];

		if ((hash & mask) == 0) {
			return { position: i + 1, hash };
		}
	}

	return { position: -1, hash }; // Return -1 position to indicate no match found, along with the final hash
}
