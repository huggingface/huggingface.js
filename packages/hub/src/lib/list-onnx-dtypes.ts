export const ONNX_DTYPE_SUFFIX_MAPPING = {
	fp32: "",
	fp16: "_fp16",
	int8: "_int8",
	uint8: "_uint8",
	q8: "_quantized",
	q4: "_q4",
	q4f16: "_q4f16",
	bnb4: "_bnb4",
} as const;

export type OnnxDtype = keyof typeof ONNX_DTYPE_SUFFIX_MAPPING;

const SUFFIXES_LONGEST_FIRST = (Object.entries(ONNX_DTYPE_SUFFIX_MAPPING) as [OnnxDtype, string][])
	.filter(([, suffix]) => suffix !== "")
	.sort((a, b) => b[1].length - a[1].length);

export function getOnnxDtypes(params: {
	/** File paths, e.g. from siblings[].rfilename or listFiles */
	filePaths: string[];
	/** Base session file names (e.g. ["model"]). If omitted, auto-discovers. */
	baseNames?: string[];
	/** Subdirectory containing ONNX files. @default "onnx" */
	subfolder?: string;
}): OnnxDtype[] {
	const subfolder = params.subfolder ?? "onnx";
	const prefix = subfolder + "/";

	// 1. Filter to .onnx files in subfolder (not .onnx_data)
	const stems: string[] = [];
	for (const fp of params.filePaths) {
		if (!fp.startsWith(prefix)) continue;
		if (!fp.endsWith(".onnx")) continue;
		if (fp.endsWith(".onnx_data")) continue;
		// Strip prefix and extension
		stems.push(fp.slice(prefix.length, -".onnx".length));
	}

	if (stems.length === 0) return [];

	// 2. Parse each stem into (baseName, dtype)
	const parsed: Array<{ baseName: string; dtype: OnnxDtype }> = [];
	for (const stem of stems) {
		let matched = false;
		for (const [dtype, suffix] of SUFFIXES_LONGEST_FIRST) {
			if (stem.endsWith(suffix)) {
				parsed.push({ baseName: stem.slice(0, -suffix.length), dtype });
				matched = true;
				break;
			}
		}
		if (!matched) {
			// No suffix means fp32
			parsed.push({ baseName: stem, dtype: "fp32" });
		}
	}

	// 3. Collect dtypes
	const allDtypes = Object.keys(ONNX_DTYPE_SUFFIX_MAPPING) as OnnxDtype[];

	if (params.baseNames) {
		// A dtype is available only if ALL base names have a matching file
		const byDtype = new Map<OnnxDtype, Set<string>>();
		for (const { baseName, dtype } of parsed) {
			let set = byDtype.get(dtype);
			if (!set) {
				set = new Set();
				byDtype.set(dtype, set);
			}
			set.add(baseName);
		}
		return allDtypes.filter((dtype) => {
			const set = byDtype.get(dtype);
			return set !== undefined && params.baseNames?.every((bn) => set.has(bn));
		});
	}

	// Auto-discovery: return all dtypes that have at least one file
	const foundDtypes = new Set(parsed.map((p) => p.dtype));
	return allDtypes.filter((dtype) => foundDtypes.has(dtype));
}
