/**
 * Represents tokens that our language understands in parsing.
 */
export const TOKEN_TYPES = Object.freeze({
	Text: "Text", // The text between Jinja statements or expressions

	NumericLiteral: "NumericLiteral", // e.g., 123, 1.0
	StringLiteral: "StringLiteral", // 'string'
	Identifier: "Identifier", // Variables, functions, statements, booleans, etc.
	Equals: "Equals", // =
	OpenParen: "OpenParen", // (
	CloseParen: "CloseParen", // )
	OpenStatement: "OpenStatement", // {%
	CloseStatement: "CloseStatement", // %}
	OpenExpression: "OpenExpression", // {{
	CloseExpression: "CloseExpression", // }}
	OpenSquareBracket: "OpenSquareBracket", // [
	CloseSquareBracket: "CloseSquareBracket", // ]
	OpenCurlyBracket: "OpenCurlyBracket", // {
	CloseCurlyBracket: "CloseCurlyBracket", // }
	Comma: "Comma", // ,
	Dot: "Dot", // .
	Colon: "Colon", // :
	Pipe: "Pipe", // |

	CallOperator: "CallOperator", // ()
	AdditiveBinaryOperator: "AdditiveBinaryOperator", // + - ~
	MultiplicativeBinaryOperator: "MultiplicativeBinaryOperator", // * / // %
	ExponentiationBinaryOperator: "ExponentiationBinaryOperator", // **
	ComparisonBinaryOperator: "ComparisonBinaryOperator", // < > <= >= == !=
	UnaryOperator: "UnaryOperator", // ! - +
	Comment: "Comment", // {# ... #}
});

export type TokenType = keyof typeof TOKEN_TYPES;

/**
 * Represents a single token in the template.
 */
export class Token {
	/**
	 * Constructs a new Token.
	 * @param {string} value The raw value as seen inside the source code.
	 * @param {TokenType} type The type of token.
	 */
	constructor(
		public value: string,
		public type: TokenType,
	) {}
}

// NOTE: The character predicates operate on UTF-16 code units (as returned by `charCodeAt`),
// which is `NaN` when reading past the end of the input (and so matches none of them).

/** Equivalent to `/\w/`: `[A-Za-z0-9_]` */
function isWord(code: number): boolean {
	return (
		(code >= 97 && code <= 122) || // a-z
		(code >= 65 && code <= 90) || // A-Z
		(code >= 48 && code <= 57) || // 0-9
		code === 95 // _
	);
}

/** Equivalent to `/[0-9]/` */
function isInteger(code: number): boolean {
	return code >= 48 && code <= 57;
}

/** Equivalent to `/\s/` */
function isWhitespace(code: number): boolean {
	if (code <= 32) {
		// Space, or one of \t \n \v \f \r
		return code === 32 || (code >= 9 && code <= 13);
	}
	return (
		code > 127 &&
		(code === 0xa0 ||
			code === 0x1680 ||
			(code >= 0x2000 && code <= 0x200a) ||
			code === 0x2028 ||
			code === 0x2029 ||
			code === 0x202f ||
			code === 0x205f ||
			code === 0x3000 ||
			code === 0xfeff)
	);
}

/**
 * A data structure which contains a list of rules to test
 */
const ORDERED_MAPPING_TABLE: [string, TokenType][] = [
	// Control sequences
	["{%", TOKEN_TYPES.OpenStatement],
	["%}", TOKEN_TYPES.CloseStatement],
	["{{", TOKEN_TYPES.OpenExpression],
	["}}", TOKEN_TYPES.CloseExpression],
	// Single character tokens
	["(", TOKEN_TYPES.OpenParen],
	[")", TOKEN_TYPES.CloseParen],
	["{", TOKEN_TYPES.OpenCurlyBracket],
	["}", TOKEN_TYPES.CloseCurlyBracket],
	["[", TOKEN_TYPES.OpenSquareBracket],
	["]", TOKEN_TYPES.CloseSquareBracket],
	[",", TOKEN_TYPES.Comma],
	[".", TOKEN_TYPES.Dot],
	[":", TOKEN_TYPES.Colon],
	["|", TOKEN_TYPES.Pipe],
	// Comparison operators
	["<=", TOKEN_TYPES.ComparisonBinaryOperator],
	[">=", TOKEN_TYPES.ComparisonBinaryOperator],
	["==", TOKEN_TYPES.ComparisonBinaryOperator],
	["!=", TOKEN_TYPES.ComparisonBinaryOperator],
	["<", TOKEN_TYPES.ComparisonBinaryOperator],
	[">", TOKEN_TYPES.ComparisonBinaryOperator],
	// Arithmetic operators
	["+", TOKEN_TYPES.AdditiveBinaryOperator],
	["-", TOKEN_TYPES.AdditiveBinaryOperator],
	["~", TOKEN_TYPES.AdditiveBinaryOperator],
	["**", TOKEN_TYPES.ExponentiationBinaryOperator], // NOTE: must come before "*" so that "**" is matched first
	["*", TOKEN_TYPES.MultiplicativeBinaryOperator],
	["//", TOKEN_TYPES.MultiplicativeBinaryOperator], // NOTE: must come before "/" so that "//" is matched first
	["/", TOKEN_TYPES.MultiplicativeBinaryOperator],
	["%", TOKEN_TYPES.MultiplicativeBinaryOperator],
	// Assignment operator
	["=", TOKEN_TYPES.Equals],
];

