/**
 * Checks if code is running in Node.js environment (for snippet generation)
 */
export function isNode(): boolean {
	return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
}

/**
 * Error thrown when trying to use snippet generation in unsupported environment
 */
export class SnippetEnvironmentError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SnippetEnvironmentError";
	}
}
