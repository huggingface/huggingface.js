import type * as Hyparquet from "hyparquet";

/**
 * hyparquet and fzstd are hard dependencies but are still loaded on demand: callers that only need
 * `info()` or a v2 episode listing never pay for the parquet reader.
 */
export async function loadParquet(): Promise<typeof Hyparquet & { compressors: Hyparquet.Compressors }> {
	const [hyparquet, { decompress }] = await Promise.all([import("hyparquet"), import("fzstd")]);
	return {
		...hyparquet,
		/// hyparquet only decodes SNAPPY itself, and some converters write ZSTD. fzstd sizes the output
		/// itself: handed a buffer, it throws on a page holding more than one zstd frame.
		compressors: { ZSTD: (input) => decompress(input) },
	};
}
