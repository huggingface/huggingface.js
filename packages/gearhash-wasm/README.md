JS and WASM implementations of https://github.com/srijs/rust-gearhash

Using [AssemblyScript](https://www.assemblyscript.org/) to generate a lean WASM.

## Usage

```javascript
import { nextMatch } from '@huggingface/gearhash-wasm';

// Create a Uint8Array of data to search through
const data = new Uint8Array(1000000); // Example: 1MB of data
// ... fill data with your content ...

// Search for a pattern with a specific mask
const mask = 0x0000d90003530000n; // Example mask as a BigInt
const matchResult = nextMatch(data, mask);

// matchIndex will be the position where the pattern was found
// or -1 if no match was found
```

The `nextMatch` function takes two parameters:
- `data`: A Uint8Array containing the data to search through
- `mask`: A BigInt representing the pattern mask to search for

The function returns an object with the `position` (i32) and `hash` (u64) properties

You can continuously feed data like this:

```javascript
let hash = 0n;
const mask = 0x0000d90003530000n;

let position = 0;
for await (const chunk of dataSource) {
  let index = 0;
  while (1) {
    let match = nextMatch(chunk.subArray(index), mask, hash);

    if (match.position !== -1) {
      console.log({
        position: match.position + position,
        hash: match.hash
      })

      index += match.position;
      position = 0;
      hash = 0n;
    } else {
      position += chunk.length - index;
      break;
    }
  }
}

console.log(position, "bytes without a match, ending hash: ", hash);
```