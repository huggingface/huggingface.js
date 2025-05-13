import type {
	TextResourceContents,
	BlobResourceContents,
	CompatibilityCallToolResult,
} from "@modelcontextprotocol/sdk/types";

/**
 * A utility class for formatting CallToolResult contents into human-readable text.
 * Processes different content types, extracts text, and summarizes binary data.
 */
export class ResultFormatter {
	/**
	 * Formats a CallToolResult's contents into a single string.
	 * - Text content is included directly
	 * - Binary content (images, audio, blobs) is summarized
	 *
	 * @param result The CallToolResult to format
	 * @returns A human-readable string representation of the result contents
	 */
	static format(result: CompatibilityCallToolResult): string {
		if (!result.content || !Array.isArray(result.content) || result.content.length === 0) {
			return "[No content]";
		}

		const formattedParts: string[] = [];

		for (const item of result.content) {
			switch (item.type) {
				case "text":
					// Extract text content directly
					formattedParts.push(item.text);
					break;

				case "image": {
					// Summarize image content
					const imageSize = this.getBase64Size(item.data);
					formattedParts.push(
						`[Binary Content: Image ${item.mimeType}, ${imageSize} bytes]\nThe task is complete and the content accessible to the User`
					);
					break;
				}

				case "audio": {
					// Summarize audio content
					const audioSize = this.getBase64Size(item.data);
					formattedParts.push(
						`[Binary Content: Audio ${item.mimeType}, ${audioSize} bytes]\nThe task is complete and the content accessible to the User`
					);
					break;
				}

				case "resource":
					// Handle embedded resources - explicitly type the resource
					if ("text" in item.resource) {
						// It's a text resource with a text property
						const textResource = item.resource as TextResourceContents;
						formattedParts.push(textResource.text);
					} else if ("blob" in item.resource) {
						// It's a binary resource with a blob property
						const blobResource = item.resource as BlobResourceContents;
						const blobSize = this.getBase64Size(blobResource.blob);
						const uri = blobResource.uri ? ` (${blobResource.uri})` : "";
						const mimeType = blobResource.mimeType ? blobResource.mimeType : "unknown type";
						formattedParts.push(
							`[Binary Content${uri}: ${mimeType}, ${blobSize} bytes]\nThe task is complete and the content accessible to the User`
						);
					}
					break;
			}
		}

		return formattedParts.join("\n");
	}

	/**
	 * Calculates the approximate size in bytes of base64-encoded data
	 */
	private static getBase64Size(base64: string): number {
		// Remove base64 header if present (e.g., data:image/png;base64,)
		const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;

		// Calculate size: Base64 encodes 3 bytes into 4 characters
		const padding = cleanBase64.endsWith("==") ? 2 : cleanBase64.endsWith("=") ? 1 : 0;
		return Math.floor((cleanBase64.length * 3) / 4 - padding);
	}
}
