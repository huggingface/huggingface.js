import type * as Hyparquet from "hyparquet";

/** Loaded on demand, so `info()` and v2 listings never pull in the parquet reader. */
export async function loadParquet(): Promise<typeof Hyparquet & { compressors: Hyparquet.Compressors }> {
	const [hyparquet, { decompress }] = await Promise.all([import("hyparquet"), import("fzstd")]);
	return {
		...hyparquet,
		/// hyparquet only decodes SNAPPY. No output buffer: fzstd throws on a page of several zstd frames.
		compressors: { ZSTD: (input) => decompress(input) },
	};
}
