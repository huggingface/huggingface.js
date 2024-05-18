import { assert, it, describe } from "vitest";
import { __internal_sha256 } from "@huggingface/hub";

const lfsContent = "0123456789".repeat(1_000_000);

describe("hub", () => {
	it("should compute sha256 with webworker", async function () {
		const blob = new Blob([lfsContent]);

		const iterator = __internal_sha256(blob, { useWebWorker: { minSize: 1 } });
		// Get return value of the generator
		const values: number[] = [];
		while (1) {
			const { done, value } = await iterator.next();
			if (done) {
				assert.strictEqual(value, "d52fcc26b48dbd4d79b125eb0a29b803ade07613c67ac7c6f2751aefef008486");

				const builtInResult = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
				const hex =
					builtInResult instanceof ArrayBuffer
						? new Uint8Array(builtInResult).reduce((acc, i) => acc + i.toString(16).padStart(2, "0"), "")
						: builtInResult;
				assert.strictEqual(hex, "d52fcc26b48dbd4d79b125eb0a29b803ade07613c67ac7c6f2751aefef008486");
				break;
			}

			if (typeof value === "number") {
				values.push(value);
			}
		}

		// Check that we received progress values, which should happen with a webworker
		assert(values.length > 2);
		assert.strictEqual(values[0], 0);
		assert.strictEqual(values[values.length - 1], 1);
	}, 60_000);
});
