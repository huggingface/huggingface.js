# Fix for huggingface.js issue #1979 — sharded safetensors metadata 3 → 2 HTTP/shard

**Author:** Francesco Pernice Botta (`999purple999`)
**Branch:** `fix/1979-sharded-safetensors-2hops`
**Issue:** [huggingface/huggingface.js#1979](https://github.com/huggingface/huggingface.js/issues/1979)
**Touched files:**
- `packages/hub/src/lib/parse-safetensors-metadata.ts` (114 inserts / 1 delete)
- `packages/hub/src/lib/parse-safetensors-metadata-fast.spec.ts` (new, 3 unit tests, fetch mocked)

---

## The problem in 6 lines

`parseSafetensorsMetadata` on a sharded repo does **3 HTTP requests per shard**:
1. `fileDownloadInfo` probe (`Range: bytes=0-0`) — to learn size + etag + xet redirect
2. `WebBlob.slice(0, 8).arrayBuffer()` — read the 8-byte little-endian header length
3. `WebBlob.slice(8, 8+len).arrayBuffer()` — read the JSON header body

For heavily sharded models the request fan-out becomes prohibitive:
| Model | Shards | Old reqs | New reqs |
|---|---|---|---|
| Kimi-K2.5 | 64 | 192 | 128 |
| DeepSeek-Math-V2 | 163 | **489 (fails 100% in benches)** | 326 |
| Qwen3.5-397B | 94 | 282 | 188 |

The size/etag from step 1 is **never used** when parsing sharded headers — all the
caller needs is the JSON body. The probe is wasted.

---

## The fix

New private helper `parseSingleFileFast(path, params)` that issues exactly 2
direct range requests against the resolve URL, bypassing `downloadFile` /
`fileDownloadInfo`:

```ts
// Request #1 — bytes 0..7  → 8-byte LE header length
const lenResp = await fetch(url, { headers: { ...auth, Range: "bytes=0-7" } });
if (lenResp.status !== 206) throw …      // refuse: 200 means server ignored Range
const len = new DataView(await lenResp.arrayBuffer()).getBigUint64(0, true);
…validate len > 0, len ≤ MAX_HEADER_LENGTH…

// Request #2 — bytes 8..8+len-1  → JSON header body
const headerResp = await fetch(url, { headers: { ...auth, Range: `bytes=8-${end}` } });
if (headerResp.status !== 206) throw …
return JSON.parse(await headerResp.text());
```

`fetchAllHeaders()` is rewired to call `parseSingleFileFast` instead of
`parseSingleFile` for every shard. The single-file (non-sharded) entry path
is **unchanged** — there is no benefit there and it preserves xet compatibility
for non-sharded checkpoints.

### Safety invariants preserved

- Auth (`Authorization: Bearer …`) forwarded identically to `fileDownloadInfo`
- `MAX_HEADER_LENGTH = 25 MB` cap enforced before issuing request #2
- `Range: bytes=0-0` semantics not needed (we now want 0-7, not 0-0)
- Custom `fetch` override path preserved (used by proxy / header-rewrite users)
- `URL` construction mirrors `fileDownloadInfo` exactly (bucket vs model
  prefix, revision encoding, raw=false)

### The 200-response trap

If a misbehaving CDN returns 200 (the entire shard body) instead of 206, the
old `WebBlob` slow path would still issue range-tagged sub-requests and behave
correctly. The new fast path issues a raw Range request and trusts the
server, so we **must** refuse a 200 response — otherwise we'd buffer a 10+ GB
shard into RAM. The fix calls `response.body?.cancel()` and throws.

---

## Tests

### New unit tests (offline, mocked `fetch`) — `parse-safetensors-metadata-fast.spec.ts`

```
✓ sharded path issues exactly 2 HTTP requests per shard (not 3)
✓ rejects a shard response that returns 200 (server ignored Range)
✓ rejects an oversized header length
```

The first test instruments `fetch` and asserts:
- `bytes=0-7` Range header on the length-probe request
- `bytes=8-…` Range header on the body-read request
- **exactly 2N shard requests** for N shards (was 3N)

### Existing integration tests (`parse-safetensors-metadata.spec.ts`)

These hit real HF Hub URLs (`bigscience/bloom`, `Alignment-Lab-AI/ALAI-gemma-7b`,
`hf-internal-testing/sharded-model-metadata-num-parameters`). They exercise the
sharded path, so they cover this change end-to-end. Run them with:

```bash
cd packages/hub
pnpm install        # workspace deps
pnpm test           # vitest run
```

I have NOT run these locally — they need network + a clean pnpm workspace install
(~5-10 min). The CI on the PR will run them.

---

## How to verify locally

```bash
git clone -b fix/1979-sharded-safetensors-2hops <your-fork>
cd huggingface.js
pnpm install
pnpm --filter @huggingface/hub test
# expect: 3 new unit tests PASS, all existing safetensors integration tests PASS
```

---

## Push instructions (run when ready)

```bash
cd workrepo/huggingface.js
gh repo fork huggingface/huggingface.js --clone=false --remote=true   # fork once
git push -u origin fix/1979-sharded-safetensors-2hops
gh pr create \
  --base main \
  --repo huggingface/huggingface.js \
  --title "[hub] sharded safetensors: 3 → 2 HTTP requests per shard (closes #1979)" \
  --body "$(cat FIX_ISSUE_1979_README.md)"
```

---

## Trade-offs considered

- **Why not fallback to `parseSingleFile` on non-206?** Because a server that
  returns 200 to a Range request is *streaming the whole file*. Falling back to
  WebBlob.slice() would re-issue Range — same outcome but with extra latency.
  Failing loudly is correct.
- **Why keep `parseSingleFile`?** xet single-file checkpoints rely on
  `XetBlob`'s reconstruction-URL logic that lives behind `fileDownloadInfo`.
  Touching that is out of scope and risky.
- **Why not also try to dedupe `fileExists` + index download?** Different issue
  (#1721 / #1704 area, already MERGED via #2134). Out of scope here.
