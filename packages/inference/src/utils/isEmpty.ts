export function isObjectEmpty(object: object): boolean {
	for (const prop in object) {
		if (Object.prototype.hasOwnProperty.call(object, prop)) {
			return false;
		}
	}
	return true;
}
