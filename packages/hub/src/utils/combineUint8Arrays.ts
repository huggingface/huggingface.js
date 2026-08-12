export function combineUint8Arrays(...arrays: Array<Uint8Array<ArrayBufferLike>>): Uint8Array<ArrayBuffer> {
	const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
	const combinedBytes = new Uint8Array(totalLength);
	let offset = 0;
	for (const array of arrays) {
		combinedBytes.set(array, offset);
		offset += array.length;
	}
	return combinedBytes;
}
