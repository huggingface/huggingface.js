import { describe, expect, it } from "vitest";
import { checkDDUF, type DDUFFileEntry } from "./check-dduf";

function createCentralDirectoryEntry(name: string, diskNumber: number): Uint8Array {
	const nameBytes = new TextEncoder().encode(name);
	const entry = new Uint8Array(46 + nameBytes.length);
	const view = new DataView(entry.buffer);

	view.setUint32(0, 0x02014b50, true);
	view.setUint16(28, nameBytes.length, true);
	view.setUint16(34, diskNumber, true);
	entry.set(nameBytes, 46);

	return entry;
}

function createArchive(entries: Uint8Array[]): Blob {
	const centralDirectorySize = entries.reduce((size, entry) => size + entry.byteLength, 0);
	const footer = new Uint8Array(22);
	const footerView = new DataView(footer.buffer);

	footerView.setUint32(0, 0x06054b50, true);
	footerView.setUint16(8, entries.length, true);
	footerView.setUint16(10, entries.length, true);
	footerView.setUint32(12, centralDirectorySize, true);
	footerView.setUint32(16, 0, true);

	return new Blob([...entries, footer]);
}

describe("check-dduf", () => {
	it("rejects a later central directory entry from another disk", async () => {
		const archive = createArchive([
			createCentralDirectoryEntry("first.txt", 0),
			createCentralDirectoryEntry("second.txt", 1),
		]);

		const files = async () => {
			const entries: DDUFFileEntry[] = [];
			for await (const entry of checkDDUF(archive)) {
				entries.push(entry);
			}
			return entries;
		};

		await expect(files()).rejects.toThrow("Multi-disk archives not supported");
	});

	it("should work", async () => {
		const files: DDUFFileEntry[] = [];
		for await (const file of checkDDUF(
			new URL("https://huggingface.co/spaces/DDUF/dduf-check/resolve/main/file-64.dduf"),
		)) {
			files.push(file);
		}

		expect(files).toEqual([
			{
				fileHeaderOffset: 0,
				name: "vae/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 82,
				name: "vae/config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 178,
				name: "vae/diffusion_pytorch_model.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 295,
				name: "text_encoder_2/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 388,
				name: "text_encoder_2/config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 495,
				name: "text_encoder_2/model-00002-of-00002.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 620,
				name: "text_encoder_2/models.saftensors.index.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 744,
				name: "text_encoder_2/model-00001-of-00002.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 869,
				name: "transformer/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 959,
				name: "transformer/config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1063,
				name: "transformer/diffusion_pytorch_model.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 1188,
				name: "tokenizer_2/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 1278,
				name: "tokenizer_2/vocab.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1381,
				name: "tokenizer_2/special_tokens_map.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1497,
				name: "tokenizer_2/tokenizer_config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1611,
				name: "tokenizer_2/spiece.gguf",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 1712,
				name: "tokenizer/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 1800,
				name: "tokenizer/vocab.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1901,
				name: "tokenizer/special_tokens_map.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2015,
				name: "tokenizer/tokenizer_config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2127,
				name: "scheduler/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 2215,
				name: "scheduler/scheduler-config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2327,
				name: "text_encoder/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 2418,
				name: "text_encoder/config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2523,
				name: "text_encoder/model-00002-of-00002.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 2646,
				name: "text_encoder/models.saftensors.index.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2768,
				name: "text_encoder/model-00001-of-00002.safetensors",
				size: 0,
				type: "file",
			},
		]);
	});
});
