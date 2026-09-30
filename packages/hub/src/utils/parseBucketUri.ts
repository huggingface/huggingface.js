export interface BucketUri {
	/** `namespace/name` */
	bucket: string;
	/** Path inside the bucket, without leading slash. May be empty or end with `/` */
	path: string;
}

const PREFIX = "hf://buckets/";

/**
 * Parses `hf://buckets/namespace/name[/path]`. Returns `undefined` if the input is not an `hf://` URI.
 */
export function parseBucketUri(uri: string): BucketUri | undefined {
	if (!uri.startsWith("hf://")) {
		return undefined;
	}
	if (!uri.startsWith(PREFIX)) {
		throw new TypeError(`Only bucket URIs (hf://buckets/namespace/name[/path]) are supported, got: ${uri}`);
	}

	const [namespace, name, ...rest] = uri.slice(PREFIX.length).split("/");
	if (!namespace || !name) {
		throw new TypeError(`Bucket URI must include namespace and name: hf://buckets/namespace/name[/path], got: ${uri}`);
	}

	return { bucket: `${namespace}/${name}`, path: rest.join("/") };
}
