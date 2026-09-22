# `@huggingface/lerobot`

A parser for [LeRobot](https://github.com/huggingface/lerobot) robotics datasets hosted on the Hugging Face Hub.

Everything is read over ranged HTTP requests, so it works unchanged in the browser and in Node, and it
never downloads a whole dataset to answer a question about it.

## Why

LeRobot datasets exist in two layouts. In `v2.0` / `v2.1` every episode has its own video and parquet
file, and the episode index is a JSON Lines file. In `v3.0` episodes are concatenated into shared files
and the index is parquet, so an episode is a byte range and a time range inside a larger file.

This package hides that difference behind one `LeRobotEpisode` shape.

## Install

```bash
npm install @huggingface/lerobot
```

[hyparquet](https://github.com/hyparam/hyparquet) comes with it, and is used to read the `v3.0`
episode index. It is imported on demand, so callers that only need `info()` or a `v2` dataset never
load it.

## Usage

```ts
import { LeRobotDataset } from "@huggingface/lerobot";

const dataset = new LeRobotDataset("lerobot/svla_so101_pickplace");

const info = await dataset.info();
// {
//   codebaseVersion: "v3.0",
//   robotType: "so100_follower",
//   fps: 30,
//   totalEpisodes: 50,
//   totalFrames: 11939,
//   cameras: [{ key: "observation.images.up", width: 640, height: 480, codec: "av1" }, ...],
//   joints: { "observation.state": ["shoulder_pan.pos", "shoulder_lift.pos", ...] },
//   ...
// }

const episodes = await dataset.episodes({ limit: 10 });
// [
//   {
//     index: 0,
//     length: 303,
//     durationSec: 10.1,
//     tasks: ["pink lego brick into the transparent box"],
//     videos: [{ cameraKey: "observation.images.up", url: "https://...", fromSec: 0, toSec: 10.1 }, ...],
//     data: { url: "https://.../data/chunk-000/file-000.parquet", fromRow: 0, toRow: 303 },
//   },
//   ...
// ]
```

`videos[].fromSec` / `toSec` are the episode's offsets inside `url`. On `v3.0` several episodes share
one file, so seek to `fromSec` and stop at `toSec`; on `v2.x` each episode has its own file and the
range simply spans it.

`data` points at the frame rows for that episode, for callers that want to chart
`observation.state` or `action` themselves.

### Pinning a revision

Pass a commit sha whenever the result is stored or cached anywhere, so a later push cannot change what
you parsed:

```ts
const dataset = new LeRobotDataset("lerobot/svla_so101_pickplace", {
	revision: "f641879e22172be7e8161d5e6c1503c2d2feb657",
});
```

### Private and gated datasets

Pass your own `fetch` to add credentials:

```ts
const dataset = new LeRobotDataset("my-org/private-dataset", {
	additionalFetchHeaders: { Authorization: `Bearer ${accessToken}` },
});
```

In a browser on `huggingface.co`, session cookies are enough:

```ts
const dataset = new LeRobotDataset(repoId, {
	fetch: (url, init) => fetch(url, { ...init, credentials: "same-origin" }),
});
```

## Parsing without fetching

`parseInfo` is pure, for callers that already have the bytes:

```ts
import { parseInfo } from "@huggingface/lerobot";

const info = parseInfo(await readFile("meta/info.json", "utf8"));
```

It throws on anything that is not a usable info file, including an LFS pointer, a truncated read, or a
`codebase_version` this package does not implement.
