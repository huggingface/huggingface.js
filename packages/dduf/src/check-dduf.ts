import { checkFilename } from "./check-filename";
import { createBlob } from "@huggingface/blob";

export interface DDUFFileEntry {
	type: "file";
	name: string;
	size: number;
	fileHeaderOffset: number;
}

export async function* checkDDUF(
	url: Blob | URL,
	opts?: { log?: (x: string) => void }
): AsyncGenerator<DDUFFileEntry> {
	const blob = url instanceof Blob ? url : await createBlob(url);

	opts?.log?.("File size: " + blob.size);

	// DDUF is a zip file, uncompressed.

	const last100kB = await blob.slice(blob.size - 100_000, blob.size).arrayBuffer();

	const view = new DataView(last100kB);

	let index = view.byteLength - 22;
	let found = false;

	while (index >= 0) {
		if (view.getUint32(index, true) === 0x06054b50) {
			found = true;
			break;
		}

		index--;
	}

	if (!found) {
		throw new Error("DDUF footer not found in last 100kB of file");
	}

	opts?.log?.("DDUF footer found at offset " + (blob.size - last100kB.byteLength + index));

	const diskNumber = view.getUint16(index + 4, true);

	opts?.log?.("Disk number: " + diskNumber);

	if (diskNumber !== 0 && diskNumber !== 0xffff) {
		throw new Error("Multi-disk archives not supported");
	}

	let fileCount = view.getUint16(index + 10, true);
	let centralDirSize = view.getUint32(index + 12, true);
	let centralDirOffset = view.getUint32(index + 16, true);
	const isZip64 = centralDirOffset === 0xffffffff;

	opts?.log?.("File count: " + fileCount);

	if (isZip64) {
		opts?.log?.("Zip64 format detected");

		index -= 20;
		found = false;
		while (index >= 0) {
			if (view.getUint32(index, true) === 0x07064b50) {
				found = true;
				break;
			}

			index--;
		}

		if (!found) {
			throw new Error("Zip64 footer not found in last 100kB of file");
		}

		opts?.log?.("Zip64 footer found at offset " + (blob.size - last100kB.byteLength + index));

		const diskWithCentralDir = view.getUint32(index + 4, true);

		if (diskWithCentralDir !== 0) {
			throw new Error("Multi-disk archives not supported");
		}

		const endCentralDirOffset = Number(view.getBigUint64(index + 8, true));

		index = endCentralDirOffset - (blob.size - last100kB.byteLength);

		if (index < 0) {
			throw new Error("Central directory offset is outside the last 100kB of the file");
		}

		if (view.getUint32(index, true) !== 0x06064b50) {
			throw new Error("Invalid central directory header");
		}

		const thisDisk = view.getUint16(index + 16, true);
		const centralDirDisk = view.getUint16(index + 20, true);

		if (thisDisk !== 0) {
			throw new Error("Multi-disk archives not supported");
		}

		if (centralDirDisk !== 0) {
			throw new Error("Multi-disk archives not supported");
		}

		centralDirSize = Number(view.getBigUint64(index + 40, true));
		centralDirOffset = Number(view.getBigUint64(index + 48, true));
		fileCount = Number(view.getBigUint64(index + 32, true));

		opts?.log?.("File count zip 64: " + fileCount);
	}

	opts?.log?.("Central directory size: " + centralDirSize);
	opts?.log?.("Central directory offset: " + centralDirOffset);

	const centralDir =
		centralDirOffset > blob.size - last100kB.byteLength
			? last100kB.slice(
					centralDirOffset - (blob.size - last100kB.byteLength),
					centralDirOffset - (blob.size - last100kB.byteLength) + centralDirSize
			  )
			: await blob.slice(centralDirOffset, centralDirOffset + centralDirSize).arrayBuffer();

	const centralDirView = new DataView(centralDir);
	let offset = 0;

	for (let i = 0; i < fileCount; i++) {
		if (centralDirView.getUint32(offset + 0, true) !== 0x02014b50) {
			throw new Error("Invalid central directory file header");
		}

		if (offset + 46 > centralDir.byteLength) {
			throw new Error("Unexpected end of central directory");
		}

		const compressionMethod = centralDirView.getUint16(offset + 10, true);

		if (compressionMethod !== 0) {
			throw new Error("Unsupported compression method: " + compressionMethod);
		}

		const filenameLength = centralDirView.getUint16(offset + 28, true);
		const fileName = new TextDecoder().decode(new Uint8Array(centralDir, offset + 46, filenameLength));

		opts?.log?.("File " + i);
		opts?.log?.("File name: " + fileName);

		checkFilename(fileName);

		const fileDiskNumber = centralDirView.getUint16(34, true);

		if (fileDiskNumber !== 0 && fileDiskNumber !== 0xffff) {
			throw new Error("Multi-disk archives not supported");
		}

		let size = centralDirView.getUint32(offset + 24, true);
		let compressedSize = centralDirView.getUint32(offset + 20, true);
		let filePosition = centralDirView.getUint32(offset + 42, true);

		const extraFieldLength = centralDirView.getUint16(offset + 30, true);

		if (size === 0xffffffff || compressedSize === 0xffffffff || filePosition === 0xffffffff) {
			opts?.log?.("File size is in zip64 format");

			const extraFields = new DataView(centralDir, offset + 46 + filenameLength, extraFieldLength);

			let extraFieldOffset = 0;

			while (extraFieldOffset < extraFieldLength) {
				const headerId = extraFields.getUint16(extraFieldOffset, true);
				const extraFieldSize = extraFields.getUint16(extraFieldOffset + 2, true);
				if (headerId !== 0x0001) {
					extraFieldOffset += 4 + extraFieldSize;
					continue;
				}

				const zip64ExtraField = new DataView(
					centralDir,
					offset + 46 + filenameLength + extraFieldOffset + 4,
					extraFieldSize
				);
				let zip64ExtraFieldOffset = 0;

				if (size === 0xffffffff) {
					size = Number(zip64ExtraField.getBigUint64(zip64ExtraFieldOffset, true));
					zip64ExtraFieldOffset += 8;
				}

				if (compressedSize === 0xffffffff) {
					compressedSize = Number(zip64ExtraField.getBigUint64(zip64ExtraFieldOffset, true));
					zip64ExtraFieldOffset += 8;
				}

				if (filePosition === 0xffffffff) {
					filePosition = Number(zip64ExtraField.getBigUint64(zip64ExtraFieldOffset, true));
					zip64ExtraFieldOffset += 8;
				}

				break;
			}
		}

		if (size !== compressedSize) {
			throw new Error("Compressed size and size differ: " + compressedSize + " vs " + size);
		}
		opts?.log?.("File size: " + size);

		const commentLength = centralDirView.getUint16(offset + 32, true);

		opts?.log?.("File header position in archive: " + filePosition);

		offset += 46 + filenameLength + extraFieldLength + commentLength;

		yield { type: "file", name: fileName, size, fileHeaderOffset: filePosition };
	}

	opts?.log?.("All files checked");
}
