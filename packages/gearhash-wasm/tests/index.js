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
assert.deepStrictEqual(nextMatch(randomData, 0xaf2900n), { position: 128, hash: 11757411513747408525n });
assert.deepStrictEqual(nextMatch(randomData.subarray(128), 0xaf2900n), { position: 184, hash: 7438883163016807155n });
console.log("ok");
