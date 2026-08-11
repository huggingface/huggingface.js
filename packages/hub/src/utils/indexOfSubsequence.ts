/**
 * Returns the index of the first occurrence of `needle` in `haystack` at or after `from`,
 * or -1 if not found. Like `String.prototype.indexOf`, but for byte arrays.
 *
 * (`Uint8Array.prototype.indexOf` only searches for a single byte value, so there's no
 * native subarray search.) Uses Boyer–Moore with a bad-character skip table: on a mismatch
 * the scan jumps ahead based on the byte under the cursor, which approaches O(n / m) for
 * typical needles instead of the naive O(n * m).
 */
export function indexOfSubsequence(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
	const needleLength = needle.length;
	if (needleLength === 0) {
		return from <= haystack.length ? from : -1;
	}
	const last = needleLength - 1;
	const maxStart = haystack.length - needleLength;

	// Bad-character table: for each possible byte value, how far we can skip when that byte
	// causes a mismatch. Default is a full needle-length jump (byte not in needle).
	const skip = new Uint16Array(256).fill(needleLength);
	for (let i = 0; i < last; i++) {
		skip[needle[i]] = last - i;
	}

	let i = from;
	while (i <= maxStart) {
		// Compare from the end of the needle backwards
		let j = last;
		while (j >= 0 && haystack[i + j] === needle[j]) {
			j--;
		}
		if (j < 0) {
			return i; // full match
		}
		// Shift forward by the bad-character rule
		i += skip[haystack[i + last]];
	}
	return -1;
}
