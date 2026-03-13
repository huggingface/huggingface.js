#!/usr/bin/env node

import type { GGUFParseOutput } from ".";
import { GGMLQuantizationType, ggufAllShards } from ".";
import { GGML_QUANT_SIZES } from "./quant-descriptions";

interface PrintColumnHeader {
	name: string;
	maxWidth?: number;
	alignRight?: boolean;
}

const mapDtypeToName = Object.fromEntries(Object.entries(GGMLQuantizationType).map(([name, value]) => [value, name]));

function showHelp(exitCode: number) {
	console.error("Usage: gguf-view [--help|-h] [--show-tensor] [--context|-c N] <path/to/gguf>");
	console.error("  --help, -h        Show this help message");
	console.error("  --show-tensor     Show tensor information");
	console.error("  --context, -c N   Number of tokens in context (default: 4096)");
	process.exit(exitCode);
}

async function main() {
	let ggufPath = "";
	let showTensors = false;
	let nCtx = 4096;
	for (let i = 2; i < process.argv.length; i++) {
		if (process.argv[i] === "--help" || process.argv[i] === "-h") {
			showHelp(0);
		} else if (process.argv[i] === "--show-tensor") {
			showTensors = true;
		} else if (process.argv[i] === "--context" || process.argv[i] === "-c") {
			nCtx = Number(process.argv[++i]);
		} else {
			ggufPath = process.argv[i];
		}
	}

	if (!ggufPath.length) {
		console.error("Error: Missing path to gguf file");
		showHelp(1);
	}

	const { shards } = await ggufAllShards(ggufPath, {
		allowLocalFile: true,
	});
	const { metadata, tensorInfos } = shards[0];

	// merge all metadata
	for (let i = 1; i < shards.length; i++) {
		tensorInfos.push(...shards[i].tensorInfos);
	}

	// TODO: print info about endianess
	console.log(`* Dumping ${Object.keys(metadata).length} key/value pair(s)`);
	printTable(
		[
			{ name: "Idx", alignRight: true },
			// { name: 'Type' }, // TODO: support this
			{ name: "Count", alignRight: true },
			{ name: "Value" },
		],
		Object.entries(metadata).map(([key, value], i) => {
			const MAX_LEN = 50;
			let strVal = "";
			let count = 1;
			if (Array.isArray(value)) {
				strVal = JSON.stringify(value);
				count = value.length;
			} else if (value instanceof String || typeof value === "string") {
				strVal = JSON.stringify(value);
			} else {
				strVal = value.toString();
			}
			strVal = strVal.length > MAX_LEN ? strVal.slice(0, MAX_LEN) + "..." : strVal;
			return [(i + 1).toString(), count.toString(), `${key} = ${strVal}`];
		}),
	);

	console.log();
	console.log(`* Memory usage estimation (with context length of ${nCtx} tokens)`);
	try {
		const kvUsage = calcMemoryUsage(metadata as GGUFParseOutput<{ strict: false }>["metadata"], nCtx);
		let modelWeightInBytes = 0;
		for (const tensorInfo of tensorInfos) {
			const nElem = Number(tensorInfo.shape.reduce((a, b) => a * b, 1n));
			const tensorSizeInBytes = nElem * (GGML_QUANT_SIZES[tensorInfo.dtype] / 8);
			modelWeightInBytes += tensorSizeInBytes;
		}
		const overhead =
			calcMemoryUsage(metadata as GGUFParseOutput<{ strict: false }>["metadata"], 256).totalBytes +
			modelWeightInBytes * 0.05;
		const totalMemoryUsage = kvUsage.totalBytes + overhead + modelWeightInBytes;
		printTable(
			[{ name: "Item" }, { name: "Memory usage", alignRight: true }],
			[
				["K cache", (kvUsage.totalBytesK / 1e9).toFixed(2) + " GB"],
				["V cache", (kvUsage.totalBytesV / 1e9).toFixed(2) + " GB"],
				["Weight", (modelWeightInBytes / 1e9).toFixed(2) + " GB"],
				["Overhead", (overhead / 1e9).toFixed(2) + " GB"],
				["", "---"],
				["TOTAL", (totalMemoryUsage / 1e9).toFixed(2) + " GB"],
			],
		);
	} catch (e) {
		console.error(`Error: ${(e as Error).message}`);
	}

	if (showTensors) {
		console.log();
		console.log(`* Dumping ${tensorInfos.length} tensor(s)`);
		printTable(
			[
				{ name: "Idx", alignRight: true },
				{ name: "Num Elements", alignRight: true },
				{ name: "Shape" },
				{ name: "Data Type" },
				{ name: "Name" },
			],
			tensorInfos.map((tensorInfo, i) => {
				const shape = [1n, 1n, 1n, 1n];
				tensorInfo.shape.forEach((dim, i) => {
					shape[i] = dim;
				});
				return [
					(i + 1).toString(),
					shape.reduce((acc, n) => acc * n, 1n).toString(),
					shape.map((n) => n.toString().padStart(6)).join(", "),
					mapDtypeToName[tensorInfo.dtype],
					tensorInfo.name,
				];
			}),
		);
	} else {
		console.log();
		console.log(`* Use --show-tensor to display tensor information`);
	}
}

