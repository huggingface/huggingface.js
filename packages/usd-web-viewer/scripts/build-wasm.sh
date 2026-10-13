#!/usr/bin/env bash
# Builds the WASM module into wasm/: cargo (size profile) -> stub the layer
# writers -> wasm-bindgen (web target) -> wasm-opt -Os, and prints the brotli size.
# Fetches wasm-bindgen if it isn't on PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

OPT_LEVEL="${OPT_LEVEL:-s}"
OUT=wasm
WASM_BINDGEN_VERSION=0.2.129

# The wasm-bindgen CLI matching the crate's pinned wasm-bindgen: from PATH, else the
# release binary for this platform (checked against its sha256), else built with cargo.
wasm_bindgen() {
  if command -v wasm-bindgen >/dev/null && [ "$(wasm-bindgen --version)" = "wasm-bindgen $WASM_BINDGEN_VERSION" ]; then
    command -v wasm-bindgen
    return
  fi
  local cache="${XDG_CACHE_HOME:-$HOME/.cache}/usd-web-viewer/wasm-bindgen-$WASM_BINDGEN_VERSION"
  if [ -x "$cache/bin/wasm-bindgen" ]; then
    echo "$cache/bin/wasm-bindgen"
    return
  fi
  local target sha256
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) target=x86_64-unknown-linux-musl sha256=82d12bb940e2d4e72e0d5605387fc1b8ca179044e012b620f0ce4e7440e8320e ;;
    Linux-aarch64) target=aarch64-unknown-linux-musl sha256=2ed4351c35dd9440308bbb02767d47ea278efe851a52465300f3c94f5b6c2a87 ;;
    Darwin-arm64) target=aarch64-apple-darwin sha256=81d4a23d56b3c3eb8187658329116d50e0b228a93b343825fb71f70179051cd1 ;;
    Darwin-x86_64) target=x86_64-apple-darwin sha256=7e028879a68ec53dae14048b55cc5215f6df75b17a9c1426fac8fa086d3202fd ;;
    *) target='' ;;
  esac
  mkdir -p "$cache"
  if [ -n "$target" ]; then
    local name="wasm-bindgen-$WASM_BINDGEN_VERSION-$target"
    local tarball="$cache/$name.tar.gz"
    if curl -fsSL --retry 3 -o "$tarball" "https://github.com/wasm-bindgen/wasm-bindgen/releases/download/$WASM_BINDGEN_VERSION/$name.tar.gz" &&
      [ "$(node -e "process.stdout.write(require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync(process.argv[1])).digest('hex'))" "$tarball")" = "$sha256" ]; then
      tar -xzf "$tarball" -C "$cache"
      mkdir -p "$cache/bin"
      mv "$cache/$name/wasm-bindgen" "$cache/bin/wasm-bindgen"
      rm -rf "$tarball" "$cache/$name"
      echo "$cache/bin/wasm-bindgen"
      return
    fi
    rm -f "$tarball"
    echo "wasm-bindgen $WASM_BINDGEN_VERSION: release download failed or didn't match its sha256, building it with cargo" >&2
  fi
  cargo install wasm-bindgen-cli --version "$WASM_BINDGEN_VERSION" --locked --root "$cache" >&2
  echo "$cache/bin/wasm-bindgen"
}
WASM_BINDGEN="$(wasm_bindgen)"

CARGO_PROFILE_RELEASE_OPT_LEVEL="$OPT_LEVEL" cargo build --locked --release --target wasm32-unknown-unknown -p usd-wasm
node scripts/stub-writers.mjs target/wasm32-unknown-unknown/release/usd_wasm.wasm target/usd_wasm_stubbed.wasm
"$WASM_BINDGEN" --target web --out-dir "$OUT" --out-name usd_wasm target/usd_wasm_stubbed.wasm
node_modules/.bin/wasm-opt -O"$OPT_LEVEL" --strip-debug --strip-producers \
  --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext --enable-mutable-globals \
  --enable-reference-types --enable-multivalue \
  "$OUT/usd_wasm_bg.wasm" -o "$OUT/usd_wasm_bg.wasm"

node -e "
  const zlib = require('node:zlib');
  const size = zlib.brotliCompressSync(require('node:fs').readFileSync(process.argv[1]), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
  console.log('usd_wasm_bg.wasm: ' + (size / 1024).toFixed(1) + ' KiB brotli');
" "$OUT/usd_wasm_bg.wasm"
