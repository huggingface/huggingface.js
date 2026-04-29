import type { HardwareSpec } from "./hardware.js";

export interface NvidiaHardwareSpec extends HardwareSpec {
	/**
	 * CUDA Compute Capability (NVIDIA GPUs only)
	 *
	 * potential source https://developer.nvidia.com/cuda/gpus
	 */
	computeCapability: number;
}

export enum NvidiaComputeCapabilities {
	BLACKWELL_ULTRA = 12.1,
	BLACKWELL_RTX = 12.0,
	BLACKWELL = 10.0,
	HOPPER = 9.0,
	ADA_LOVELACE = 8.9,
	ORIN = 8.7,
	AMPERE_RTX = 8.6,
	AMPERE = 8.0,
	TURING = 7.5,
	XAVIER = 7.2,
	VOLTA = 7.0,
	PASCAL_TEGRA = 6.2,
	PASCAL = 6.1,
	PASCAL_DATACENTER = 6.0,
	MAXWELL = 5.3,
}

export const NVIDIA_SKUS: Record<string, NvidiaHardwareSpec> = {
	B200: {
		tflops: 496.6,
		memory: [192],
		computeCapability: 10.0,
	},
	H200: {
		tflops: 241.3,
		memory: [141],
		computeCapability: 9.0,
	},
	H100: {
		tflops: 267.6,
		memory: [80],
		computeCapability: 9.0,
	},
	L40s: {
		tflops: 91.61,
		memory: [48],
		computeCapability: 8.9,
	},
	L40: {
		tflops: 90.52,
		memory: [48],
		computeCapability: 8.9,
	},
	L20: {
		tflops: 59.35,
		memory: [48],
		computeCapability: 8.9,
	},
	L4: {
		tflops: 30.29,
		memory: [24],
		computeCapability: 8.9,
	},
	GB10: {
		tflops: 29.71,
		memory: [128],
		computeCapability: 12.1,
	},
	"RTX PRO 6000 WS": {
		tflops: 126,
		memory: [96],
		computeCapability: 12.0,
	},
	"RTX PRO 6000 Max-Q": {
		tflops: 116,
		memory: [96],
		computeCapability: 12.0,
	},
	"RTX 6000 Ada": {
		tflops: 91.1,
		memory: [48],
		computeCapability: 8.9,
	},
	"RTX 5880 Ada": {
		tflops: 69.3,
		memory: [48],
		computeCapability: 8.9,
	},
	"RTX 5000 Ada": {
		tflops: 65.3,
		memory: [32],
		computeCapability: 8.9,
	},
	"RTX 4500 Ada": {
		tflops: 39.6,
		memory: [24],
		computeCapability: 8.9,
	},
	"RTX 4000 Ada": {
		tflops: 26.7,
		memory: [20],
		computeCapability: 8.9,
	},
	"RTX 4000 SFF Ada": {
		tflops: 19.2,
		memory: [20],
		computeCapability: 8.9,
	},
	"RTX 2000 Ada": {
		tflops: 12.0,
		memory: [16],
		computeCapability: 8.9,
	},
	"RTX A6000": {
		tflops: 38.7,
		memory: [48],
		computeCapability: 8.6,
	},
	"RTX A5000": {
		tflops: 27.77,
		memory: [8, 12, 24],
		computeCapability: 8.6,
	},
	"RTX A5000 Max-Q": {
		tflops: 16.59,
		memory: [16],
		computeCapability: 8.6,
	},
	"RTX A5000 Mobile": {
		tflops: 19.35,
		memory: [16],
		computeCapability: 8.6,
	},
	"RTX A4000": {
		tflops: 19.17,
		memory: [16],
		computeCapability: 8.6,
	},
	"RTX A4000 Max-Q": {
		tflops: 14.28,
		memory: [8],
		computeCapability: 8.6,
	},
	"RTX A4000 Mobile": {
		tflops: 17.2,
		memory: [8],
		computeCapability: 8.6,
	},
	"RTX A3000 Mobile": {
		tflops: 10.9,
		memory: [6, 12],
		computeCapability: 8.6,
	},
	"RTX A2000": {
		tflops: 7.987,
		memory: [6, 12],
		computeCapability: 8.6,
	},
	"RTX A2000 Embedded": {
		tflops: 6.026,
		memory: [4],
		computeCapability: 8.6,
	},
	"RTX A2000 Max-Q": {
		tflops: 6.1,
		memory: [4, 8],
		computeCapability: 8.6,
	},
	"RTX A2000 Mobile": {
		tflops: 8.4,
		memory: [4, 8],
		computeCapability: 8.6,
	},
	A100: {
		tflops: 77.97,
		memory: [80, 40],
		computeCapability: 8.0,
	},
	A40: {
		tflops: 37.42,
		memory: [48],
		computeCapability: 8.6,
	},
	A30: {
		tflops: 10.32,
		memory: [24],
		computeCapability: 8.0,
	},
	A10: {
		tflops: 31.24,
		memory: [24],
		computeCapability: 8.6,
	},
	A2: {
		tflops: 4.531,
		memory: [16],
		computeCapability: 8.6,
	},
	"RTX 5090": {
		tflops: 104.8,
		memory: [32],
		computeCapability: 12.0,
	},
	"RTX 5090 D": {
		tflops: 104.8,
		memory: [32],
		computeCapability: 12.0,
	},
	"RTX 5090 Mobile": {
		tflops: 31.8,
		memory: [24],
		computeCapability: 12.0,
	},
	"RTX 5080": {
		tflops: 56.28,
		memory: [16],
		computeCapability: 12.0,
	},
	"RTX 5080 Mobile": {
		tflops: 23.04,
		memory: [16],
		computeCapability: 12.0,
	},
	"RTX 5070": {
		tflops: 30.84,
		memory: [12],
		computeCapability: 12.0,
	},
	"RTX 5070 Mobile": {
		tflops: 13.13,
		memory: [8],
		computeCapability: 12.0,
	},
	"RTX 5070 Ti": {
		tflops: 43.94,
		memory: [16],
		computeCapability: 12.0,
	},
	"RTX 5070 Ti Mobile": {
		tflops: 17.04,
		memory: [12],
		computeCapability: 12.0,
	},
	"RTX 5060 Ti": {
		tflops: 23.7,
		memory: [16, 8],
		computeCapability: 12.0,
	},
	"RTX 5060": {
		tflops: 19.18,
		memory: [8],
		computeCapability: 12.0,
	},
	"RTX 5060 Mobile": {
		tflops: 9.684,
		memory: [8],
		computeCapability: 12.0,
	},
	"RTX 4090": {
		tflops: 82.58,
		memory: [24],
		computeCapability: 8.9,
	},
	"RTX 4090D": {
		tflops: 79.49,
		memory: [24, 48],
		computeCapability: 8.9,
	},
	"RTX 4090 Mobile": {
		tflops: 32.98,
		memory: [16],
		computeCapability: 8.9,
	},
	"RTX 4080 SUPER": {
		tflops: 52.2,
		memory: [16],
		computeCapability: 8.9,
	},
	"RTX 4080": {
		tflops: 48.7,
		memory: [16],
		computeCapability: 8.9,
	},
	"RTX 4080 Mobile": {
		tflops: 24.72,
		memory: [12],
		computeCapability: 8.9,
	},
	"RTX 4070": {
		tflops: 29.15,
		memory: [12],
		computeCapability: 8.9,
	},
	"RTX 4070 Mobile": {
		tflops: 15.62,
		memory: [8],
		computeCapability: 8.9,
	},
	"RTX 4070 Ti": {
		tflops: 40.09,
		memory: [12],
		computeCapability: 8.9,
	},
	"RTX 4070 Super": {
		tflops: 35.48,
		memory: [12],
		computeCapability: 8.9,
	},
	"RTX 4070 Ti Super": {
		tflops: 44.1,
		memory: [16],
		computeCapability: 8.9,
	},
	"RTX 4060": {
		tflops: 15.11,
		memory: [8],
		computeCapability: 8.9,
	},
	"RTX 4060 Ti": {
		tflops: 22.06,
		memory: [8, 16],
		computeCapability: 8.9,
	},
	"RTX 4090 Laptop": {
		tflops: 32.98,
		memory: [16],
		computeCapability: 8.9,
	},
	"RTX 4080 Laptop": {
		tflops: 24.72,
		memory: [12],
		computeCapability: 8.9,
	},
	"RTX 4070 Laptop": {
		tflops: 15.62,
		memory: [8],
		computeCapability: 8.9,
	},
	"RTX 4060 Laptop": {
		tflops: 11.61,
		memory: [8],
		computeCapability: 8.9,
	},
	"RTX 4050 Laptop": {
		tflops: 8.9,
		memory: [6],
		computeCapability: 8.9,
	},
	"RTX 3090": {
		tflops: 35.58,
		memory: [24],
		computeCapability: 8.6,
	},
	"RTX 3090 Ti": {
		tflops: 40,
		memory: [24],
		computeCapability: 8.6,
	},
	"RTX 3080": {
		tflops: 30.6,
		memory: [12, 10],
		computeCapability: 8.6,
	},
	"RTX 3080 Ti": {
		tflops: 34.1,
		memory: [12],
		computeCapability: 8.6,
	},
	"RTX 3080 Mobile": {
		tflops: 18.98,
		memory: [8],
		computeCapability: 8.6,
	},
	"RTX 3070": {
		tflops: 20.31,
		memory: [8],
		computeCapability: 8.6,
	},
	"RTX 3070 Ti": {
		tflops: 21.75,
		memory: [8],
		computeCapability: 8.6,
	},
	"RTX 3070 Ti Mobile": {
		tflops: 16.6,
		memory: [8],
		computeCapability: 8.6,
	},
	"RTX 3060 Ti": {
		tflops: 16.2,
		memory: [8],
		computeCapability: 8.6,
	},
	"RTX 3060": {
		tflops: 12.74,
		memory: [12, 8],
		computeCapability: 8.6,
	},
	"RTX 2080 Ti": {
		tflops: 26.9,
		memory: [11, 22], // 22GB: modded 2080ti
		computeCapability: 7.5,
	},
	"RTX 2080": {
		tflops: 20.14,
		memory: [8],
		computeCapability: 7.5,
	},
	"RTX 2070": {
		tflops: 14.93,
		memory: [8],
		computeCapability: 7.5,
	},
	"RTX 2070 SUPER Mobile": {
		tflops: 14.13,
		memory: [8],
		computeCapability: 7.5,
	},
	"RTX 2070 SUPER": {
		tflops: 18.12,
		memory: [8],
		computeCapability: 7.5,
	},
	"RTX 3060 Mobile": {
		tflops: 10.94,
		memory: [6],
		computeCapability: 8.6,
	},
	"RTX 3050 Mobile": {
		tflops: 7.639,
		memory: [4, 6],
		computeCapability: 8.6,
	},
	"RTX 2060": {
		tflops: 12.9,
		memory: [6],
		computeCapability: 7.5,
	},
	"RTX 2060 12GB": {
		tflops: 14.36,
		memory: [12],
		computeCapability: 7.5,
	},
	"RTX 2060 Mobile": {
		tflops: 9.22,
		memory: [6],
		computeCapability: 7.5,
	},
	"RTX 2050 Mobile": {
		tflops: 10.2,
		memory: [4],
		computeCapability: 8.6, // Ampere (outlier GPU in the 20xx series)
	},
	"GTX 1080 Ti": {
		tflops: 11.34, // float32 (GPU does not support native float16)
		memory: [11],
		computeCapability: 6.1,
	},
	"GTX 1070 Ti": {
		tflops: 8.2, // float32 (GPU does not support native float16)
		memory: [8],
		computeCapability: 6.1,
	},
	"GTX 1060": {
		tflops: 3.9, // float32 (GPU does not support native float16)
		memory: [3, 6],
		computeCapability: 6.1,
	},
	"GTX 1050 Ti": {
		tflops: 2.1, // float32 (GPU does not support native float16)
		memory: [4],
		computeCapability: 6.1,
	},
	"RTX Titan": {
		tflops: 32.62,
		memory: [24],
		computeCapability: 7.5,
	},
	"GTX 1660": {
		tflops: 10.05,
		memory: [6],
		computeCapability: 7.5,
	},
	"GTX 1650 Mobile": {
		tflops: 6.39,
		memory: [4],
		computeCapability: 7.5,
	},
	T4: {
		tflops: 65.13,
		memory: [16],
		computeCapability: 7.5,
	},
	T10: {
		tflops: 20.0,
		memory: [16],
		computeCapability: 7.5,
	},
	V100: {
		tflops: 28.26,
		memory: [32, 16],
		computeCapability: 7.0,
	},
	"Quadro P6000": {
		tflops: 12.63, // float32 (GPU does not support native float16)
		memory: [24],
		computeCapability: 6.1,
	},
	P40: {
		tflops: 11.76, // float32 (GPU does not support native float16)
		memory: [24],
		computeCapability: 6.1,
	},
	P100: {
		tflops: 19.05,
		memory: [16],
		computeCapability: 6.0,
	},
	"Jetson AGX Orin 64GB": {
		tflops: 10.65,
		memory: [64],
		computeCapability: 8.7,
	},
	"Jetson AGX Orin 32GB": {
		tflops: 6.66,
		memory: [32],
		computeCapability: 8.7,
	},
	"Jetson Orin NX 16GB": {
		tflops: 3.76,
		memory: [16],
		computeCapability: 8.7,
	},
	"Jetson Orin NX 8GB": {
		tflops: 3.13,
		memory: [8],
		computeCapability: 8.7,
	},
	"Jetson Orin Nano 8GB": {
		tflops: 2.56,
		memory: [8],
		computeCapability: 8.7,
	},
	"Jetson Orin Nano 4GB": {
		tflops: 1.28,
		memory: [4],
		computeCapability: 8.7,
	},
	"Jetson AGX Xavier": {
		tflops: 2.82,
		memory: [32, 64],
		computeCapability: 7.2,
	},
	"Jetson Xavier NX": {
		tflops: 1.69,
		memory: [8, 16],
		computeCapability: 7.2,
	},
	"Jetson TX2": {
		tflops: 1.33,
		memory: [4, 8],
		computeCapability: 6.2,
	},
	"Jetson Nano": {
		tflops: 0.47,
		memory: [4],
		computeCapability: 5.3,
	},
};
