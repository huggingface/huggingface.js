/**
 * Biden AI Executive Order
 * https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/
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
	 * Approximate value, in FP32.
	 * This is only approximate/theoretical and shouldn't be taken too seriously.
	 * Currently the CPU values are from cpu-monkey.com
	 * while the GPU values are from techpowerup.com
	 *
	 * Note to reviewers: I got fed up with data entry,
	 * and HuggingChat running Llama3 with Web search was failing a bit,
	 * so some of those values are kinda random. Forgive me and please feel free to improve.
	 */
	tflops: number;
	/**
	 * If an array is specified, options of memory size (can be VRAM, unified RAM)
	 * e.g. an A100 exists in 40 or 80 GB.
	 */
	memory?: number[];
}

export const DEFAULT_MEMORY_OPTIONS = [8, 16, 24, 32, 40, 48, 64, 80, 96, 128];

export const SKUS = {
	GPU: {
		NVIDIA: {
			H100: {
				tflops: 51.22,
				memory: [80],
			},
			L40: {
				tflops: 90.52,
				memory: [48],
			},
			"RTX 6000 Ada": {
				tflops: 91.1,
				memory: [48],
			},
			A100: {
				tflops: 19.49,
				memory: [80, 40],
			},
			A40: {
				tflops: 37.42,
				memory: [48],
			},
			A10: {
				tflops: 31.24,
				memory: [24],
			},
			T4: {
				tflops: 8.141,
				memory: [16],
			},
			"RTX 4090": {
				tflops: 82.58,
				memory: [24],
			},
			"RTX 4080 SUPER": {
				tflops: 52.2,
				memory: [16],
			},
			"RTX 4080": {
				tflops: 48.7,
				memory: [16],
			},
			"RTX 4070": {
				tflops: 29.15,
				memory: [12],
			},
			"RTX 4070 Ti": {
				tflops: 40.09,
				memory: [12],
			},
			"RTX 4070 Super": {
				tflops: 35.48,
				memory: [12],
			},
			"RTX 4070 Ti Super": {
				tflops: 44.1,
				memory: [16],
			},
			"RTX 3090": {
				tflops: 35.58,
				memory: [24],
			},
			"RTX 3090 Ti": {
				tflops: 40,
				memory: [24],
			},
			"RTX 3080 Ti": {
				tflops: 34.1,
				memory: [12],
			},
			"RTX 3080": {
				tflops: 30.6,
				memory: [12, 10],
			},
		},
		AMD: {
			MI300: {
				tflops: 47.87,
				memory: [192],
			},
			MI250: {
				tflops: 45.26,
				memory: [128],
			},
			MI210: {
				tflops: 22.63,
				memory: [64],
			},
			"RX 7900 XTX": {
				tflops: 61.39,
				memory: [24],
			},
			"RX 7900 XT": {
				tflops: 51.48,
				memory: [20],
			},
			"RX 7900 GRE": {
				tflops: 45.98,
				memory: [16],
			},
			"RX 7800 XT": {
				tflops: 7.57,
				memory: [16],
			},
			"RX 7700 XT": {
				tflops: 7.57,
				memory: [12],
			},
			"RX 7600 XT": {
				tflops: 7.57,
				memory: [16, 8],
			},
		},
	},
	CPU: {
		Intel: {
			"Xeon 4th Generation (Sapphire Rapids)": {
				tflops: 3.8,
			},
			"Xeon 3th Generation (Ice Lake)": {
				tflops: 3.6,
			},
			"Xeon 2th Generation (Cascade Lake)": {
				tflops: 3,
			},
			"Intel Core 13th Generation (i9)": {
				tflops: 3.8,
			},
			"Intel Core 13th Generation (i7)": {
				tflops: 3.6,
			},
			"Intel Core 13th Generation (i5)": {
				tflops: 3,
			},
			"Intel Core 13th Generation (i3)": {
				tflops: 2,
			},
			"Intel Core 12th Generation (i9)": {
				tflops: 2,
			},
			"Intel Core 12th Generation (i7)": {
				tflops: 2,
			},
			"Intel Core 12th Generation (i5)": {
				tflops: 2,
			},
			"Intel Core 12th Generation (i3)": {
				tflops: 1,
			},
			"Intel Core 11th Generation (i9)": {
				tflops: 1,
			},
			"Intel Core 11th Generation (i7)": {
				tflops: 0.76,
			},
			"Intel Core 11th Generation (i5)": {
				tflops: 0.76,
			},
			"Intel Core 11th Generation (i3)": {
				tflops: 0.76,
			},
			"Intel Core 10th Generation (i9)": {
				tflops: 0.76,
			},
			"Intel Core 10th Generation (i7)": {
				tflops: 0.76,
			},
			"Intel Core 10th Generation (i5)": {
				tflops: 0.76,
			},
			"Intel Core 10th Generation (i3)": {
				tflops: 0.76,
			},
		},
		AMD: {
			"EPYC 4th Generation (Genoa)": {
				tflops: 4,
			},
			"EPYC 3th Generation (Milan)": {
				tflops: 3,
			},
			"EPYC 2th Generation (Rome)": {
				tflops: 2.9,
			},
			"EPYC 1st Generation (Naples)": {
				tflops: 2.3,
			},
			"Ryzen Zen4 7000 (Ryzen 9)": {
				tflops: 2.3,
			},
			"Ryzen Zen4 7000 (Ryzen 7)": {
				tflops: 1.33,
			},
			"Ryzen Zen4 7000 (Ryzen 5)": {
				tflops: 1.33,
			},
			"Ryzen Zen3 5000 (Ryzen 9)": {
				tflops: 1.33,
			},
			"Ryzen Zen3 5000 (Ryzen 7)": {
				tflops: 1.33,
			},
			"Ryzen Zen3 5000 (Ryzen 5)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2  3000 (Threadripper)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2  3000 (Ryzen 9)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2  3000 (Ryzen 7)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2  3000 (Ryzen 5)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2  3000 (Ryzen 3)": {
				tflops: 0.72,
			},
		},
	},
	"Apple Silicon": {
		"-": {
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
				tflops: 13.6,
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
				tflops: 2.84,
				memory: [8, 16, 24],
			},
			"Apple M3 Pro": {
				tflops: 14,
				memory: [18, 36],
			},
			"Apple M3 Max": {
				tflops: 14.2,
				memory: [36, 48, 64, 96, 128],
			},
		},
	},
} satisfies Record<string, Record<string, Record<string, HardwareSpec>>>;

export type SkuType = keyof typeof SKUS;
