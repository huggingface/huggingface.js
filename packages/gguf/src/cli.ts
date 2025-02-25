#!/usr/bin/env node

import { GGMLQuantizationType, gguf } from ".";

interface PrintColumnHeader {
	name: string;
	maxWidth?: number;
	alignRight?: boolean;
}

const mapDtypeToName = Object.fromEntries(Object.entries(GGMLQuantizationType).map(([name, value]) => [value, name]));

async function main() {
	const ggufPath = process.argv[2];
	const { metadata, tensorInfos } = await gguf(ggufPath, {
		allowLocalFile: true,
	});

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
		})
	);

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
		})
	);
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
