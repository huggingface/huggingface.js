import assert from "assert";
import { nextMatch } from "../build/debug.js";

// Simple seeded random number generator
function seededRandom(seed) {
	return function () {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
}

// Create seeded random data
const seed = 12345; // Fixed seed for deterministic results
const random = seededRandom(seed);
const randomData = new Uint8Array(1000000).map(() => Math.floor(random() * 256));

// Test with a known mask
assert.deepStrictEqual(nextMatch(randomData, 0x0000d90003530000n), { position: 459, hash: 9546224108073667431n });
assert.deepStrictEqual(nextMatch(randomData.subarray(128), 0x0000d90003530000n), {
	position: 331,
	hash: 9546224108073667431n,
});
console.log("ok");
