import { isFrontend } from "./env-predicates";
import { WebBlob } from "./WebBlob";

export function isSupportedByFetch(blob: Blob) {
	return blob instanceof WebBlob && isFrontend;
}
