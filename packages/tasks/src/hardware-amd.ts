import type { HardwareSpec } from "./hardware.js";

export interface AmdGpuHardwareSpec extends HardwareSpec {
	/**
	 * GFX version / LLVM ISA target (AMD GPUs only), e.g. "gfx1100"
	 *
	 * potential source https://llvm.org/docs/AMDGPUUsage.html#processors
	 */
	gfxVersion: string;
}

export const AMD_GPU_SKUS: Record<string, AmdGpuHardwareSpec> = {
	MI300: {
		tflops: 383.0,
		memory: [192],
		gfxVersion: "gfx942",
	},
	MI250: {
		tflops: 362.1,
		memory: [128],
		gfxVersion: "gfx90a",
	},
	MI210: {
		tflops: 181.0,
		memory: [64],
		gfxVersion: "gfx90a",
	},
	MI100: {
		tflops: 184.6,
		memory: [32],
		gfxVersion: "gfx908",
	},
	MI60: {
		tflops: 29.5,
		memory: [32],
		gfxVersion: "gfx906",
	},
	MI50: {
		tflops: 26.5,
		memory: [16, 32],
		gfxVersion: "gfx906",
	},
	"R9700 PRO": {
		tflops: 95.7,
		memory: [32],
		gfxVersion: "gfx1201",
	},
	"RX 9070 XT": {
		tflops: 97.32,
		memory: [16],
		gfxVersion: "gfx1201",
	},
	"RX 9070": {
		tflops: 72.25,
		memory: [16],
		gfxVersion: "gfx1201",
	},
	"RX 9060 XT": {
		tflops: 51.28,
		memory: [8, 16],
		gfxVersion: "gfx1200",
	},
	"RX 7900 XTX": {
		tflops: 122.8,
		memory: [24],
		gfxVersion: "gfx1100",
	},
	"RX 7900 XT": {
		tflops: 103.0,
		memory: [20],
		gfxVersion: "gfx1100",
	},
	"RX 7900 GRE": {
		tflops: 91.96,
		memory: [16],
		gfxVersion: "gfx1100",
	},
	"RX 7800 XT": {
		tflops: 74.65,
		memory: [16],
		gfxVersion: "gfx1101",
	},
	"RX 7700 XT": {
		tflops: 70.34,
		memory: [12],
		gfxVersion: "gfx1101",
	},
	"RX 7600 XT": {
		tflops: 45.14,
		memory: [16, 8],
		gfxVersion: "gfx1102",
	},
	"RX 6950 XT": {
		tflops: 47.31,
		memory: [16],
		gfxVersion: "gfx1030",
	},
	"RX 6800": {
		tflops: 32.33,
		memory: [16],
		gfxVersion: "gfx1030",
	},
	"RX 6700 XT": {
		tflops: 26.43,
		memory: [12],
		gfxVersion: "gfx1031",
	},
	"RX 6700": {
		tflops: 22.58,
		memory: [10],
		gfxVersion: "gfx1031",
	},
	"RX 6650 XT": {
		tflops: 21.59,
		memory: [8],
		gfxVersion: "gfx1032",
	},
	"RX 6600 XT": {
		tflops: 21.21,
		memory: [8],
		gfxVersion: "gfx1032",
	},
	"RX 6600": {
		tflops: 17.86,
		memory: [8],
		gfxVersion: "gfx1032",
	},
	"RX 5500 XT": {
		tflops: 10.39,
		memory: [4, 8],
		gfxVersion: "gfx1012",
	},
	"Radeon Pro V620": {
		tflops: 40.55,
		memory: [32],
		gfxVersion: "gfx1030",
	},
	"Radeon Pro VII": {
		tflops: 26.11,
		memory: [16, 32],
		gfxVersion: "gfx906",
	},
	"Ryzen AI Max+ 395": {
		tflops: 59.4,
		memory: [64, 96, 128],
		gfxVersion: "gfx1151",
	},
};
