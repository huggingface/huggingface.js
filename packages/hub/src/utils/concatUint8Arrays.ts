import { sum } from "./sum";

/**
 * Concatenate an array of Uint8Arrays into one.
 *
 * Unlike spreading into `combineUint8Arrays(...arrays)`, this takes the array as a single
 * argument, so it is safe for any number of chunks (spreading a large array into a call
 * overflows the stack).
 */
export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array<ArrayBuffer> {
	const result = new Uint8Array(sum(arrays.map((array) => array.byteLength)));
	let offset = 0;
	for (const array of arrays) {
		result.set(array, offset);
		offset += array.byteLength;
	}
	return result;
}
