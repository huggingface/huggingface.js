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
		// Use proper unsigned operations to match Rust's wrapping_add behavior
		hash = ((hash << 1) as u64) + (DEFAULT_TABLE[b] as u64);

		// console.log(
		// 	"hash " +
		// 		hash.toString(16) +
		// 		" " +
		// 		(hash << 1).toString(16) +
		// 		" " +
		// 		b.toString(16) +
		// 		" " +
		// 		(DEFAULT_TABLE[b] as u64).toString(16)
		// );
		// console.log("mask " + mask.toString(16));
		// console.log("hash & mask " + (hash & mask).toString(16));

		if ((hash & mask) == 0) {
			// console.log("match found at position " + (i + 1).toString());
			return { position: i + 1, hash };
		}
	}

	return { position: -1, hash }; // Return -1 position to indicate no match found, along with the final hash
}

export class NextMatchesResult {
	matches: MatchResult[] = [];
	hash: u64 = 0;
	remaining: i32 = 0;
}

export function nextMatches(buf: Uint8Array, mask: u64, hash: u64 = 0): NextMatchesResult {
	const result = new NextMatchesResult();

	let match = nextMatch(buf, mask, hash);
	let position = 0;
	while (match.position !== -1) {
		result.matches.push(match);
		position += match.position;
		match = nextMatch(buf.subarray(position), mask, 0);
	}

	result.remaining = buf.length - position;
	result.hash = match.hash;

	return result;
}
