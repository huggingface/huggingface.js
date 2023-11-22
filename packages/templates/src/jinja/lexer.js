/**
 * Represents tokens that our language understands in parsing.
 */
export const TOKEN_TYPES = Object.freeze({
	Text: "Text", // The text between Jinja statements or expressions

	NumericLiteral: "NumericLiteral",
	BooleanLiteral: "BooleanLiteral",
	StringLiteral: "StringLiteral",
	Identifier: "Identifier",
	Equals: "Equals",
	OpenParen: "OpenParen",
	CloseParen: "CloseParen",
	OpenStatement: "OpenStatement", // {%
	CloseStatement: "CloseStatement", // %}
	OpenExpression: "OpenExpression", // {{
	CloseExpression: "CloseExpression", // }}
	OpenSquareBracket: "OpenSquareBracket", // [
	CloseSquareBracket: "CloseSquareBracket", // ]
	Comma: "Comma",
	Dot: "Dot",

	CallOperator: "CallOperator", // ()

	AdditiveBinaryOperator: "AdditiveBinaryOperator",
	MultiplicativeBinaryOperator: "MultiplicativeBinaryOperator",
	ComparisonBinaryOperator: "ComparisonBinaryOperator",
	UnaryOperator: "UnaryOperator", // not

	Set: "Set",
	If: "If",
	For: "For",
	In: "In",
	Else: "Else",
	EndIf: "EndIf",
	ElseIf: "ElseIf",
	EndFor: "EndFor",

	// Logical operators
	And: "And",
	Or: "Or",

	// TODO Add unary operators
});

/**
 * @typedef {keyof typeof TOKEN_TYPES} TokenType
 */

/**
 * Constant lookup for keywords and known identifiers + symbols.
 */
const KEYWORDS = Object.freeze({
	set: TOKEN_TYPES.Set,
	for: TOKEN_TYPES.For,
	in: TOKEN_TYPES.In,
	if: TOKEN_TYPES.If,
	else: TOKEN_TYPES.Else,
	endif: TOKEN_TYPES.EndIf,
	elif: TOKEN_TYPES.ElseIf,
	endfor: TOKEN_TYPES.EndFor,

	and: TOKEN_TYPES.And,
	or: TOKEN_TYPES.Or,
	not: TOKEN_TYPES.UnaryOperator,

	// Literals
	true: TOKEN_TYPES.BooleanLiteral,
	false: TOKEN_TYPES.BooleanLiteral,
});

/**
 * Represents a single token in the template.
 */
export class Token {
	/**
	 * Constructs a new Token.
	 * @param {string} value The raw value as seen inside the source code.
	 * @param {TokenType} type The type of token.
	 */
	constructor(value, type) {
		this.value = value;
		this.type = type;
	}
}

function isWord(char) {
	return /\w/.test(char);
}

function isInteger(char) {
	return /[0-9]/.test(char);
}

/**
 * A data structure which contains a list of rules to test
 */
const ORDERED_LOOKUP_TABLE = Object.freeze({
	// Control sequences
	"{%": TOKEN_TYPES.OpenStatement,
	"%}": TOKEN_TYPES.CloseStatement,
	"{{": TOKEN_TYPES.OpenExpression,
	"}}": TOKEN_TYPES.CloseExpression,

	// Single character tokens
	"(": TOKEN_TYPES.OpenParen,
	")": TOKEN_TYPES.CloseParen,
	"[": TOKEN_TYPES.OpenSquareBracket,
	"]": TOKEN_TYPES.CloseSquareBracket,
	",": TOKEN_TYPES.Comma,
	".": TOKEN_TYPES.Dot,

	// Comparison operators
	"<=": TOKEN_TYPES.ComparisonBinaryOperator,
	">=": TOKEN_TYPES.ComparisonBinaryOperator,
	"==": TOKEN_TYPES.ComparisonBinaryOperator,
	"!=": TOKEN_TYPES.ComparisonBinaryOperator,

	"<": TOKEN_TYPES.ComparisonBinaryOperator,
	">": TOKEN_TYPES.ComparisonBinaryOperator,

	// Arithmetic operators
	"+": TOKEN_TYPES.AdditiveBinaryOperator,
	"-": TOKEN_TYPES.AdditiveBinaryOperator,
	"*": TOKEN_TYPES.MultiplicativeBinaryOperator,
	"/": TOKEN_TYPES.MultiplicativeBinaryOperator,
	"%": TOKEN_TYPES.MultiplicativeBinaryOperator,

	// Assignment operator
	"=": TOKEN_TYPES.Equals,
});

/**
 * Generate a list of tokens from a source string.
 * @param {string} source
 * @returns {Token[]}
 */
export function tokenize(source) {
	/** @type {Token[]} */
	const tokens = [];
	const src = source;

	let cursorPosition = 0;

	/**
	 *
	 * @param {function (string): boolean} predicate
	 * @returns
	 */
	const consumeWhile = (predicate) => {
		let str = "";
		while (predicate(src[cursorPosition])) {
			str += src[cursorPosition++];
			if (cursorPosition >= src.length) throw new SyntaxError("Unexpected end of input");
		}
		return str;
	};

	// Build each token until end of input
	main: while (cursorPosition < src.length) {
		// First, consume all text that is outside of a Jinja statement or expression
		const lastTokenType = tokens.at(-1)?.type;
		if (
			lastTokenType === undefined ||
			lastTokenType === TOKEN_TYPES.CloseStatement ||
			lastTokenType === TOKEN_TYPES.CloseExpression
		) {
			let text = "";
			while (
				cursorPosition < src.length &&
				// Keep going until we hit the next Jinja statement or expression
				!(src[cursorPosition] === "{" && (src[cursorPosition + 1] === "%" || src[cursorPosition + 1] === "{"))
			) {
				// Consume text
				text += src[cursorPosition++];
			}

			// There is some text to add
			if (text.length > 0) {
				tokens.push(new Token(text, TOKEN_TYPES.Text));
				continue;
			}
		}

		// Consume (and ignore) all whitespace inside Jinja statements or expressions
		consumeWhile((char) => /\s/.test(char));

		for (const [char, token] of Object.entries(ORDERED_LOOKUP_TABLE)) {
			const slice = src.slice(cursorPosition, cursorPosition + char.length);
			if (slice === char) {
				tokens.push(new Token(char, token));
				cursorPosition += char.length;
				continue main;
			}
		}

		// Handle multi-character tokens
		let char = src[cursorPosition];

		if (char === "'") {
			++cursorPosition; // Skip the opening quote
			const str = consumeWhile((char) => char !== "'");
			tokens.push(new Token(str, TOKEN_TYPES.StringLiteral));
			++cursorPosition; // Skip the closing quote
			continue;
		}

		if (isInteger(char)) {
			const num = consumeWhile(isInteger);
			tokens.push(new Token(num, TOKEN_TYPES.NumericLiteral));
			continue;
		}

		if (isWord(char)) {
			let word = consumeWhile(isWord);

			// Check for special/reserved keywords
			const type = Object.hasOwn(KEYWORDS, word) ? KEYWORDS[word] : TOKEN_TYPES.Identifier;
			tokens.push(new Token(word, type));
			continue;
		}

		throw new SyntaxError(`Unexpected character: ${char}`);
	}
	return tokens;
}
