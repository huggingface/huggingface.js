import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "./checkCredentials";

type XetBlobCreateOptions = {
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
} & Partial<CredentialsParams>;

/**
 * XetBlob is a blob implementation that fetches data directly from the Xet storage
 */
export class XetBlob extends Blob {
	fetch: typeof fetch;
	accessToken?: string;

	constructor(params: XetBlobCreateOptions) {
		super([]);

		this.fetch = params.fetch ?? fetch;
		this.accessToken = checkCredentials(params);
	}
}
