// fn splitmix64_next(state: &mut u64) -> u64 {
//   *state = state.wrapping_add(0x9E3779B97F4A7C15);
//   let mut z = *state;
//   z = (z ^ (z >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
//   z = (z ^ (z >> 27)).wrapping_mul(0x94D049BB133111EB);
//   z ^ (z >> 31)
// }

// fn create_random_data(n: usize, seed: u64) -> Vec<u8> {
//   // This test will actually need to be run in different environments, so to generate
//   // the table below, create random data using a simple SplitMix rng that can be ported here
//   // as is without dependening on other packages.
//   let mut ret = Vec::with_capacity(n + 7);

//   let mut state = seed;

//   while ret.len() < n {
//       let next_u64 = splitmix64_next(&mut state);
//       ret.extend_from_slice(&next_u64.to_le_bytes());
//   }

//   // Has extra bits on there since we're adding in blocks of 8.
//   ret.resize(n, 0);

//   ret
// }

export function createRandomArray(size: u32, seed: u64): ArrayBuffer {
	const array = new ArrayBuffer(size + 7);
	const view = new DataView(array);
	let state = seed;
	for (let i: u32 = 0; i < size; i += 8) {
		state = state + 0x9e3779b97f4a7c15;
		let z = state;
		z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9;
		z = (z ^ (z >> 27)) * 0x94d049bb133111eb;
		view.setUint64(i, z ^ (z >> 31), true);
	}
	return array.slice(0, size);
}
