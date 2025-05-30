// The entry file of your WebAssembly module.

import type { StaticArray } from "@assemblyscript/runtime";

// Define the Table type as a static array of u64 values
export const DEFAULT_TABLE: StaticArray<u64> = [
	0xb088d3a9e840f559, 0x5652c7f739ed20d6, 0x45b28969898972ab, 0x6b0a89d5b68ec777, 0x368f573e8b7a31b7,
	// ... existing code ...
];

// Function to find the next match in the buffer
export function nextMatch(hash: u64, buf: Uint8Array, mask: u64, table: StaticArray<u64> = DEFAULT_TABLE): i32 {
	for (let i = 0; i < buf.length; i++) {
		const b = buf[i];
		hash = (hash << 1) + table[b];

		if ((hash & mask) == 0) {
			return i + 1;
		}
	}

	return -1; // Return -1 to indicate no match found (equivalent to None in Rust)
}

// Hasher class that maintains hash state
export class Hasher {
	private hash: u64;
	private table: StaticArray<u64>;

	constructor(table: StaticArray<u64> = DEFAULT_TABLE) {
		this.table = table;
		this.hash = 0;
	}

	// Update the hash state by processing all the bytes in the given slice
	update(buf: Uint8Array): void {
		for (let i = 0; i < buf.length; i++) {
			const b = buf[i];
			this.hash = (this.hash << 1) + this.table[b];
		}
	}

	// Match the current hash state against the given mask
	isMatch(mask: u64): boolean {
		return (this.hash & mask) == 0;
	}

	// Process the given byte slice until a match is found for the given mask
	nextMatch(buf: Uint8Array, mask: u64): i32 {
		for (let i = 0; i < buf.length; i++) {
			const b = buf[i];
			this.hash = (this.hash << 1) + this.table[b];

			if ((this.hash & mask) == 0) {
				return i + 1;
			}
		}
		return -1;
	}

	// Get the current hash value
	getHash(): u64 {
		return this.hash;
	}

	// Set the hash value to the given integer
	setHash(hash: u64): void {
		this.hash = hash;
	}
}
