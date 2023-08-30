export function extractJSON(str: string): string {
	let firstOpen, firstClose, candidate;
	firstOpen = str.indexOf("{", (firstOpen ?? 0) + 1);
	do {
		firstClose = str.lastIndexOf("}");
		console.log("firstOpen: " + firstOpen, "firstClose: " + firstClose);
		if (firstClose <= firstOpen) {
			throw new Error("No JSON found in the answer.");
		}
		do {
			candidate = str.substring(firstOpen, firstClose + 1);
			console.log("candidate: " + candidate);
			try {
				const res = JSON.parse(candidate);
				return JSON.stringify(res);
			} catch (e) {
				console.log("...failed");
			}
			firstClose = str.substr(0, firstClose).lastIndexOf("}");
		} while (firstClose > firstOpen);
		firstOpen = str.indexOf("{", firstOpen + 1);
	} while (firstOpen != -1);

	throw new Error("No JSON found in the answer.");
}
