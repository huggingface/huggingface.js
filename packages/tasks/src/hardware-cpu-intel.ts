import type { HardwareSpec } from "./hardware.js";

export const CPU_INTEL_SKUS: Record<string, HardwareSpec> = {
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
};
