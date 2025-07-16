# Xet-Chunk

WASM utilities to chunk & hash data.

An assembly script implementation is available in `@huggingface/xetchunk-wasm`, but for performance reasons we're using WASM directly compiled from the rust source, see https://github.com/huggingface/xet-core/tree/main/hf_xet_wasm which on my local machine processes data at 480MB/s.

We hope in the future to include the build step directly in this package, or to use assembly script WASM (but blake 3 hashing perf needs to be significantly improved).