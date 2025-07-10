JS and WASM implementations of https://github.com/srijs/rust-gearhash

Using [AssemblyScript](https://www.assemblyscript.org/) to generate a lean WASM.

## Usage

```javascript
import { nextMatch } from '@huggingface/gearhash-wasm';

// Create a Uint8Array of data to search through
const data = new Uint8Array(1000000); // Example: 1MB of data
// ... fill data with your content ...

const mask = 0x0000d90003530000n; // Example mask as a BigInt, more 1s in binary repr => bigger chunks
//^ it has 11 1s in binary, so chunks will be ~2048 long
const match = nextMatch(data, mask);
const allMatches = nextMatches(data, mask).matches;
```

The `nextMatch` function takes two parameters:
- `data`: A Uint8Array containing the data to search through
- `mask`: A BigInt, the more 1s it has in its binary representation, the bigger the chunk

The function returns an object with the `position` (i32) and `hash` (u64) properties

You can continuously feed data like this:

```javascript
let hash = 0n;
const mask = 0x0000d90003530000n;

let length = 0; // extra length not processed
for await (const chunk of dataSource) {
  let index = 0;
  while (1) {
    let match = nextMatch(chunk.subArray(index), mask, hash);

    if (match.position !== -1) {
      console.log({
        length: match.position + length,
        hash: match.hash
      })

      index += match.position;
      length = 0;
      hash = 0n;
    } else {
      length += chunk.length - index;
      break;
    }
  }
}

console.log(length, "bytes without a match, ending hash: ", hash);
```

or, more performant with `nextMatches`:

```javascript
let hash = 0n;
const mask = 0x0000d90003530000n;

let length = 0;
for await (const chunk of dataSource) {
  const result = nextMatches(chunk, mask, hash);
  let lastPosition = 0;
  for (const match of result.matches) {
    console.log({
      length: match.position - lastPosition + length,
      hash: match.hash
    });

    length = 0;
    lastPosition = match.position;
  }
  length = result.remaining;
  hash = result.hash;
}

console.log(length, "bytes without a match, ending hash: ", hash);
```

## Possible improvements

SIMD