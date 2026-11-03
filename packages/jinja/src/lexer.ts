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

function isWord(char: string): boolean {
	return /\w/.test(char);
}

function isInteger(char: string): boolean {
	return /[0-9]/.test(char);
}

function isWhitespace(char: string): boolean {
	return /\s/.test(char);
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

	// The generation-tag pattern cannot match without this literal substring.
	if (typeof template === "string" && template.indexOf("generation") === -1) {
		return template;
	}

	// Handle the custom transformers-specific `generation` tag.
	// See https://github.com/huggingface/transformers/pull/30650 for more information.
	// Also honors `{%-` / `-%}` whitespace-stripping modifiers by trimming
	// surrounding whitespace before removing the tag.
	return template.replace(
		/(\s*){%(-?)\s*(?:end)?generation\s*(-?)%}(\s*)/gs,
		(_, before, lstrip, rstrip, after) => (lstrip ? "" : before) + (rstrip ? "" : after),
	);
}

/**
 * Generate a list of tokens from a source string.
 */
export function tokenize(source: string, options: PreprocessOptions = {}): Token[] {
	const tokens: Token[] = [];
	const src: string = preprocess(source, options);

	let cursorPosition = 0;
	let curlyBracketDepth = 0;

	const consumeWhile = (predicate: (char: string) => boolean): string => {
		let str = "";
		while (predicate(src[cursorPosition])) {
			// Check for escaped characters
			if (src[cursorPosition] === "\\") {
				// Consume the backslash
				++cursorPosition;
				// Check for end of input
				if (cursorPosition >= src.length) {
					throw new SyntaxError("Unexpected end of input");
				}

				// Add the escaped character
				const escaped = src[cursorPosition++];
				if (escaped === "x" || escaped === "u") {
					const length = escaped === "x" ? 2 : 4;
					const hex = src.slice(cursorPosition, cursorPosition + length);
					if (hex.length !== length || /[^0-9a-f]/i.test(hex)) {
						throw new SyntaxError(`Invalid hexadecimal escape sequence: \\${escaped}${hex}`);
					}
					str += String.fromCharCode(parseInt(hex, 16));
					cursorPosition += length;
					continue;
				}

				const unescaped = ESCAPE_CHARACTERS.get(escaped);
				if (unescaped === undefined) {
					throw new SyntaxError(`Unexpected escaped character: ${escaped}`);
				}
				str += unescaped;
				continue;
			}

			str += src[cursorPosition++];
			if (cursorPosition >= src.length) {
				throw new SyntaxError("Unexpected end of input");
			}
		}
		return str;
	};

	const consumeDigits = (): string => {
		const start = cursorPosition;
		while (cursorPosition < src.length) {
			const code = src.charCodeAt(cursorPosition);
			if (code < 48 || code > 57) {
				break;
			}
			if (++cursorPosition >= src.length) {
				throw new SyntaxError("Unexpected end of input");
			}
		}
		return src.slice(start, cursorPosition);
	};

	const consumeWord = (): string => {
		const start = cursorPosition;
		while (cursorPosition < src.length) {
			const code = src.charCodeAt(cursorPosition);
			if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || code === 95 || (code >= 97 && code <= 122))) {
				break;
			}
			if (++cursorPosition >= src.length) {
				throw new SyntaxError("Unexpected end of input");
			}
		}
		return src.slice(start, cursorPosition);
	};

	const whitespaceAtCursor = (): boolean => {
		const code = src.charCodeAt(cursorPosition);
		// Keep the full ECMAScript whitespace class outside the ASCII fast path.
		return code === 32 || (code >= 9 && code <= 13) || (code > 127 && isWhitespace(src[cursorPosition]));
	};

	const consumeWhitespace = (): void => {
		while (whitespaceAtCursor()) {
			if (++cursorPosition >= src.length) {
				throw new SyntaxError("Unexpected end of input");
			}
		}
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
		while (cursorPosition < src.length && whitespaceAtCursor()) {
			++cursorPosition;
		}
	};

	// Build each token until end of input
	while (cursorPosition < src.length) {
		// First, consume all text that is outside of a Jinja statement or expression
		const lastTokenType = tokens.at(-1)?.type;
		if (
			lastTokenType === undefined ||
			lastTokenType === TOKEN_TYPES.CloseStatement ||
			lastTokenType === TOKEN_TYPES.CloseExpression ||
			lastTokenType === TOKEN_TYPES.Comment
		) {
			const textStart = cursorPosition;
			while (
				cursorPosition < src.length &&
				// Keep going until we hit the next Jinja statement or expression
				!(
					src[cursorPosition] === "{" &&
					(src[cursorPosition + 1] === "%" || src[cursorPosition + 1] === "{" || src[cursorPosition + 1] === "#")
				)
			) {
				++cursorPosition;
			}

			const text = src.slice(textStart, cursorPosition);
			// There is some text to add
			if (text.length > 0) {
				tokens.push(new Token(text, TOKEN_TYPES.Text));
				continue;
			}
		}

		// Possibly consume a comment
		if (src[cursorPosition] === "{" && src[cursorPosition + 1] === "#") {
			cursorPosition += 2; // Skip the opening {#

			// Check for leading hyphen for whitespace control {#-
			const stripBefore = src[cursorPosition] === "-";
			if (stripBefore) {
				++cursorPosition; // Skip the hyphen
			}

			const commentStart = cursorPosition;
			while (src[cursorPosition] !== "#" || src[cursorPosition + 1] !== "}") {
				// Check for end of input
				if (cursorPosition + 2 >= src.length) {
					throw new SyntaxError("Missing end of comment tag");
				}
				++cursorPosition;
			}

			let comment = src.slice(commentStart, cursorPosition);

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
			cursorPosition += 2; // Skip the closing #}

			// Apply whitespace stripping for trailing hyphen
			if (stripAfter) {
				skipLeadingWhitespace();
			}

			continue;
		}

		// Check for opening statement with whitespace control {%-
		if (
			src.charCodeAt(cursorPosition) === 123 &&
			src.charCodeAt(cursorPosition + 1) === 37 &&
			src.charCodeAt(cursorPosition + 2) === 45
		) {
			stripTrailingWhitespace();
			tokens.push(new Token("{%", TOKEN_TYPES.OpenStatement));
			cursorPosition += 3; // Skip {%-
			continue;
		}

		// Check for opening expression with whitespace control {{-
		if (
			src.charCodeAt(cursorPosition) === 123 &&
			src.charCodeAt(cursorPosition + 1) === 123 &&
			src.charCodeAt(cursorPosition + 2) === 45
		) {
			stripTrailingWhitespace();
			tokens.push(new Token("{{", TOKEN_TYPES.OpenExpression));
			curlyBracketDepth = 0;
			cursorPosition += 3; // Skip {{-
			continue;
		}

		// Consume (and ignore) all whitespace inside Jinja statements or expressions
		consumeWhitespace();

		// Check for closing statement with whitespace control -%}
		if (
			src.charCodeAt(cursorPosition) === 45 &&
			src.charCodeAt(cursorPosition + 1) === 37 &&
			src.charCodeAt(cursorPosition + 2) === 125
		) {
			tokens.push(new Token("%}", TOKEN_TYPES.CloseStatement));
			cursorPosition += 3; // Skip -%}
			skipLeadingWhitespace();
			continue;
		}

		// Check for closing expression with whitespace control -}}
		if (
			src.charCodeAt(cursorPosition) === 45 &&
			src.charCodeAt(cursorPosition + 1) === 125 &&
			src.charCodeAt(cursorPosition + 2) === 125
		) {
			tokens.push(new Token("}}", TOKEN_TYPES.CloseExpression));
			cursorPosition += 3; // Skip -}}
			skipLeadingWhitespace();
			continue;
		}

		// Handle multi-character tokens
		const char = src[cursorPosition];

		// Check for unary operators
		if (char === "-" || char === "+") {
			const lastTokenType = tokens.at(-1)?.type;
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
					let num = consumeDigits();
					if (num.length > 0 && src[cursorPosition] === "." && isInteger(src[cursorPosition + 1])) {
						++cursorPosition; // consume '.'
						const frac = consumeDigits();
						num = `${num}.${frac}`;
					}
					tokens.push(
						new Token(`${char}${num}`, num.length > 0 ? TOKEN_TYPES.NumericLiteral : TOKEN_TYPES.UnaryOperator),
					);
					continue;
				}
			}
		}

		// Dispatch punctuation directly, checking longer tokens before their prefixes.
		let tokenValue = char;
		let tokenType: TokenType | undefined;
		const code = src.charCodeAt(cursorPosition);
		const nextCode = src.charCodeAt(cursorPosition + 1);
		switch (code) {
			case 123: // {
				if (nextCode === 37) {
					tokenValue = "{%";
					tokenType = TOKEN_TYPES.OpenStatement;
				} else if (nextCode === 123) {
					tokenValue = "{{";
					tokenType = TOKEN_TYPES.OpenExpression;
				} else {
					tokenType = TOKEN_TYPES.OpenCurlyBracket;
				}
				break;
			case 125: // }
				// Inside an object literal, don't treat "}}" as expression-end.
				if (nextCode === 125 && curlyBracketDepth <= 0) {
					tokenValue = "}}";
					tokenType = TOKEN_TYPES.CloseExpression;
				} else {
					tokenType = TOKEN_TYPES.CloseCurlyBracket;
				}
				break;
			case 37: // %
				if (nextCode === 125) {
					tokenValue = "%}";
					tokenType = TOKEN_TYPES.CloseStatement;
				} else {
					tokenType = TOKEN_TYPES.MultiplicativeBinaryOperator;
				}
				break;
			case 40: // (
				tokenType = TOKEN_TYPES.OpenParen;
				break;
			case 41: // )
				tokenType = TOKEN_TYPES.CloseParen;
				break;
			case 91: // [
				tokenType = TOKEN_TYPES.OpenSquareBracket;
				break;
			case 93: // ]
				tokenType = TOKEN_TYPES.CloseSquareBracket;
				break;
			case 44: // ,
				tokenType = TOKEN_TYPES.Comma;
				break;
			case 46: // .
				tokenType = TOKEN_TYPES.Dot;
				break;
			case 58: // :
				tokenType = TOKEN_TYPES.Colon;
				break;
			case 124: // |
				tokenType = TOKEN_TYPES.Pipe;
				break;
			case 60: // <
				tokenValue = nextCode === 61 ? "<=" : "<";
				tokenType = TOKEN_TYPES.ComparisonBinaryOperator;
				break;
			case 62: // >
				tokenValue = nextCode === 61 ? ">=" : ">";
				tokenType = TOKEN_TYPES.ComparisonBinaryOperator;
				break;
			case 61: // =
				tokenValue = nextCode === 61 ? "==" : "=";
				tokenType = nextCode === 61 ? TOKEN_TYPES.ComparisonBinaryOperator : TOKEN_TYPES.Equals;
				break;
			case 33: // !
				if (nextCode === 61) {
					tokenValue = "!=";
					tokenType = TOKEN_TYPES.ComparisonBinaryOperator;
				}
				break;
			case 43: // +
			case 45: // -
			case 126: // ~
				tokenType = TOKEN_TYPES.AdditiveBinaryOperator;
				break;
			case 42: // *
				tokenValue = nextCode === 42 ? "**" : "*";
				tokenType =
					nextCode === 42 ? TOKEN_TYPES.ExponentiationBinaryOperator : TOKEN_TYPES.MultiplicativeBinaryOperator;
				break;
			case 47: // /
				tokenValue = nextCode === 47 ? "//" : "/";
				tokenType = TOKEN_TYPES.MultiplicativeBinaryOperator;
				break;
		}
		if (tokenType !== undefined) {
			tokens.push(new Token(tokenValue, tokenType));

			if (tokenType === TOKEN_TYPES.OpenExpression) {
				curlyBracketDepth = 0;
			} else if (tokenType === TOKEN_TYPES.OpenCurlyBracket) {
				++curlyBracketDepth;
			} else if (tokenType === TOKEN_TYPES.CloseCurlyBracket) {
				--curlyBracketDepth;
			}
			cursorPosition += tokenValue.length;
			continue;
		}

		if (char === "'" || char === '"') {
			++cursorPosition; // Skip the opening quote
			const str = consumeWhile((c) => c !== char);
			tokens.push(new Token(str, TOKEN_TYPES.StringLiteral));
			++cursorPosition; // Skip the closing quote
			continue;
		}

		if (isInteger(char)) {
			// Consume integer part
			let num = consumeDigits();
			// Possibly, consume fractional part
			if (
				tokens.at(-1)?.type !== TOKEN_TYPES.Dot &&
				src[cursorPosition] === "." &&
				isInteger(src[cursorPosition + 1])
			) {
				++cursorPosition; // consume '.'
				const frac = consumeDigits();
				num = `${num}.${frac}`;
			}
			tokens.push(new Token(num, TOKEN_TYPES.NumericLiteral));
			continue;
		}
		if (isWord(char)) {
			// consume any word characters and always classify as Identifier
			const word = consumeWord();
			tokens.push(new Token(word, TOKEN_TYPES.Identifier));
			continue;
		}

		throw new SyntaxError(`Unexpected character: ${char}`);
	}

	return tokens;
}