function calcMemoryUsage(
	metadata: GGUFParseOutput<{ strict: false }>["metadata"],
	kvSize: number,
	kvTypeK: GGMLQuantizationType = GGMLQuantizationType.F16,
	kvTypeV: GGMLQuantizationType = GGMLQuantizationType.F16,
) {
	const arch = metadata["general.architecture"] ?? "unknown";
	const n_embd = (metadata[`${arch}.embedding_length`] as number) ?? 0;
	const n_head = (metadata[`${arch}.attention.head_count`] as number) ?? 0;
	const n_embd_head_k = (metadata[`${arch}.attention.key_length`] as number) ?? n_embd / n_head;
	const n_embd_head_v = (metadata[`${arch}.attention.value_length`] as number) ?? n_embd / n_head;
	const n_head_kv = (metadata[`${arch}.attention.head_count_kv`] as number[] | number) ?? [];
	const n_layer = (metadata[`${arch}.block_count`] as number) ?? 0;

	if (arch.startsWith("mamba") || arch.startsWith("rwkv")) {
		throw new Error(`Memory usage estimation for arch "${arch}" is not supported`);
	}

	const n_head_kv_arr = Array(n_layer).fill(n_head);
	if (Array.isArray(n_head_kv)) {
		for (let i = 0; i < n_layer; i++) {
			if (n_head_kv[i]) {
				n_head_kv_arr[i] = n_head_kv[i];
			}
		}
	} else {
		for (let i = 0; i < n_layer; i++) {
			n_head_kv_arr[i] = n_head_kv;
		}
	}

	let totalElemsK = 0;
	let totalElemsV = 0;
	for (let i = 0; i < n_layer; i++) {
		const n_embd_k_gqa = n_embd_head_k * n_head_kv_arr[i];
		const n_embd_v_gqa = n_embd_head_v * n_head_kv_arr[i];
		totalElemsK += n_embd_k_gqa * kvSize;
		totalElemsV += n_embd_v_gqa * kvSize;
	}

	return {
		totalBytesK: totalElemsK * (GGML_QUANT_SIZES[kvTypeK] / 8),
		totalBytesV: totalElemsV * (GGML_QUANT_SIZES[kvTypeV] / 8),
		totalBytes: (totalElemsK + totalElemsV) * (GGML_QUANT_SIZES[kvTypeV] / 8),
	};
}

function printTable(header: PrintColumnHeader[], rows: string[][], leftPad = 2) {
	const leftPadStr = " ".repeat(leftPad);

	// Calculate column widths
	const columnWidths = header.map((h, i) => {
		const maxContentWidth = Math.max(h.name.length, ...rows.map((row) => (row[i] || "").length));
		return h.maxWidth ? Math.min(maxContentWidth, h.maxWidth) : maxContentWidth;
	});

	// Print header
	const headerLine = header
		.map((h, i) => {
			return h.name.padEnd(columnWidths[i]);
		})
		.join(" | ");
	console.log(leftPadStr + headerLine);

	// Print separator
	console.log(leftPadStr + columnWidths.map((w) => "-".repeat(w)).join("-|-"));

	// Print rows
	for (const row of rows) {
		const line = header
			.map((h, i) => {
				return h.alignRight ? (row[i] || "").padStart(columnWidths[i]) : (row[i] || "").padEnd(columnWidths[i]);
			})
			.join(" | ");
		console.log(leftPadStr + line);
	}
}

main();
