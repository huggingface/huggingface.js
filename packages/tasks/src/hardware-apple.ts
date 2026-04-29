import type { HardwareSpec } from "./hardware.js";

export const APPLE_SKUS: Record<string, HardwareSpec> = {
	"Apple MacBook Neo": {
		tflops: 1.9,
		memory: [8],
	},
	"Apple M1": {
		tflops: 2.6,
		memory: [8, 16],
	},
	"Apple M1 Pro": {
		tflops: 5.2,
		memory: [16, 24, 32],
	},
	"Apple M1 Max": {
		tflops: 10.4,
		memory: [16, 24, 32, 64],
	},
	"Apple M1 Ultra": {
		tflops: 21,
		memory: [16, 24, 32, 64, 96, 128],
	},
	"Apple M2": {
		tflops: 3.6,
		memory: [8, 16, 24],
	},
	"Apple M2 Pro": {
		tflops: 6.8,
		memory: [16, 24, 32],
	},
	"Apple M2 Max": {
		tflops: 13.49,
		memory: [32, 64, 96],
	},
	"Apple M2 Ultra": {
		tflops: 27.2,
		memory: [64, 96, 128, 192],
	},
	"Apple M3": {
		tflops: 4.1,
		memory: [8, 16, 24],
	},
	"Apple M3 Pro": {
		tflops: 7.4,
		memory: [18, 36],
	},
	"Apple M3 Max": {
		tflops: 14.2,
		memory: [36, 48, 64, 96, 128],
	},
	"Apple M3 Ultra": {
		tflops: 28.4,
		memory: [96, 256, 512],
	},
	"Apple M4": {
		tflops: 4.6,
		memory: [16, 24, 32],
	},
	"Apple M4 Pro": {
		tflops: 9.2,
		memory: [24, 48, 64],
	},
	"Apple M4 Max": {
		tflops: 18.4,
		memory: [36, 48, 64, 96, 128, 256, 512],
	},
	"Apple M5": {
		tflops: 5.7,
		memory: [16, 24, 32],
	},
	"Apple M5 Pro": {
		tflops: 11.4,
		memory: [24, 36, 48, 64],
	},
	"Apple M5 Max": {
		tflops: 22.8,
		memory: [36, 48, 64, 128],
	},
};
