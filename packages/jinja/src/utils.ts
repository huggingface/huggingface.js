/**
 * Function that mimics Python's range() function.
 * @param start The start value of the range.
 * @param stop The stop value of the range. If not provided, start will be 0 and stop will be the provided start value.
 * @param step The step value of the range. Defaults to 1.
 * @returns The range of numbers.
 */
export function range(start: number, stop?: number, step = 1): number[] {
	if (stop === undefined) {
		stop = start;
		start = 0;
	}

	if (step === 0) {
		throw new Error("range() step must not be zero");
	}

	const result: number[] = [];
	if (step > 0) {
		for (let i = start; i < stop; i += step) {
			result.push(i);
		}
	} else {
		for (let i = start; i > stop; i += step) {
			result.push(i);
		}
	}
	return result;
}

/**
 * Function that mimics Python's array slicing.
 * @param array The array to slice.
 * @param start The start index of the slice. Defaults to 0.
 * @param stop The last index of the slice. Defaults to `array.length`.
 * @param step The step value of the slice. Defaults to 1.
 * @returns The sliced array.
 */
export function slice<T>(array: T[], start?: number, stop?: number, step = 1): T[] {
	const direction = Math.sign(step);

	if (direction >= 0) {
		start = (start ??= 0) < 0 ? Math.max(array.length + start, 0) : Math.min(start, array.length);
		stop = (stop ??= array.length) < 0 ? Math.max(array.length + stop, 0) : Math.min(stop, array.length);
	} else {
		start = (start ??= array.length - 1) < 0 ? Math.max(array.length + start, -1) : Math.min(start, array.length - 1);
		stop = (stop ??= -1) < -1 ? Math.max(array.length + stop, -1) : Math.min(stop, array.length - 1);
	}

	const result: T[] = [];
	for (let i = start; direction * i < direction * stop; i += step) {
		result.push(array[i]);
	}
	return result;
}

/**
 * Function that mimics Python's string.title() function.
 * @param value The string to title case.
 * @returns The title cased string.
 */
// Jinja splits words on `([-\s({\[<]+)`:
// https://github.com/pallets/jinja/blob/3.1.6/src/jinja2/filters.py#L328
// `\s` is spelled out because the two languages define it differently. Python's `\s` matches
// exactly what `str.isspace()` does — an "Other"/"Separator" category, or bidirectional class
// WS, B or S (https://docs.python.org/3/library/stdtypes.html#str.isspace) — so it covers
// U+001C-U+001F (bidi B/S) and U+0085 (bidi B). ECMAScript's is WhiteSpace + LineTerminator
// (https://tc39.es/ecma262/#sec-white-space), which omits those four and adds U+FEFF.
// eslint-disable-next-line no-control-regex -- Python's `\s` matches these separators, so Jinja splits on them.
const WORD_SEPARATOR = /([-\t\n\v\f\r\x1c-\x1f \x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000({[<]+)/;

/** Upper-case the first code point and lower-case the rest. Indexing by code point keeps an
 *  astral letter such as Deseret "\u{10428}" intact instead of splitting its surrogate pair. */
function upperFirstLowerRest(value: string): string {
	const first = value.codePointAt(0);
	if (first === undefined) {
		return value;
	}
	const head = String.fromCodePoint(first);
	return head.toUpperCase() + value.slice(head.length).toLowerCase();
}

/** Jinja's `title` filter: upper-case each word's first character, lower-case the rest. */
export function titleCase(value: string): string {
	return value.split(WORD_SEPARATOR).map(upperFirstLowerRest).join("");
}

/** Python's `str.capitalize()`: title-case the first character, lower-case the rest. Title-case
 *  is not upper-case where a character expands — "\u00df" title-cases to "Ss" but upper-cases to
 *  "SS", which is why {@link titleCase} cannot be reused here. JS has no title-case mapping, so
 *  the ~45 code points whose title-case is a distinct character (the "\u01f3" digraphs, and the
 *  Greek iota-subscript block) still come out upper-cased. */
export function capitalizeFirst(value: string): string {
	const first = value.codePointAt(0);
	if (first === undefined) {
		return value;
	}
	const head = String.fromCodePoint(first);
	const upper = head.toUpperCase();
	return (upper.length > 1 ? upper[0] + upper.slice(1).toLowerCase() : upper) + value.slice(head.length).toLowerCase();
}

export function strftime_now(format: string): string {
	return strftime(new Date(), format);
}

/**
 * A minimalistic implementation of Python's strftime function.
 */
export function strftime(date: Date, format: string): string {
	// Set locale to undefined to use the default locale
	const monthFormatterLong = new Intl.DateTimeFormat(undefined, { month: "long" });
	const monthFormatterShort = new Intl.DateTimeFormat(undefined, { month: "short" });

	const pad2 = (n: number): string => (n < 10 ? "0" + n : n.toString());

	return format.replace(/%[YmdbBHM%]/g, (token) => {
		switch (token) {
			case "%Y":
				return date.getFullYear().toString();
			case "%m":
				return pad2(date.getMonth() + 1);
			case "%d":
				return pad2(date.getDate());
			case "%b":
				return monthFormatterShort.format(date);
			case "%B":
				return monthFormatterLong.format(date);
			case "%H":
				return pad2(date.getHours());
			case "%M":
				return pad2(date.getMinutes());
			case "%%":
				return "%";
			default:
				return token;
		}
	});
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Function that mimics Python's string.replace() function.
 */
export function replace(str: string, oldvalue: string, newvalue: string, count?: number | null): string {
	if (count === 0) {
		return str;
	}
	let remaining = count == null || count < 0 ? Infinity : count;
	// NB: Use a Unicode-aware global regex so unpaired surrogates won't match
	const pattern = oldvalue.length === 0 ? new RegExp("(?=)", "gu") : new RegExp(escapeRegExp(oldvalue), "gu");
	return str.replaceAll(pattern, (match) => {
		if (remaining > 0) {
			--remaining;
			return newvalue;
		}
		return match;
	});
}
