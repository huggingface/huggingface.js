// Adapted from https://github.com/mcmilk/BLAKE3-tests/blob/11a8abeceac93b5eba664eae3679efb4ffa5bc0a/blake3_test.c

import { blake3Hex } from "../build/debug.js";

const buffer = new Uint8Array(102400);
let i = 0;
let j = 0;

for (i = 0, j = 0; i < buffer.length; i++, j++) {
	if (j === 251) {
		j = 0;
	}
	buffer[i] = j;
}

const testCases = [
	{
		buf: buffer.slice(0, 0),
		expected: "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262",
	},
	{
		buf: buffer.slice(0, 1),
		expected: "2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213",
	},
	{
		buf: buffer.slice(0, 2),
		expected: "7b7015bb92cf0b318037702a6cdd81dee41224f734684c2c122cd6359cb1ee63",
	},
	{
		buf: buffer.slice(0, 3),
		expected: "e1be4d7a8ab5560aa4199eea339849ba8e293d55ca0a81006726d184519e647f",
	},
	{
		buf: buffer.slice(0, 4),
		expected: "f30f5ab28fe047904037f77b6da4fea1e27241c5d132638d8bedce9d40494f32",
	},
	{
		buf: buffer.slice(0, 5),
		expected: "b40b44dfd97e7a84a996a91af8b85188c66c126940ba7aad2e7ae6b385402aa2",
	},
	{
		buf: buffer.slice(0, 6),
		expected: "06c4e8ffb6872fad96f9aaca5eee1553eb62aed0ad7198cef42e87f6a616c844",
	},
	{
		buf: buffer.slice(0, 7),
		expected: "3f8770f387faad08faa9d8414e9f449ac68e6ff0417f673f602a646a891419fe",
	},
	{
		buf: buffer.slice(0, 8),
		expected: "2351207d04fc16ade43ccab08600939c7c1fa70a5c0aaca76063d04c3228eaeb",
	},
	{
		buf: buffer.slice(0, 63),
		expected: "e9bc37a594daad83be9470df7f7b3798297c3d834ce80ba85d6e207627b7db7b",
	},
	{
		buf: buffer.slice(0, 64),
		expected: "4eed7141ea4a5cd4b788606bd23f46e212af9cacebacdc7d1f4c6dc7f2511b98",
	},
	{
		buf: buffer.slice(0, 65),
		expected: "de1e5fa0be70df6d2be8fffd0e99ceaa8eb6e8c93a63f2d8d1c30ecb6b263dee",
	},
	{
		buf: buffer.slice(0, 127),
		expected: "d81293fda863f008c09e92fc382a81f5a0b4a1251cba1634016a0f86a6bd640d",
	},
	{
		buf: buffer.slice(0, 128),
		expected: "f17e570564b26578c33bb7f44643f539624b05df1a76c81f30acd548c44b45ef",
	},
	{
		buf: buffer.slice(0, 129),
		expected: "683aaae9f3c5ba37eaaf072aed0f9e30bac0865137bae68b1fde4ca2aebdcb12",
	},
	{
		buf: buffer.slice(0, 1023),
		expected: "10108970eeda3eb932baac1428c7a2163b0e924c9a9e25b35bba72b28f70bd11",
	},
	{
		buf: buffer.slice(0, 1024),
		expected: "42214739f095a406f3fc83deb889744ac00df831c10daa55189b5d121c855af7",
	},
	{
		buf: buffer.slice(0, 1025),
		expected: "d00278ae47eb27b34faecf67b4fe263f82d5412916c1ffd97c8cb7fb814b8444",
	},
	{
		buf: buffer.slice(0, 2048),
		expected: "e776b6028c7cd22a4d0ba182a8bf62205d2ef576467e838ed6f2529b85fba24a",
	},
	{
		buf: buffer.slice(0, 2049),
		expected: "5f4d72f40d7a5f82b15ca2b2e44b1de3c2ef86c426c95c1af0b6879522563030",
	},
	{
		buf: buffer.slice(0, 3072),
		expected: "b98cb0ff3623be03326b373de6b9095218513e64f1ee2edd2525c7ad1e5cffd2",
	},
	{
		buf: buffer.slice(0, 3073),
		expected: "7124b49501012f81cc7f11ca069ec9226cecb8a2c850cfe644e327d22d3e1cd3",
	},
	{
		buf: buffer.slice(0, 4096),
		expected: "015094013f57a5277b59d8475c0501042c0b642e531b0a1c8f58d2163229e969",
	},
	{
		buf: buffer.slice(0, 4097),
		expected: "9b4052b38f1c5fc8b1f9ff7ac7b27cd242487b3d890d15c96a1c25b8aa0fb995",
	},
	{
		buf: buffer.slice(0, 5120),
		expected: "9cadc15fed8b5d854562b26a9536d9707cadeda9b143978f319ab34230535833",
	},
	{
		buf: buffer.slice(0, 5121),
		expected: "628bd2cb2004694adaab7bbd778a25df25c47b9d4155a55f8fbd79f2fe154cff",
	},
	{
		buf: buffer.slice(0, 6144),
		expected: "3e2e5b74e048f3add6d21faab3f83aa44d3b2278afb83b80b3c35164ebeca205",
	},
	{
		buf: buffer.slice(0, 6145),
		expected: "f1323a8631446cc50536a9f705ee5cb619424d46887f3c376c695b70e0f0507f",
	},
	{
		buf: buffer.slice(0, 7168),
		expected: "61da957ec2499a95d6b8023e2b0e604ec7f6b50e80a9678b89d2628e99ada77a",
	},
	{
		buf: buffer.slice(0, 7169),
		expected: "a003fc7a51754a9b3c7fae0367ab3d782dccf28855a03d435f8cfe74605e7817",
	},
	{
		buf: buffer.slice(0, 8192),
		expected: "aae792484c8efe4f19e2ca7d371d8c467ffb10748d8a5a1ae579948f718a2a63",
	},
	{
		buf: buffer.slice(0, 8193),
		expected: "bab6c09cb8ce8cf459261398d2e7aef35700bf488116ceb94a36d0f5f1b7bc3b",
	},
	{
		buf: buffer.slice(0, 102400),
		expected: "bc3e3d41a1146b069abffad3c0d44860cf664390afce4d9661f7902e7943e085",
	},
];

for (const testCase of testCases) {
	const result = blake3Hex(testCase.buf);
	console.log(result);

	if (result !== testCase.expected) {
		console.error(`Test case failed: ${testCase.buf.length} bytes`);
		console.error(`Expected: ${testCase.expected}`);
		console.error(`Actual: ${result}`);
		process.exit(1);
	}
}

console.log("All test cases passed");
