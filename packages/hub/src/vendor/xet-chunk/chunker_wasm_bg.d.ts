/* tslint:disable */
/* eslint-disable */
export function compute_xorb_hash(chunks_array: any): string;
export class Chunker {
	free(): void;
	constructor(target_chunk_size: number);
	add_data(data: Uint8Array): Array<{ hash: string; length: number }>;
	finish(): Array<{ hash: string; length: number }>;
}
