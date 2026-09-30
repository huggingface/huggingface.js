/**
 * Port of Python's `fnmatch.fnmatchcase`: `*` matches anything (including `/`), `?` matches one character,
 * `[seq]` / `[!seq]` match a character class.
 */
export function fnmatch(path: string, pattern: string): boolean {
	return toRegExp(pattern).test(path);
}

function toRegExp(pattern: string): RegExp {
	let regex = "";
	let i = 0;
	while (i < pattern.length) {
		const char = pattern[i++];
		if (char === "*") {
			regex += ".*";
		} else if (char === "?") {
			regex += ".";
		} else if (char === "[") {
			let j = i;
			if (pattern[j] === "!") {
				j++;
			}
			if (pattern[j] === "]") {
				j++;
			}
			while (j < pattern.length && pattern[j] !== "]") {
				j++;
			}
			if (j >= pattern.length) {
				regex += "\\[";
			} else {
				let body = pattern.slice(i, j).replace(/\\/g, "\\\\");
				i = j + 1;
				if (body[0] === "!") {
					body = "^" + body.slice(1);
				} else if (body[0] === "^") {
					body = "\\" + body;
				}
				regex += `[${body.replace(/]/g, "\\]")}]`;
			}
		} else {
			regex += char.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
		}
	}
	return new RegExp(`^${regex}$`, "s");
}
