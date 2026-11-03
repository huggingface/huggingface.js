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
});
