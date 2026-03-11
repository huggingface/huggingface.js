import { NVIDIA_SKUS } from "./hardware-nvidia.js";

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
	/**
	 * GFX version / LLVM ISA target (AMD GPUs only), e.g. 11.0 for gfx1100
	 */
	gfxVersion?: number;
}

export const DEFAULT_MEMORY_OPTIONS = [
	8, 16, 24, 32, 40, 48, 64, 80, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048,
];

export const SKUS = {
	GPU: {
		NVIDIA: NVIDIA_SKUS,
		AMD: {
			MI300: {
				tflops: 383.0,
				memory: [192],
				gfxVersion: 9.42,
			},
			MI250: {
				tflops: 362.1,
				memory: [128],
				gfxVersion: 9.1,
			},
			MI210: {
				tflops: 181.0,
				memory: [64],
				gfxVersion: 9.1,
			},
			MI100: {
				tflops: 184.6,
				memory: [32],
				gfxVersion: 9.08,
			},
			MI60: {
				tflops: 29.5,
				memory: [32],
				gfxVersion: 9.06,
			},
			MI50: {
				tflops: 26.5,
				memory: [16, 32],
				gfxVersion: 9.06,
			},
			"R9700 PRO": {
				tflops: 95.7,
				memory: [32],
				gfxVersion: 12.01,
			},
			"RX 9070 XT": {
				tflops: 97.32,
				memory: [16],
				gfxVersion: 12.01,
			},
			"RX 9070": {
				tflops: 72.25,
				memory: [16],
				gfxVersion: 12.01,
			},
			"RX 7900 XTX": {
				tflops: 122.8,
				memory: [24],
				gfxVersion: 11,
			},
			"RX 7900 XT": {
				tflops: 103.0,
				memory: [20],
				gfxVersion: 11,
			},
			"RX 7900 GRE": {
				tflops: 91.96,
				memory: [16],
				gfxVersion: 11,
			},
			"RX 7800 XT": {
				tflops: 74.65,
				memory: [16],
				gfxVersion: 11.01,
			},
			"RX 7700 XT": {
				tflops: 70.34,
				memory: [12],
				gfxVersion: 11.01,
			},
			"RX 7600 XT": {
				tflops: 45.14,
				memory: [16, 8],
				gfxVersion: 11.02,
			},
			"RX 6950 XT": {
				tflops: 47.31,
				memory: [16],
				gfxVersion: 10.3,
			},
			"RX 6800": {
				tflops: 32.33,
				memory: [16],
				gfxVersion: 10.3,
			},
			"RX 6700 XT": {
				tflops: 26.43,
				memory: [12],
				gfxVersion: 10.31,
			},
			"RX 6700": {
				tflops: 22.58,
				memory: [10],
				gfxVersion: 10.31,
			},
			"RX 6650 XT": {
				tflops: 21.59,
				memory: [8],
				gfxVersion: 10.32,
			},
			"RX 6600 XT": {
				tflops: 21.21,
				memory: [8],
				gfxVersion: 10.32,
			},
			"RX 6600": {
				tflops: 17.86,
				memory: [8],
				gfxVersion: 10.32,
			},
			"RX 5500 XT": {
				tflops: 10.39,
				memory: [4, 8],
			},
			"Radeon Pro VII": {
				tflops: 26.11,
				memory: [16, 32],
				gfxVersion: 9.06,
			},
			"Ryzen AI Max+ 395": {
				tflops: 59.4,
				memory: [64, 96, 128],
				gfxVersion: 11.51,
			},
		},
		INTEL: {
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
		},
		QUALCOMM: {
			"Snapdragon X Elite X1E-00-1DE": {
				tflops: 4.6,
			},
			"Snapdragon X Elite X1E-84-100": {
				tflops: 4.6,
			},
			"Snapdragon X Elite X1E-80-100": {
				tflops: 3.8,
			},
			"Snapdragon X Elite X1E-78-100": {
				tflops: 3.8,
			},
			"Snapdragon X Plus X1P-64-100": {
				tflops: 3.8,
			},
		},
	},
	CPU: {
		Intel: {
			"Xeon 4th Generation (Sapphire Rapids)": {
				tflops: 1.3,
			},
			"Xeon 3th Generation (Ice Lake)": {
				tflops: 0.8,
			},
			"Xeon 2th Generation (Cascade Lake)": {
				tflops: 0.55,
			},
			"Xeon E5v4 (Broadwell)": {
				tflops: 0.25,
			},
			"Xeon E5v3 (Haswell)": {
				tflops: 0.2,
			},
			"Xeon E5v2 (Ivy Bridge)": {
				tflops: 0.15,
			},
			"Intel Core Ultra 7 265KF": {
				tflops: 1.53,
			},
			"Intel Core 14th Generation (i7)": {
				tflops: 0.8,
			},
			"Intel Core 13th Generation (i9)": {
				tflops: 0.85,
			},
			"Intel Core 13th Generation (i7)": {
				tflops: 0.82,
			},
			"Intel Core 13th Generation (i5)": {
				tflops: 0.68,
			},
			"Intel Core 13th Generation (i3)": {
				tflops: 0.57,
			},
			"Intel Core 12th Generation (i9)": {
				tflops: 0.79,
			},
			"Intel Core 12th Generation (i7)": {
				tflops: 0.77,
			},
			"Intel Core 12th Generation (i5)": {
				tflops: 0.65,
			},
			"Intel Core 12th Generation (i3)": {
				tflops: 0.53,
			},
			"Intel Core 11th Generation (i9)": {
				tflops: 0.7,
			},
			"Intel Core 11th Generation (i7)": {
				tflops: 0.6,
			},
			"Intel Core 11th Generation (i5)": {
				tflops: 0.5,
			},
			"Intel Core 11th Generation (i3)": {
				tflops: 0.35,
			},
			"Intel Core 10th Generation (i9)": {
				tflops: 0.46,
			},
			"Intel Core 10th Generation (i7)": {
				tflops: 0.46,
			},
			"Intel Core 10th Generation (i5)": {
				tflops: 0.46,
			},
			"Intel Core 10th Generation (i3)": {
				tflops: 0.44,
			},
		},
		AMD: {
			"EPYC 5th Generation Zen 5 (Turin)": {
				tflops: 13.8,
			},
			"EPYC 4th Generation Zen 4 (Genoa)": {
				tflops: 5,
			},
			"EPYC 3th Generation Zen 3 (Milan)": {
				tflops: 2.4,
			},
			"EPYC 2th Generation Zen 2 (Rome)": {
				tflops: 0.6,
			},
			"EPYC 1st Generation Zen (Naples)": {
				tflops: 0.6,
			},
			"Ryzen Threadripper Zen 5 9000 (Shimada Peak)": {
				tflops: 14.0,
			},
			"Ryzen Threadripper Zen 4 7000 (Storm Peak)": {
				tflops: 10.0,
			},
			"Ryzen Threadripper Zen 3 5000 (Chagall)": {
				tflops: 4.6,
			},
			"Ryzen Threadripper Zen 2 3000 (Castle Peak)": {
				tflops: 3.2,
			},
			"Ryzen Threadripper Zen 1000 (Whitehaven)": {
				tflops: 0.6,
			},
			"Ryzen 7 3800X (16)": {
				tflops: 1.73,
			},
			"Ryzen Zen 5 9000 (Ryzen 9)": {
				tflops: 0.56,
			},
			"Ryzen Zen 5 9000 (Ryzen 7)": {
				tflops: 0.56,
			},
			"Ryzen Zen 5 9000 (Ryzen 5)": {
				tflops: 0.56,
			},
			"Ryzen Zen 4 7000 (Ryzen 9)": {
				tflops: 0.56,
			},
			"Ryzen Zen 4 7000 (Ryzen 7)": {
				tflops: 0.56,
			},
			"Ryzen Zen 4 7000 (Ryzen 5)": {
				tflops: 0.56,
			},
			"Ryzen Zen 3 5000 (Ryzen 9)": {
				tflops: 1.33,
			},
			"Ryzen Zen 3 5000 (Ryzen 7)": {
				tflops: 1.33,
			},
			"Ryzen Zen 3 5000 (Ryzen 5)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2 3000 (Ryzen 9)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2 3000 (Ryzen 7)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2 3000 (Ryzen 5)": {
				tflops: 0.72,
			},
			"Ryzen Zen 2 3000 (Ryzen 3)": {
				tflops: 0.72,
			},
			"Ryzen AI 300 (Ryzen AI 9 HX)": {
				tflops: 5.52,
			},
			"Ryzen AI 300 (Ryzen AI 9)": {
				tflops: 5.2,
			},
			"Ryzen AI 300 (Ryzen AI 7)": {
				tflops: 4.34,
			},
			"Ryzen AI 300 (Ryzen AI 5)": {
				tflops: 1.57,
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
		},
	},
} satisfies Record<string, Record<string, Record<string, HardwareSpec>>>;

export type SkuType = keyof typeof SKUS;
