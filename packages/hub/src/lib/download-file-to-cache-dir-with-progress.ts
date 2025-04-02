import type {
	DownloadFileToCacheDirParams} from "./download-file-to-cache-dir";
import {
	prepareDownloadFileToCacheDir,
} from "./download-file-to-cache-dir";
import { downloadFile } from "./download-file";
import { rename } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { createSymlink } from "../utils/symlink";

export interface DownloadFileEvent {
	event: 'file';
	path: string;
	progress: number;
}

export async function * downloadFileToCacheDirWithProgress(
	params: DownloadFileToCacheDirParams
): AsyncGenerator<DownloadFileEvent, string> {
	const { exists, pointerPath, blobPath } = await prepareDownloadFileToCacheDir(params);
	if(exists) return pointerPath;

	/**
	 * 	download with progress
 	 */
	const incomplete = `${blobPath}.incomplete`;
	console.debug(`Downloading ${params.path} to ${incomplete}`);

	const response = await downloadFile(params);
	if (!response || !response.ok || !response.body) {
		throw new Error(`Invalid response for file ${params.path}`);
	}

	const contentLength = response.headers.get("Content-Length");
	const totalSize = contentLength ? parseInt(contentLength, 10) : undefined;
	const reader = response.body.getReader();

	// Open a writable stream to the target file.
	const fileStream = createWriteStream(incomplete);

	let receivedSize = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		// Write the chunk immediately to the file.
		fileStream.write(value);
		receivedSize += value.length;
		yield {
			event: 'file',
			path: params.path,
			progress: totalSize ? receivedSize / totalSize : 0,
		};
	}

	// Close the writable stream.
	fileStream.end();
	
	await rename(incomplete, blobPath);
	await createSymlink({ sourcePath: blobPath, finalPath: pointerPath });

	return pointerPath;
}
