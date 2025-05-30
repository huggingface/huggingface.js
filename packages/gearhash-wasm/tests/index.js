import assert from "assert";
import { nextMatch, nextMatches } from "../build/debug.js";

// Simple seeded random number generator
function seededRandom(seed) {
	return function () {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
}

// Create seeded random data
const seed = 12345; // Fixed seed for deterministic results
const random = seededRandom(seed);
const randomData = new Uint8Array(150_000).map(() => Math.floor(random() * 256));

// Test with a known mask
assert.deepStrictEqual(nextMatch(randomData, 0x0000d90003530000n), { position: 459, hash: 9546224108073667431n });
assert.deepStrictEqual(nextMatch(randomData.subarray(459), 0x0000d90003530000n), {
	position: 3658,
	hash: 4043712133052525799n,
});

assert.deepStrictEqual(nextMatches(randomData, 0x0000d90003530000n), {
	remaining: 1206,
	hash: 18262966296195680063n,
	matches: [
		{ position: 459, hash: 9546224108073667431n },
		{ position: 3658, hash: 4043712133052525799n },
		{ position: 2013, hash: 6111702085179831561n },
		{ position: 1593, hash: 12901166541873917249n },
		{ position: 1566, hash: 7692186462913612151n },
		{ position: 211, hash: 16543980755458487441n },
		{ position: 1778, hash: 15644384556715661587n },
		{ position: 566, hash: 9793366463237592247n },
		{ position: 2079, hash: 11221321116171663064n },
		{ position: 2940, hash: 1564726223525919786n },
		{ position: 809, hash: 15395839328876515337n },
		{ position: 946, hash: 10585747199093122759n },
		{ position: 854, hash: 4479393852251501569n },
		{ position: 436, hash: 15702966577303948694n },
		{ position: 2165, hash: 17148900940125069205n },
		{ position: 273, hash: 11505890591385615424n },
		{ position: 1459, hash: 10774060112464860369n },
		{ position: 158, hash: 2233823235057951370n },
		{ position: 7, hash: 1983310208686139647n },
		{ position: 1926, hash: 4499661659570185271n },
		{ position: 1529, hash: 16090517590946392505n },
		{ position: 1751, hash: 12536054222087023458n },
		{ position: 1222, hash: 334146166487300408n },
		{ position: 2230, hash: 6981431015531396608n },
		{ position: 826, hash: 11877997991061156988n },
		{ position: 33, hash: 8454422284689001989n },
		{ position: 1731, hash: 15095819886766624527n },
		{ position: 8842, hash: 6362744947164356842n },
		{ position: 928, hash: 3627691864743766239n },
		{ position: 684, hash: 1137480049753900759n },
		{ position: 5301, hash: 10541554813326859395n },
		{ position: 2546, hash: 14704288147532701373n },
		{ position: 11856, hash: 9653226176528805511n },
		{ position: 650, hash: 12714262162290274678n },
		{ position: 1346, hash: 2525679969999819421n },
		{ position: 353, hash: 2532749299807420736n },
		{ position: 1091, hash: 693561665209300041n },
		{ position: 729, hash: 11014435606385442344n },
		{ position: 1204, hash: 10083883741570968570n },
		{ position: 1671, hash: 12308901096302322810n },
		{ position: 1362, hash: 13399339535394154305n },
		{ position: 1858, hash: 792389713896955383n },
		{ position: 2248, hash: 15568664728418446816n },
		{ position: 1790, hash: 4328805983976714464n },
		{ position: 634, hash: 722305044694988273n },
		{ position: 741, hash: 17978970776495983968n },
		{ position: 901, hash: 5911861036065769110n },
		{ position: 302, hash: 1334790489764850513n },
		{ position: 1435, hash: 16174119877357924758n },
		{ position: 61, hash: 12103430617785210167n },
		{ position: 1, hash: 35334639850667n },
		{ position: 2074, hash: 7449519750512442798n },
		{ position: 2061, hash: 1805950971475184864n },
		{ position: 1612, hash: 5837797879339327135n },
		{ position: 3281, hash: 6649572008787195357n },
		{ position: 39, hash: 16137242368496690753n },
		{ position: 263, hash: 8133543763164586431n },
		{ position: 2333, hash: 17019949823094703325n },
		{ position: 1160, hash: 8949503946391874147n },
		{ position: 641, hash: 18344573417262448121n },
		{ position: 2588, hash: 13345294745157777411n },
		{ position: 3116, hash: 7832639641689314418n },
		{ position: 4671, hash: 13762161036402935807n },
		{ position: 276, hash: 10924644382434953404n },
		{ position: 4430, hash: 9045519457622973922n },
		{ position: 32, hash: 4188636638659752674n },
		{ position: 2470, hash: 1184167847892138852n },
		{ position: 694, hash: 11699508361075635892n },
		{ position: 1703, hash: 9012268790677532920n },
		{ position: 47, hash: 6528251874505412319n },
		{ position: 2672, hash: 8484789019946020371n },
		{ position: 202, hash: 1365160724288031760n },
		{ position: 467, hash: 10426152000837661087n },
		{ position: 496, hash: 3605417399306471847n },
		{ position: 3777, hash: 8410473338876477323n },
		{ position: 80, hash: 3693273711429567121n },
		{ position: 813, hash: 9224216742837123228n },
		{ position: 3115, hash: 5150752707627454542n },
		{ position: 806, hash: 8797260981186887018n },
		{ position: 4915, hash: 1483374079741560715n },
		{ position: 2118, hash: 1742900153494554703n },
		{ position: 1515, hash: 4635371751468227093n },
		{ position: 2393, hash: 15282968615371427111n },
		{ position: 4331, hash: 4659818917792066036n },
		{ position: 1188, hash: 3862441883651577693n },
		{ position: 2663, hash: 8524789558855117254n },
	],
});

console.log("ok");
