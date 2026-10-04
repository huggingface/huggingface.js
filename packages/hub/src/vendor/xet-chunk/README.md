# xet-core chunker reference

This is a test-only xet-core Wasm oracle for the `@huggingface/xetchunk-wasm`
conformance suite. Production Hub chunking continues to use
`@huggingface/xetchunk-wasm`; the previous production Rust/Wasm integration
was removed in [#2103](https://github.com/huggingface/huggingface.js/pull/2103).

The artifact comes from
[`hf_xet_thin_wasm`](https://github.com/huggingface/xet-core/tree/861056a363e4e5e8661a7d8ecb22b923e54355a0/wasm/hf_xet_thin_wasm)
at commit `861056a363e4e5e8661a7d8ecb22b923e54355a0`. Its raw Wasm is not checked
in; the generated TypeScript module contains the base64 representation, full
source commit, and decoded Wasm checksum.

After building `hf_xet_thin_wasm` with `JS_TARGET=web ./build_wasm.sh`, refresh
the vendored files from the repository root with:

```sh
node packages/hub/scripts/vendor-xet-core-wasm.mjs \
  /path/to/xet-core/wasm/hf_xet_thin_wasm/pkg \
  861056a363e4e5e8661a7d8ecb22b923e54355a0
```
