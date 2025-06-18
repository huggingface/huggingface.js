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
