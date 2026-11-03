import { describe, expect, it } from "vitest";

import { Token, TOKEN_TYPES, tokenize } from "../src/lexer";

describe("Lexer compatibility", () => {
	it("preserves literal code units and backslashes around comments", () => {
		const before = "text {\0🤗\\x41";
		const after = "\\n} tail";
		expect(tokenize(`${before}{# note #}${after}`)).toEqual([
			new Token(before, TOKEN_TYPES.Text),
			new Token(" note ", TOKEN_TYPES.Comment),
			new Token(after, TOKEN_TYPES.Text),
		]);
	});

	it("retains empty comment tokens between text spans", () => {
		expect(tokenize("a{##}b")).toEqual([
			new Token("a", TOKEN_TYPES.Text),
			new Token("", TOKEN_TYPES.Comment),
			new Token("b", TOKEN_TYPES.Text),
		]);
	});

	it("distinguishes nested dictionary closes from an expression delimiter", () => {
		const tokens = tokenize("{{{'a':{'b':1}}}}");
		expect(tokens.slice(-3)).toEqual([
			new Token("}", TOKEN_TYPES.CloseCurlyBracket),
			new Token("}", TOKEN_TYPES.CloseCurlyBracket),
			new Token("}}", TOKEN_TYPES.CloseExpression),
		]);
	});

	it("preserves trim-close precedence inside an unmatched dictionary", () => {
		expect(tokenize("{{ {'a': 1 -}}").at(-1)).toEqual(new Token("}}", TOKEN_TYPES.CloseExpression));
	});

	it("recognizes an expression close after an unmatched dictionary close", () => {
		expect(tokenize("{{ } }}").slice(-2)).toEqual([
			new Token("}", TOKEN_TYPES.CloseCurlyBracket),
			new Token("}}", TOKEN_TYPES.CloseExpression),
		]);
	});

	it.each([0x00a0, 0x2028, 0xfeff])("accepts ECMAScript whitespace code point %s", (code) => {
		const space = String.fromCharCode(code);
		expect(tokenize(`${space}{{-${space}x${space}-}}${space}tail`)).toEqual([
			new Token("{{", TOKEN_TYPES.OpenExpression),
			new Token("x", TOKEN_TYPES.Identifier),
			new Token("}}", TOKEN_TYPES.CloseExpression),
			new Token("tail", TOKEN_TYPES.Text),
		]);
	});

	it.each([0x0085, 0x180e, 0x200b])("rejects non-whitespace code point %s in expressions", (code) => {
		const char = String.fromCharCode(code);
		expect(() => tokenize(`{{${char}x }}`)).toThrowError(new SyntaxError(`Unexpected character: ${char}`));
	});

	it.each(["{{ 1", "{{ \t", "{{ word"])("preserves the end-of-input error for %j", (source) => {
		expect(() => tokenize(source)).toThrowError(new SyntaxError("Unexpected end of input"));
	});

	it("allows a unary sign at EOF when no digits were consumed", () => {
		expect(tokenize("{{ +")).toEqual([
			new Token("{{", TOKEN_TYPES.OpenExpression),
			new Token("+", TOKEN_TYPES.UnaryOperator),
		]);
	});
});
