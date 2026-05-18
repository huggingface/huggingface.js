import { AMD_GPU_SKUS } from "./hardware-amd.js";
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
	 * Approximate MSRP in USD at launch. For SKUs with multiple memory variants,
	 * the price corresponds to the largest memory variant. For datacenter GPUs
	 * sold via OEMs without a public MSRP (H100, MI300X, ...), this is a
	 * widely-reported street price. For mobile/laptop GPUs that are not sold
	 * standalone, this is the approximate module/BOM cost. For Apple Silicon
	 * SoCs, this is the price of a Mac configured with that chip and the
	 * largest memory option. For CPU "family" entries (e.g. "Xeon 4th Gen",
	 * "Ryzen Zen 4 7000 (Ryzen 9)"), this is the tray/box price of a
	 * representative flagship SKU at launch.
	 */
	msrp: number;
	/**
	 * Approximate maximum sustained power draw in watts. For GPUs with multiple
	 * form factors (e.g. H100 SXM vs PCIe), uses the highest variant. For CPUs,
	 * uses max turbo power (PL2 / MTP for Intel, PPT for AMD), not base TDP.
	 * For Apple Silicon and Snapdragon SoCs, an estimated package power based
	 * on benchmarks/teardowns (Apple does not publish TDP).
	 */
	power: number;
	/**
	 * Year the SKU first became available. For SKUs refreshed later with
	 * additional memory variants (e.g. A100 40GB → 80GB, RTX 2060 → 12GB),
	 * this is the original launch year. For CPU "family" entries, this is
	 * the year the family debuted.
	 */
	releaseYear: number;
}

export const DEFAULT_MEMORY_OPTIONS = [
	8, 16, 24, 32, 40, 48, 64, 80, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048,
];

