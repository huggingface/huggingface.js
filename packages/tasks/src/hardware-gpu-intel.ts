import type { HardwareSpec } from "./hardware.js";

export const GPU_INTEL_SKUS: Record<string, HardwareSpec> = {
	"Arc A750": {
		tflops: 34.41,
		memory: [8],
	},
	"Arc A770": {
		tflops: 39.32,
		memory: [8, 16],
	},
	"Arc B570": {
		tflops: 23.04,
		memory: [10],
	},
	"Arc B580": {
		tflops: 27.34,
		memory: [12],
	},
	"Arc B50": {
		tflops: 21.3,
		memory: [16],
	},
	"Arc B60": {
		tflops: 24.58,
		memory: [24, 48],
	},
};