/**
 * The rules of the mapping table (in the same order), indexed by the character code of their first character,
 * so that only the rules which can match at a position are tested.
 */
const RULES_BY_FIRST_CHAR_CODE: ([string, TokenType][] | undefined)[] = [];
for (const rule of ORDERED_MAPPING_TABLE) {
	(RULES_BY_FIRST_CHAR_CODE[rule[0].charCodeAt(0)] ??= []).push(rule);
}

const ESCAPE_CHARACTERS = new Map([
	["n", "\n"], // New line
	["t", "\t"], // Horizontal tab
	["r", "\r"], // Carriage return
	["b", "\b"], // Backspace
	["f", "\f"], // Form feed
	["v", "\v"], // Vertical tab
	["'", "'"], // Single quote
	['"', '"'], // Double quote
	["\\", "\\"], // Backslash
]);

export interface PreprocessOptions {
	trim_blocks?: boolean;
	lstrip_blocks?: boolean;
}

function preprocess(template: string, options: PreprocessOptions = {}): string {
	// According to https://jinja.palletsprojects.com/en/3.0.x/templates/#whitespace-control

	// In the default configuration:
	//  - a single trailing newline is stripped if present
	//  - other whitespace (spaces, tabs, newlines etc.) is returned unchanged
	if (template.endsWith("\n")) {
		template = template.slice(0, -1);
	}

	if (options.lstrip_blocks) {
		// The lstrip_blocks option can also be set to strip tabs and spaces from the
		// beginning of a line to the start of a block. (Nothing will be stripped if
		// there are other characters before the start of the block.)
		template = template.replace(/^[ \t]*({[#%-])/gm, "$1");
	}

	if (options.trim_blocks) {
		// If an application configures Jinja to trim_blocks, the first newline after
		// a template tag is removed automatically (like in PHP).
		template = template.replace(/([#%-]})\n/g, "$1");
	}

	// Handle the custom transformers-specific `generation` tag.
	// See https://github.com/huggingface/transformers/pull/30650 for more information.
	// Also honors `{%-` / `-%}` whitespace-stripping modifiers by trimming
	// surrounding whitespace before removing the tag.
	let result = "";
	let lastIndex = 0;
	// Start at a literal delimiter so unmatched whitespace is never scanned repeatedly.
	for (const match of template.matchAll(/{%(-?)\s*(?:end)?generation\s*(-?)%}(\s*)/gs)) {
		const [fullMatch, lstrip, rstrip, after] = match;
		let endIndex = match.index;
		// Preserve whitespace already consumed by the preceding match.
		while (lstrip && endIndex > lastIndex && isWhitespace(template.charCodeAt(endIndex - 1))) {
			--endIndex;
		}
		result += template.slice(lastIndex, endIndex) + (rstrip ? "" : after);
		lastIndex = match.index + fullMatch.length;
	}
	return result + template.slice(lastIndex);
}

/**
 * Generate a list of tokens from a source string.
 */
export function tokenize(source: string, options: PreprocessOptions = {}): Token[] {
	const tokens: Token[] = [];
	const src: string = preprocess(source, options);
	const length = src.length;

	let cursorPosition = 0;
	let curlyBracketDepth = 0;
	const names = new Map<string, string>();

	/**
	 * Consume characters while the predicate holds. Throws if the input ends while it still holds.
	 */
	const consumeWhile = (predicate: (code: number) => boolean): string => {
		const start = cursorPosition;
		while (predicate(src.charCodeAt(cursorPosition))) {
			if (++cursorPosition >= length) {
				throw new SyntaxError("Unexpected end of input");
			}
		}
		return src.slice(start, cursorPosition);
	};

	/**
	 * Consume the contents of a string literal (up to, but excluding, the closing quote), resolving escape sequences.
	 */
	const consumeString = (quote: string): string => {
		let str = "";
		let start = cursorPosition; // Start of the pending run of unescaped characters
		while (true) {
			if (cursorPosition >= length) {
				throw new SyntaxError("Unexpected end of input");
			}
			const char = src[cursorPosition];
			if (char === quote) {
				break;
			}
			++cursorPosition;
			if (char !== "\\") {
				continue;
			}

			// Check for escaped characters
			str += src.slice(start, cursorPosition - 1);
			// Check for end of input
			if (cursorPosition >= length) {
				throw new SyntaxError("Unexpected end of input");
			}

			// Add the escaped character
			const escaped = src[cursorPosition++];
			if (escaped === "x" || escaped === "u") {
				const hexLength = escaped === "x" ? 2 : 4;
				const hex = src.slice(cursorPosition, cursorPosition + hexLength);
				if (hex.length !== hexLength || /[^0-9a-f]/i.test(hex)) {
					throw new SyntaxError(`Invalid hexadecimal escape sequence: \\${escaped}${hex}`);
				}
				str += String.fromCharCode(parseInt(hex, 16));
				cursorPosition += hexLength;
			} else {
				const unescaped = ESCAPE_CHARACTERS.get(escaped);
				if (unescaped === undefined) {
					throw new SyntaxError(`Unexpected escaped character: ${escaped}`);
				}
				str += unescaped;
			}
			start = cursorPosition;
		}
		return str + src.slice(start, cursorPosition);
	};

	const stripTrailingWhitespace = () => {
		const lastToken = tokens.at(-1);
		if (lastToken && lastToken.type === TOKEN_TYPES.Text) {
			lastToken.value = lastToken.value.trimEnd();
			if (lastToken.value === "") {
				tokens.pop(); // Remove empty text token
			}
		}
	};

	const skipLeadingWhitespace = () => {
		while (cursorPosition < length && isWhitespace(src.charCodeAt(cursorPosition))) {
			++cursorPosition;
		}
	};

	// Build each token until end of input
	main: while (cursorPosition < length) {
		// NOTE: Every branch below that changes the list of tokens continues the loop,
		// so this remains the type of the last token throughout the iteration.
		const lastTokenType = tokens.at(-1)?.type;

		// First, consume all text that is outside of a Jinja statement or expression
		if (
			lastTokenType === undefined ||
			lastTokenType === TOKEN_TYPES.CloseStatement ||
			lastTokenType === TOKEN_TYPES.CloseExpression ||
			lastTokenType === TOKEN_TYPES.Comment
		) {
			// Keep going until we hit the next Jinja statement, expression or comment
			let end = cursorPosition;
			while (true) {
				end = src.indexOf("{", end);
				if (end === -1) {
					end = length;
					break;
				}
				const next = src[end + 1];
				if (next === "%" || next === "{" || next === "#") {
					break;
				}
				++end;
			}

			// There is some text to add
			if (end > cursorPosition) {
				tokens.push(new Token(src.slice(cursorPosition, end), TOKEN_TYPES.Text));
				cursorPosition = end;
				continue;
			}
		}

		if (src[cursorPosition] === "{") {
			const nextChar = src[cursorPosition + 1];

			// Possibly consume a comment
			if (nextChar === "#") {
				cursorPosition += 2; // Skip the opening {#

				// Check for leading hyphen for whitespace control {#-
				const stripBefore = src[cursorPosition] === "-";
				if (stripBefore) {
					++cursorPosition; // Skip the hyphen
				}

				const end = src.indexOf("#}", cursorPosition);
				if (end === -1) {
					throw new SyntaxError("Missing end of comment tag");
				}
				let comment = src.slice(cursorPosition, end);

				// Check for trailing hyphen for whitespace control -#}
				const stripAfter = comment.endsWith("-");
				if (stripAfter) {
					comment = comment.slice(0, -1); // Remove the trailing hyphen
				}

				// Apply whitespace stripping for leading hyphen
				if (stripBefore) {
					stripTrailingWhitespace();
				}

				tokens.push(new Token(comment, TOKEN_TYPES.Comment));
				cursorPosition = end + 2; // Skip the closing #}

				// Apply whitespace stripping for trailing hyphen
				if (stripAfter) {
					skipLeadingWhitespace();
				}

				continue;
			}

			if (src[cursorPosition + 2] === "-") {
				// Check for opening statement with whitespace control {%-
				if (nextChar === "%") {
					stripTrailingWhitespace();
					tokens.push(new Token("{%", TOKEN_TYPES.OpenStatement));
					cursorPosition += 3; // Skip {%-
					continue;
				}

				// Check for opening expression with whitespace control {{-
				if (nextChar === "{") {
					stripTrailingWhitespace();
					tokens.push(new Token("{{", TOKEN_TYPES.OpenExpression));
					curlyBracketDepth = 0;
					cursorPosition += 3; // Skip {{-
					continue;
				}
			}
		}

		// Consume (and ignore) all whitespace inside Jinja statements or expressions
		consumeWhile(isWhitespace);

		const char = src[cursorPosition];

		if (char === "-" && src[cursorPosition + 2] === "}") {
			const nextChar = src[cursorPosition + 1];

			// Check for closing statement with whitespace control -%}
			if (nextChar === "%") {
				tokens.push(new Token("%}", TOKEN_TYPES.CloseStatement));
				cursorPosition += 3; // Skip -%}
				skipLeadingWhitespace();
				continue;
			}

			// Check for closing expression with whitespace control -}}
			if (nextChar === "}") {
				tokens.push(new Token("}}", TOKEN_TYPES.CloseExpression));
				cursorPosition += 3; // Skip -}}
				skipLeadingWhitespace();
				continue;
			}
		}

		// Check for unary operators
		if (char === "-" || char === "+") {
			if (lastTokenType === TOKEN_TYPES.Text || lastTokenType === undefined) {
				throw new SyntaxError(`Unexpected character: ${char}`);
			}
			switch (lastTokenType) {
				case TOKEN_TYPES.Identifier:
				case TOKEN_TYPES.NumericLiteral:
				case TOKEN_TYPES.StringLiteral:
				case TOKEN_TYPES.CloseParen:
				case TOKEN_TYPES.CloseSquareBracket:
					// Part of a binary operator
					// a - 1, 1 - 1, true - 1, "apple" - 1, (1) - 1, a[1] - 1
					// Continue parsing normally
					break;

				default: {
					// Is part of a unary operator
					// (-1), [-1], (1 + -1), not -1, -apple
					++cursorPosition; // consume the unary operator

					// Check for numbers following the unary operator
					let num = consumeWhile(isInteger);
					if (num.length > 0 && src[cursorPosition] === "." && isInteger(src.charCodeAt(cursorPosition + 1))) {
						++cursorPosition; // consume '.'
						const frac = consumeWhile(isInteger);
						num = `${num}.${frac}`;
					}
					tokens.push(
						new Token(`${char}${num}`, num.length > 0 ? TOKEN_TYPES.NumericLiteral : TOKEN_TYPES.UnaryOperator),
					);
					continue;
				}
			}
		}

		// Try to match one of the tokens in the mapping table
		const code = src.charCodeAt(cursorPosition);
		const rules = RULES_BY_FIRST_CHAR_CODE[code];
		if (rules !== undefined) {
			for (const [seq, type] of rules) {
				// inside an object literal, don't treat "}}" as expression-end
				if (seq === "}}" && curlyBracketDepth > 0) {
					continue;
				}
				if (src.startsWith(seq, cursorPosition)) {
					tokens.push(new Token(seq, type));

					// possibly adjust the curly bracket depth
					if (type === TOKEN_TYPES.OpenExpression) {
						curlyBracketDepth = 0;
					} else if (type === TOKEN_TYPES.OpenCurlyBracket) {
						++curlyBracketDepth;
					} else if (type === TOKEN_TYPES.CloseCurlyBracket) {
						--curlyBracketDepth;
					}
					cursorPosition += seq.length;
					continue main;
				}
			}
		}

		if (char === "'" || char === '"') {
			++cursorPosition; // Skip the opening quote
			const str = consumeString(char);
			tokens.push(new Token(str, TOKEN_TYPES.StringLiteral));
			++cursorPosition; // Skip the closing quote
			continue;
		}

		if (isInteger(code)) {
			// Consume integer part
			let num = consumeWhile(isInteger);
			// Possibly, consume fractional part
			if (
				lastTokenType !== TOKEN_TYPES.Dot &&
				src[cursorPosition] === "." &&
				isInteger(src.charCodeAt(cursorPosition + 1))
			) {
				++cursorPosition; // consume '.'
				const frac = consumeWhile(isInteger);
				num = `${num}.${frac}`;
			}
			tokens.push(new Token(num, TOKEN_TYPES.NumericLiteral));
			continue;
		}
		if (isWord(code)) {
			// consume any word characters and always classify as Identifier
			let word = consumeWhile(isWord);

			// Use the same string for every occurrence of a name, since names are compared
			// (e.g., as keys of the variables of a scope) many times when rendering.
			const name = names.get(word);
			if (name === undefined) {
				names.set(word, word);
			} else {
				word = name;
			}
			tokens.push(new Token(word, TOKEN_TYPES.Identifier));
			continue;
		}

		throw new SyntaxError(`Unexpected character: ${char}`);
	}

	return tokens;
}
