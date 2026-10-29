import { hexFromBytes } from "./hexFromBytes";

/**
 * `crypto.randomUUID()`, falling back to a version 4 UUID built from `crypto.getRandomValues()`.
 *
 * Browsers only expose `randomUUID` in secure contexts (HTTPS or localhost), while `getRandomValues`
 * is available everywhere, including a Hub served over plain HTTP from another host.
 */
export function randomUUID(): string {
	if (typeof globalThis.crypto.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}
	const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
	bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 9562 variant
	const hex = hexFromBytes(bytes);
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
