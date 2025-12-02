import { ListFileEntry, listFiles } from "./list-files";

export interface MemoryRequirements {
	minimumGigabytes: number;
	recommendedGigabytes: number;
};

export interface HardwareRequirements {
	name: string;
	memory: MemoryRequirements;
};

export async function getHardwareRequirements(params: {
	/**
	 * The model name in the format of `namespace/repo`.
	 */
	name: string;
	/**
	 * The context size in tokens, default to 2048.
	 */
	contextSize?: number;
}) {
	const files = await getFiles(params.name);
	const hasSafetensors = files.some((file) => file.path.endsWith(".safetensors"));
	const hasPytorch = files.some((file) => file.path.endsWith(".pth"));

	// Get the total size of the model weight in bytes (we don't care about quantization scheme)
	let totalWeightBytes = 0;
	if (hasSafetensors) {
		totalWeightBytes = sumFileSize(files.filter((file) => file.path.endsWith(".safetensors")));
	} else if (hasPytorch) {
		totalWeightBytes = sumFileSize(files.filter((file) => file.path.endsWith(".pth")));
	}

	// Calculate the memory for context window
	// TODO: this also scales in function of weight, to be implemented later
	const contextWindow = params.contextSize ?? 2048;
	const batchSize = 256; // a bit overhead for batching
	const contextMemoryBytes = (contextWindow + batchSize) * 0.5 * 1e6;

	// Calculate the memory overhead
	const osOverheadBytes = Math.max(512 * 1e6, 0.2 * totalWeightBytes);
	
	// Calculate the total memory requirements
	const totalMemoryGb = (totalWeightBytes + contextMemoryBytes + osOverheadBytes) / 1e9;

	return {
		name: params.name,
		memory: {
			minimumGigabytes: totalMemoryGb,
			recommendedGigabytes: totalMemoryGb * 1.1,
		},
	} satisfies HardwareRequirements;
}

async function getFiles(name: string): Promise<ListFileEntry[]> {
	const files: ListFileEntry[] = [];
	const cursor = listFiles({
		repo: {
			name,
			type: "model",
		},
	});
	for await (const entry of cursor) {
		files.push(entry);
	}
	return files;
};

function sumFileSize(files: ListFileEntry[]): number {
	return files.reduce((total, file) => total + file.size, 0);
}