export const SKUS = {
	GPU: {
		NVIDIA: NVIDIA_SKUS,
		AMD: AMD_GPU_SKUS,
		INTEL: {
			"Arc A750": {
				tflops: 34.41,
				memory: [8],
				msrp: 250,
				power: 225,
				releaseYear: 2022,
			},
			"Arc A770": {
				tflops: 39.32,
				memory: [8, 16],
				msrp: 350,
				power: 225,
				releaseYear: 2022,
			},
			"Arc B570": {
				tflops: 23.04,
				memory: [10],
				msrp: 200,
				power: 150,
				releaseYear: 2025,
			},
			"Arc B580": {
				tflops: 27.34,
				memory: [12],
				msrp: 250,
				power: 190,
				releaseYear: 2024,
			},
			"Arc B50": {
				tflops: 21.3,
				memory: [16],
				msrp: 350,
				power: 70,
				releaseYear: 2025,
			},
			"Arc B60": {
				tflops: 24.58,
				memory: [24, 48],
				msrp: 1_200,
				power: 200,
				releaseYear: 2025,
			},
		},
		QUALCOMM: {
			"Snapdragon X Elite X1E-00-1DE": {
				tflops: 4.6,
				msrp: 900,
				power: 80,
				releaseYear: 2024,
			},
			"Snapdragon X Elite X1E-84-100": {
				tflops: 4.6,
				msrp: 1_700,
				power: 30,
				releaseYear: 2024,
			},
			"Snapdragon X Elite X1E-80-100": {
				tflops: 3.8,
				msrp: 1_300,
				power: 23,
				releaseYear: 2024,
			},
			"Snapdragon X Elite X1E-78-100": {
				tflops: 3.8,
				msrp: 1_200,
				power: 23,
				releaseYear: 2024,
			},
			"Snapdragon X Plus X1P-64-100": {
				tflops: 3.8,
				msrp: 1_000,
				power: 23,
				releaseYear: 2024,
			},
		},
	},
	CPU: {
		Intel: {
			"Xeon 4th Generation (Sapphire Rapids)": {
				tflops: 1.3,
				msrp: 10_500,
				power: 350,
				releaseYear: 2023,
			},
			"Xeon 3th Generation (Ice Lake)": {
				tflops: 0.8,
				msrp: 8_000,
				power: 270,
				releaseYear: 2021,
			},
			"Xeon 2th Generation (Cascade Lake)": {
				tflops: 0.55,
				msrp: 10_000,
				power: 205,
				releaseYear: 2019,
			},
			"Xeon E5v4 (Broadwell)": {
				tflops: 0.25,
				msrp: 4_000,
				power: 145,
				releaseYear: 2016,
			},
			"Xeon E5v3 (Haswell)": {
				tflops: 0.2,
				msrp: 4_000,
				power: 145,
				releaseYear: 2014,
			},
			"Xeon E5v2 (Ivy Bridge)": {
				tflops: 0.15,
				msrp: 2_500,
				power: 130,
				releaseYear: 2013,
			},
			"Intel Core Ultra 9 275HX": {
				tflops: 1.89,
				msrp: 700,
				power: 160,
				releaseYear: 2025,
			},
			"Intel Core Ultra 7 265KF": {
				tflops: 1.53,
				msrp: 400,
				power: 250,
				releaseYear: 2024,
			},
			"Intel Core 14th Generation (i7)": {
				tflops: 0.8,
				msrp: 400,
				power: 253,
				releaseYear: 2023,
			},
			"Intel Core 13th Generation (i9)": {
				tflops: 0.85,
				msrp: 600,
				power: 253,
				releaseYear: 2022,
			},
			"Intel Core 13th Generation (i7)": {
				tflops: 0.82,
				msrp: 400,
				power: 253,
				releaseYear: 2022,
			},
			"Intel Core 13th Generation (i5)": {
				tflops: 0.68,
				msrp: 300,
				power: 181,
				releaseYear: 2022,
			},
			"Intel Core 13th Generation (i3)": {
				tflops: 0.57,
				msrp: 150,
				power: 89,
				releaseYear: 2023,
			},
			"Intel Core 12th Generation (i9)": {
				tflops: 0.79,
				msrp: 600,
				power: 241,
				releaseYear: 2021,
			},
			"Intel Core 12th Generation (i7)": {
				tflops: 0.77,
				msrp: 400,
				power: 190,
				releaseYear: 2021,
			},
			"Intel Core 12th Generation (i5)": {
				tflops: 0.65,
				msrp: 300,
				power: 150,
				releaseYear: 2021,
			},
			"Intel Core 12th Generation (i3)": {
				tflops: 0.53,
				msrp: 150,
				power: 89,
				releaseYear: 2022,
			},
			"Intel Core 11th Generation (i9)": {
				tflops: 0.7,
				msrp: 550,
				power: 251,
				releaseYear: 2021,
			},
			"Intel Core 11th Generation (i7)": {
				tflops: 0.6,
				msrp: 400,
				power: 251,
				releaseYear: 2021,
			},
			"Intel Core 11th Generation (i5)": {
				tflops: 0.5,
				msrp: 250,
				power: 182,
				releaseYear: 2021,
			},
			"Intel Core 11th Generation (i3)": {
				tflops: 0.35,
				msrp: 150,
				power: 65,
				releaseYear: 2021,
			},
			"Intel Core 10th Generation (i9)": {
				tflops: 0.46,
				msrp: 500,
				power: 250,
				releaseYear: 2020,
			},
			"Intel Core 10th Generation (i7)": {
				tflops: 0.46,
				msrp: 400,
				power: 215,
				releaseYear: 2020,
			},
			"Intel Core 10th Generation (i5)": {
				tflops: 0.46,
				msrp: 250,
				power: 150,
				releaseYear: 2020,
			},
			"Intel Core 10th Generation (i3)": {
				tflops: 0.44,
				msrp: 150,
				power: 65,
				releaseYear: 2020,
			},
		},
		AMD: {
			"EPYC 5th Generation Zen 5 (Turin)": {
				tflops: 13.8,
				msrp: 13_000,
				power: 500,
				releaseYear: 2024,
			},
			"EPYC 4th Generation Zen 4 (Genoa)": {
				tflops: 5,
				msrp: 11_500,
				power: 360,
				releaseYear: 2022,
			},
			"EPYC 3th Generation Zen 3 (Milan)": {
				tflops: 2.4,
				msrp: 8_000,
				power: 280,
				releaseYear: 2021,
			},
			"EPYC 2th Generation Zen 2 (Rome)": {
				tflops: 0.6,
				msrp: 7_000,
				power: 225,
				releaseYear: 2019,
			},
			"EPYC 1st Generation Zen (Naples)": {
				tflops: 0.6,
				msrp: 4_000,
				power: 180,
				releaseYear: 2017,
			},
			"Ryzen Threadripper Zen 5 9000 (Shimada Peak)": {
				tflops: 14.0,
				msrp: 5_000,
				power: 350,
				releaseYear: 2025,
			},
			"Ryzen Threadripper Zen 4 7000 (Storm Peak)": {
				tflops: 10.0,
				msrp: 5_000,
				power: 350,
				releaseYear: 2023,
			},
			"Ryzen Threadripper Zen 3 5000 (Chagall)": {
				tflops: 4.6,
				msrp: 6_500,
				power: 280,
				releaseYear: 2022,
			},
			"Ryzen Threadripper Zen 2 3000 (Castle Peak)": {
				tflops: 3.2,
				msrp: 4_000,
				power: 280,
				releaseYear: 2019,
			},
			"Ryzen Threadripper Zen 1000 (Whitehaven)": {
				tflops: 0.6,
				msrp: 1_000,
				power: 180,
				releaseYear: 2017,
			},
			"Ryzen 7 3800X (16)": {
				tflops: 1.73,
				msrp: 400,
				power: 105,
				releaseYear: 2019,
			},
			"Ryzen Zen 5 9000 (Ryzen 9)": {
				tflops: 0.56,
				msrp: 650,
				power: 230,
				releaseYear: 2024,
			},
			"Ryzen Zen 5 9000 (Ryzen 7)": {
				tflops: 0.56,
				msrp: 350,
				power: 105,
				releaseYear: 2024,
			},
			"Ryzen Zen 5 9000 (Ryzen 5)": {
				tflops: 0.56,
				msrp: 300,
				power: 105,
				releaseYear: 2024,
			},
			"Ryzen Zen 4 7000 (Ryzen 9)": {
				tflops: 0.56,
				msrp: 700,
				power: 230,
				releaseYear: 2022,
			},
			"Ryzen Zen 4 7000 (Ryzen 7)": {
				tflops: 0.56,
				msrp: 400,
				power: 142,
				releaseYear: 2022,
			},
			"Ryzen Zen 4 7000 (Ryzen 5)": {
				tflops: 0.56,
				msrp: 300,
				power: 142,
				releaseYear: 2022,
			},
			"Ryzen Zen 3 5000 (Ryzen 9)": {
				tflops: 1.33,
				msrp: 800,
				power: 142,
				releaseYear: 2020,
			},
			"Ryzen Zen 3 5000 (Ryzen 7)": {
				tflops: 1.33,
				msrp: 450,
				power: 142,
				releaseYear: 2020,
			},
			"Ryzen Zen 3 5000 (Ryzen 5)": {
				tflops: 0.72,
				msrp: 300,
				power: 88,
				releaseYear: 2020,
			},
			"Ryzen Zen 2 3000 (Ryzen 9)": {
				tflops: 0.72,
				msrp: 750,
				power: 142,
				releaseYear: 2019,
			},
			"Ryzen Zen 2 3000 (Ryzen 7)": {
				tflops: 0.72,
				msrp: 400,
				power: 142,
				releaseYear: 2019,
			},
			"Ryzen Zen 2 3000 (Ryzen 5)": {
				tflops: 0.72,
				msrp: 250,
				power: 88,
				releaseYear: 2019,
			},
			"Ryzen Zen 2 3000 (Ryzen 3)": {
				tflops: 0.72,
				msrp: 150,
				power: 88,
				releaseYear: 2020,
			},
			"Ryzen AI 300 (Ryzen AI 9 HX)": {
				tflops: 5.52,
				msrp: 500,
				power: 54,
				releaseYear: 2024,
			},
			"Ryzen AI 300 (Ryzen AI 9)": {
				tflops: 5.2,
				msrp: 450,
				power: 54,
				releaseYear: 2024,
			},
			"Ryzen AI 300 (Ryzen AI 7)": {
				tflops: 4.34,
				msrp: 350,
				power: 54,
				releaseYear: 2024,
			},
			"Ryzen AI 300 (Ryzen AI 5)": {
				tflops: 1.57,
				msrp: 250,
				power: 28,
				releaseYear: 2024,
			},
		},
	},
	"Apple Silicon": {
		"-": {
			"Apple MacBook Neo": {
				tflops: 1.9,
				memory: [8],
				msrp: 700,
				power: 10,
				releaseYear: 2026,
			},
			"Apple M1": {
				tflops: 2.6,
				memory: [8, 16],
				msrp: 1_250,
				power: 15,
				releaseYear: 2020,
			},
			"Apple M1 Pro": {
				tflops: 5.2,
				memory: [16, 24, 32],
				msrp: 2_900,
				power: 30,
				releaseYear: 2021,
			},
			"Apple M1 Max": {
				tflops: 10.4,
				memory: [16, 24, 32, 64],
				msrp: 3_900,
				power: 60,
				releaseYear: 2021,
			},
			"Apple M1 Ultra": {
				tflops: 21,
				memory: [16, 24, 32, 64, 96, 128],
				msrp: 6_200,
				power: 120,
				releaseYear: 2022,
			},
			"Apple M2": {
				tflops: 3.6,
				memory: [8, 16, 24],
				msrp: 1_500,
				power: 20,
				releaseYear: 2022,
			},
			"Apple M2 Pro": {
				tflops: 6.8,
				memory: [16, 24, 32],
				msrp: 2_800,
				power: 35,
				releaseYear: 2023,
			},
			"Apple M2 Max": {
				tflops: 13.49,
				memory: [32, 64, 96],
				msrp: 4_500,
				power: 80,
				releaseYear: 2023,
			},
			"Apple M2 Ultra": {
				tflops: 27.2,
				memory: [64, 96, 128, 192],
				msrp: 7_000,
				power: 150,
				releaseYear: 2023,
			},
			"Apple M3": {
				tflops: 4.1,
				memory: [8, 16, 24],
				msrp: 1_500,
				power: 22,
				releaseYear: 2023,
			},
			"Apple M3 Pro": {
				tflops: 7.4,
				memory: [18, 36],
				msrp: 2_400,
				power: 40,
				releaseYear: 2023,
			},
			"Apple M3 Max": {
				tflops: 14.2,
				memory: [36, 48, 64, 96, 128],
				msrp: 5_000,
				power: 90,
				releaseYear: 2023,
			},
			"Apple M3 Ultra": {
				tflops: 28.4,
				memory: [96, 256, 512],
				msrp: 9_500,
				power: 180,
				releaseYear: 2025,
			},
			"Apple M4": {
				tflops: 4.6,
				memory: [16, 24, 32],
				msrp: 1_600,
				power: 22,
				releaseYear: 2024,
			},
			"Apple M4 Pro": {
				tflops: 9.2,
				memory: [24, 48, 64],
				msrp: 2_600,
				power: 45,
				releaseYear: 2024,
			},
			"Apple M4 Max": {
				tflops: 18.4,
				memory: [36, 48, 64, 128],
				msrp: 5_000,
				power: 100,
				releaseYear: 2024,
			},
			"Apple M5": {
				tflops: 5.7,
				memory: [16, 24, 32],
				msrp: 2_000,
				power: 25,
				releaseYear: 2025,
			},
			"Apple M5 Pro": {
				tflops: 11.4,
				memory: [24, 36, 48, 64],
				msrp: 2_900,
				power: 50,
				releaseYear: 2026,
			},
			"Apple M5 Max": {
				tflops: 22.8,
				memory: [36, 48, 64, 128],
				msrp: 5_000,
				power: 110,
				releaseYear: 2026,
			},
		},
	},
} satisfies Record<string, Record<string, Record<string, HardwareSpec>>>;

export type SkuType = keyof typeof SKUS;
