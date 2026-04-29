import { GPU_AMD_SKUS } from "./hardware-gpu-amd.js";
import { GPU_NVIDIA_SKUS } from "./hardware-gpu-nvidia.js";
import { GPU_INTEL_SKUS } from "./hardware-gpu-intel.js";
import { GPU_QUALCOMM_SKUS } from "./hardware-gpu-qualcomm.js";
import { CPU_INTEL_SKUS } from "./hardware-cpu-intel.js";
import { CPU_AMD_SKUS } from "./hardware-cpu-amd.js";
import { APPLE_SKUS } from "./hardware-apple.js";

/**
 * Biden AI Executive Order (since revoked by President Trump):
 * https://web.archive.org/web/20250105222429/https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/
 */
export const TFLOPS_THRESHOLD_WHITE_HOUSE_MODEL_TRAINING_TOTAL = 10 ** 14;
export const TFLOPS_THRESHOLD_WHITE_HOUSE_MODEL_TRAINING_TOTAL_BIOLOGY = 10 ** 11;
export const TFLOPS_THRESHOLD_WHITE_HOUSE_CLUSTER = 10 ** 8;

/**
 * EU AI Act
 * https://ec.europa.eu/commission/presscorner/detail/en/qanda_21_1683
 */
export const TFLOPS_THRESHOLD_EU_AI_ACT_MODEL_TRAINING_TOTAL = 10 ** 13;

export interface HardwareSpec {
	/**
	 * Approximate value, in FP16 whenever possible for GPUs and FP32 for CPUs.
	 * This is only approximate/theoretical and shouldn't be taken too seriously.
	 * Currently the CPU values are from cpu-monkey.com
	 * while the GPU values are from techpowerup.com
	 *
	 * Note to reviewers: I got fed up with data entry,
	 * and HuggingChat running Llama3 with Web search was failing a bit,
	 * so some of those values might be slightly inaccurate. Forgive me and please feel free to improve.
	 */
	tflops: number;
	/**
	 * If an array is specified, options of memory size (can be VRAM, unified RAM)
	 * e.g. an A100 exists in 40 or 80 GB.
	 */
	memory?: number[];
}

export const DEFAULT_MEMORY_OPTIONS = [
	8, 16, 24, 32, 40, 48, 64, 80, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048,
];

export const SKUS = {
	GPU: {
		NVIDIA: GPU_NVIDIA_SKUS,
		AMD: GPU_AMD_SKUS,
		INTEL: GPU_INTEL_SKUS,
		QUALCOMM: GPU_QUALCOMM_SKUS,
	},
	CPU: {
		Intel: CPU_INTEL_SKUS,
		AMD: CPU_AMD_SKUS,
	},
	"Apple Silicon": {
		"-": APPLE_SKUS,
	},
} satisfies Record<string, Record<string, Record<string, HardwareSpec>>>;

export type SkuType = keyof typeof SKUS;
