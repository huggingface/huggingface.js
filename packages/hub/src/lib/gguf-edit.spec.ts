import { describe, it } from "vitest";
import { commit } from "./commit";
import { gguf, serializeGgufMetadata } from "@huggingface/gguf";

describe("GGUF Metadata Update via Direct Commit - Local Integration Test", () => {
	it("should reduce tokenizer.ggml.tokens array to first 2 elements", async () => {
		// Test configuration
		const repo = "reach-vb/TinyLlama-1.1B-Chat-v1.0-q4_k_m-GGUF";
		const path = "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf";

		// Build the remote URL for the GGUF file
		const hubUrl = "https://huggingface.co";
		const revision = "main";
		const remoteUrl = `${hubUrl}/${repo}/resolve/${revision}/${path}`;

		console.log("🔍 Fetching current metadata from remote GGUF file...");
		const {
			typedMetadata: currentMetadata,
			tensorDataOffset,
			littleEndian,
		} = await gguf(remoteUrl, {
			typedMetadata: true,
		});

		// Create updated metadata with modified tokens array
		const updatedTokens = ["hoh", "hoh"];
		// Ensure the updated metadata preserves the original version and structure
		// This is critical to avoid corrupting the file
		const preservedMetadata = {
			...currentMetadata,
			"general.name": {
				value: "test-tokens-array",
				type: currentMetadata["general.name"]?.type ?? 8, // STRING type
			},
			"tokenizer.ggml.tokens": {
				value: updatedTokens,
				type: currentMetadata["tokenizer.ggml.tokens"]?.type ?? 11, // ARRAY type
				subType: currentMetadata["tokenizer.ggml.tokens"]?.subType ?? 8, // STRING subtype
			},
			// Always preserve the original version, tensor_count, and kv_count from the current file
			version: currentMetadata.version,
			tensor_count: currentMetadata.tensor_count,
			kv_count: currentMetadata.kv_count, // Keep the original kv_count - it should match the actual data
		};

		// Use the GGUF serializer for metadata
		const alignment = Number(currentMetadata["general.alignment"] ?? 32);
		const completeHeaderArray = serializeGgufMetadata(
			preservedMetadata as Parameters<typeof serializeGgufMetadata>[0],
			{
				littleEndian,
				alignment,
			}
		);
		const completeHeaderBlob = new Blob([completeHeaderArray], { type: "application/octet-stream" });

		// Serialize the current metadata to use as originalContent
		const originalHeaderArray = serializeGgufMetadata(currentMetadata, {
			littleEndian,
			alignment,
		});
		const originalHeaderBlob = new Blob([originalHeaderArray], { type: "application/octet-stream" });

		// Create a blob that represents the original header section (padded to tensorDataOffset if needed)
		const headerSize = originalHeaderBlob.size;
		const targetSize = Number(tensorDataOffset);

		let paddedOriginalBlob: Blob;
		if (headerSize < targetSize) {
			// Pad with zeros to match tensorDataOffset
			const padding = new Uint8Array(targetSize - headerSize);
			paddedOriginalBlob = new Blob([originalHeaderBlob, padding]);
		} else {
			paddedOriginalBlob = originalHeaderBlob;
		}

		// Call commit directly with edit operation
		console.log("📝 Calling commit directly with edit operation, creating PR");
		const result = await commit({
			repo,
			title: "Test: Reduce tokenizer.ggml.tokens array",
			description:
				"Testing array field modification via direct commit call - keeping only first 2 elements of tokens array",
			branch: "main",
			isPullRequest: true, // Create a pull request
			accessToken: process.env.HF_TOKEN,
			useXet: true, // Required for edit operations
			operations: [
				{
					operation: "edit",
					path,
					originalContent: paddedOriginalBlob,
					edits: [
						{
							start: 0,
							end: Number(tensorDataOffset),
							content: completeHeaderBlob,
						},
					],
				}, // Edit operation
			],
		});

		console.log("✅ Update completed:", result);
	}, 30000); // 30 second timeout for network operations
});
