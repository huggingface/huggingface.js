// Adapted from https://github.com/mcmilk/BLAKE3-tests/blob/11a8abeceac93b5eba664eae3679efb4ffa5bc0a/blake3_test.c

import { describe, expect } from "vitest";
import { blake3Hex, blake3KeyedHex } from "../build/debug.js";
import { it } from "vitest";

const buffer = new Uint8Array(102400);
let i = 0;
let j = 0;

for (i = 0, j = 0; i < buffer.length; i++, j++) {
	if (j === 251) {
		j = 0;
	}
	buffer[i] = j;
}

function uint8ArrayFromString(str: string) {
	const arr = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) {
		arr[i] = str.charCodeAt(i);
	}
	return arr;
}

const key = uint8ArrayFromString("whats the Elvish word for friend");

const testCases = [
	{
		buf: buffer.slice(0, 0),
		expected: "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262",
		keyed: "92b2b75604ed3c761f9d6f62392c8a9227ad0ea3f09573e783f1498a4ed60d26",
	},
	{
		buf: buffer.slice(0, 1),
		expected: "2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213",
		keyed: "6d7878dfff2f485635d39013278ae14f1454b8c0a3a2d34bc1ab38228a80c95b",
	},
	{
		buf: buffer.slice(0, 2),
		expected: "7b7015bb92cf0b318037702a6cdd81dee41224f734684c2c122cd6359cb1ee63",
		keyed: "5392ddae0e0a69d5f40160462cbd9bd889375082ff224ac9c758802b7a6fd20a",
	},
	{
		buf: buffer.slice(0, 3),
		expected: "e1be4d7a8ab5560aa4199eea339849ba8e293d55ca0a81006726d184519e647f",
		keyed: "39e67b76b5a007d4921969779fe666da67b5213b096084ab674742f0d5ec62b9",
	},
	{
		buf: buffer.slice(0, 4),
		expected: "f30f5ab28fe047904037f77b6da4fea1e27241c5d132638d8bedce9d40494f32",
		keyed: "7671dde590c95d5ac9616651ff5aa0a27bee5913a348e053b8aa9108917fe070",
	},
	{
		buf: buffer.slice(0, 5),
		expected: "b40b44dfd97e7a84a996a91af8b85188c66c126940ba7aad2e7ae6b385402aa2",
		keyed: "73ac69eecf286894d8102018a6fc729f4b1f4247d3703f69bdc6a5fe3e0c8461",
	},
	{
		buf: buffer.slice(0, 6),
		expected: "06c4e8ffb6872fad96f9aaca5eee1553eb62aed0ad7198cef42e87f6a616c844",
		keyed: "82d3199d0013035682cc7f2a399d4c212544376a839aa863a0f4c91220ca7a6d",
	},
	{
		buf: buffer.slice(0, 7),
		expected: "3f8770f387faad08faa9d8414e9f449ac68e6ff0417f673f602a646a891419fe",
		keyed: "af0a7ec382aedc0cfd626e49e7628bc7a353a4cb108855541a5651bf64fbb28a",
	},
	{
		buf: buffer.slice(0, 8),
		expected: "2351207d04fc16ade43ccab08600939c7c1fa70a5c0aaca76063d04c3228eaeb",
		keyed: "be2f5495c61cba1bb348a34948c004045e3bd4dae8f0fe82bf44d0da245a0600",
	},
	{
		buf: buffer.slice(0, 63),
		expected: "e9bc37a594daad83be9470df7f7b3798297c3d834ce80ba85d6e207627b7db7b",
		keyed: "bb1eb5d4afa793c1ebdd9fb08def6c36d10096986ae0cfe148cd101170ce37ae",
	},
	{
		buf: buffer.slice(0, 64),
		expected: "4eed7141ea4a5cd4b788606bd23f46e212af9cacebacdc7d1f4c6dc7f2511b98",
		keyed: "ba8ced36f327700d213f120b1a207a3b8c04330528586f414d09f2f7d9ccb7e6",
	},
	{
		buf: buffer.slice(0, 65),
		expected: "de1e5fa0be70df6d2be8fffd0e99ceaa8eb6e8c93a63f2d8d1c30ecb6b263dee",
		keyed: "c0a4edefa2d2accb9277c371ac12fcdbb52988a86edc54f0716e1591b4326e72",
	},
	{
		buf: buffer.slice(0, 127),
		expected: "d81293fda863f008c09e92fc382a81f5a0b4a1251cba1634016a0f86a6bd640d",
		keyed: "c64200ae7dfaf35577ac5a9521c47863fb71514a3bcad18819218b818de85818",
	},
	{
		buf: buffer.slice(0, 128),
		expected: "f17e570564b26578c33bb7f44643f539624b05df1a76c81f30acd548c44b45ef",
		keyed: "b04fe15577457267ff3b6f3c947d93be581e7e3a4b018679125eaf86f6a628ec",
	},
	{
		buf: buffer.slice(0, 129),
		expected: "683aaae9f3c5ba37eaaf072aed0f9e30bac0865137bae68b1fde4ca2aebdcb12",
		keyed: "d4a64dae6cdccbac1e5287f54f17c5f985105457c1a2ec1878ebd4b57e20d38f",
	},
	{
		buf: buffer.slice(0, 1023),
		expected: "10108970eeda3eb932baac1428c7a2163b0e924c9a9e25b35bba72b28f70bd11",
		keyed: "c951ecdf03288d0fcc96ee3413563d8a6d3589547f2c2fb36d9786470f1b9d6e",
	},
	{
		buf: buffer.slice(0, 1024),
		expected: "42214739f095a406f3fc83deb889744ac00df831c10daa55189b5d121c855af7",
		keyed: "75c46f6f3d9eb4f55ecaaee480db732e6c2105546f1e675003687c31719c7ba4",
	},
	{
		buf: buffer.slice(0, 1025),
		expected: "d00278ae47eb27b34faecf67b4fe263f82d5412916c1ffd97c8cb7fb814b8444",
		keyed: "357dc55de0c7e382c900fd6e320acc04146be01db6a8ce7210b7189bd664ea69",
	},
	{
		buf: buffer.slice(0, 2048),
		expected: "e776b6028c7cd22a4d0ba182a8bf62205d2ef576467e838ed6f2529b85fba24a",
		keyed: "879cf1fa2ea0e79126cb1063617a05b6ad9d0b696d0d757cf053439f60a99dd1",
	},
	{
		buf: buffer.slice(0, 2049),
		expected: "5f4d72f40d7a5f82b15ca2b2e44b1de3c2ef86c426c95c1af0b6879522563030",
		keyed: "9f29700902f7c86e514ddc4df1e3049f258b2472b6dd5267f61bf13983b78dd5",
	},
	{
		buf: buffer.slice(0, 3072),
		expected: "b98cb0ff3623be03326b373de6b9095218513e64f1ee2edd2525c7ad1e5cffd2",
		keyed: "044a0e7b172a312dc02a4c9a818c036ffa2776368d7f528268d2e6b5df191770",
	},
	{
		buf: buffer.slice(0, 3073),
		expected: "7124b49501012f81cc7f11ca069ec9226cecb8a2c850cfe644e327d22d3e1cd3",
		keyed: "68dede9bef00ba89e43f31a6825f4cf433389fedae75c04ee9f0cf16a427c95a",
	},
	{
		buf: buffer.slice(0, 4096),
		expected: "015094013f57a5277b59d8475c0501042c0b642e531b0a1c8f58d2163229e969",
		keyed: "befc660aea2f1718884cd8deb9902811d332f4fc4a38cf7c7300d597a081bfc0",
	},
	{
		buf: buffer.slice(0, 4097),
		expected: "9b4052b38f1c5fc8b1f9ff7ac7b27cd242487b3d890d15c96a1c25b8aa0fb995",
		keyed: "00df940cd36bb9fa7cbbc3556744e0dbc8191401afe70520ba292ee3ca80abbc",
	},
	{
		buf: buffer.slice(0, 5120),
		expected: "9cadc15fed8b5d854562b26a9536d9707cadeda9b143978f319ab34230535833",
		keyed: "2c493e48e9b9bf31e0553a22b23503c0a3388f035cece68eb438d22fa1943e20",
	},
	{
		buf: buffer.slice(0, 5121),
		expected: "628bd2cb2004694adaab7bbd778a25df25c47b9d4155a55f8fbd79f2fe154cff",
		keyed: "6ccf1c34753e7a044db80798ecd0782a8f76f33563accaddbfbb2e0ea4b2d024",
	},
	{
		buf: buffer.slice(0, 6144),
		expected: "3e2e5b74e048f3add6d21faab3f83aa44d3b2278afb83b80b3c35164ebeca205",
		keyed: "3d6b6d21281d0ade5b2b016ae4034c5dec10ca7e475f90f76eac7138e9bc8f1d",
	},
	{
		buf: buffer.slice(0, 6145),
		expected: "f1323a8631446cc50536a9f705ee5cb619424d46887f3c376c695b70e0f0507f",
		keyed: "9ac301e9e39e45e3250a7e3b3df701aa0fb6889fbd80eeecf28dbc6300fbc539",
	},
	{
		buf: buffer.slice(0, 7168),
		expected: "61da957ec2499a95d6b8023e2b0e604ec7f6b50e80a9678b89d2628e99ada77a",
		keyed: "b42835e40e9d4a7f42ad8cc04f85a963a76e18198377ed84adddeaecacc6f3fc",
	},
	{
		buf: buffer.slice(0, 7169),
		expected: "a003fc7a51754a9b3c7fae0367ab3d782dccf28855a03d435f8cfe74605e7817",
		keyed: "ed9b1a922c046fdb3d423ae34e143b05ca1bf28b710432857bf738bcedbfa511",
	},
	{
		buf: buffer.slice(0, 8192),
		expected: "aae792484c8efe4f19e2ca7d371d8c467ffb10748d8a5a1ae579948f718a2a63",
		keyed: "dc9637c8845a770b4cbf76b8daec0eebf7dc2eac11498517f08d44c8fc00d58a",
	},
	{
		buf: buffer.slice(0, 8193),
		expected: "bab6c09cb8ce8cf459261398d2e7aef35700bf488116ceb94a36d0f5f1b7bc3b",
		keyed: "954a2a75420c8d6547e3ba5b98d963e6fa6491addc8c023189cc519821b4a1f5",
	},
	{
		buf: buffer.slice(0, 102400),
		expected: "bc3e3d41a1146b069abffad3c0d44860cf664390afce4d9661f7902e7943e085",
		keyed: "1c35d1a5811083fd7119f5d5d1ba027b4d01c0c6c49fb6ff2cf75393ea5db4a7",
	},
];

describe("blake3", () => {
	describe("BLAKE3_TESTS", () => {
		for (const testCase of testCases) {
			it(`should pass ${testCase.buf.length} bytes`, () => {
				const result = blake3Hex(testCase.buf);
				expect(result).toBe(testCase.expected);

				const resultKeyed = blake3KeyedHex(testCase.buf, key);
				expect(resultKeyed).toBe(testCase.keyed);
			});
		}
	});
});
