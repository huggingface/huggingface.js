export class MatchResult {
	position: i32;
	hash: u64;

	constructor(position: i32, hash: u64) {
		this.position = position;
		this.hash = hash;
	}
}

export function nextMatch(data: Uint8Array, mask: u64, hash: u64): MatchResult {
	const nBytes = data.length;
	let pos: usize = 0;

	while (pos < nBytes) {
		// Update hash with next byte
		hash = ((hash << 1) | data[pos]) & mask;

		// Check if we found a match
		if (hash == 0) {
			return new MatchResult(pos, hash);
		}

		pos++;
	}

	return new MatchResult(-1, hash);
}
