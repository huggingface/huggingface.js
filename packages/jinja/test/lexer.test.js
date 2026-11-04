import { describe, expect, it } from "vitest";

import { Token, TOKEN_TYPES, tokenize } from "../src/lexer";
import { Template } from "../src";

describe("Lexer compatibility", () => {
	it("retains ordinary braces around every kind of template tag", () => {
		const source = "head {a} {{ value }}{b}{# note #}{c}{% set x = 1 %}{";
		expect(
			tokenize(source)
				.filter((token) => token.type === TOKEN_TYPES.Text)
				.map((token) => token.value),
		).toEqual(["head {a} ", "{b}", "{c}", "{"]);
		expect(new Template(source).render({ value: "X" })).toBe("head {a} X{b}{c}{");
	});

	it("preserves code units and a final literal opening brace", () => {
		const source = "\0🤗{\n{x}\u2028tail {";
		expect(tokenize(source)).toEqual([new Token(source, TOKEN_TYPES.Text)]);
	});

	it("does not introduce calls to a replaced brace-search method", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "indexOf");
		const originalCall = Object.getOwnPropertyDescriptor(original.value, "call");
		let braceSearches = 0;
		let tokens;
		Object.defineProperty(original.value, "call", {
			configurable: true,
			value: function () {
				++braceSearches;
				return -1;
			},
		});
		Object.defineProperty(String.prototype, "indexOf", {
			...original,
			value: function (...args) {
				if (args[0] === "{") {
					++braceSearches;
					return -1;
				}
				return Reflect.apply(original.value, this, args);
			},
		});
		try {
			tokens = tokenize("A{x}{{ value }}B{");
		} finally {
			Object.defineProperty(String.prototype, "indexOf", original);
			if (originalCall) {
				Object.defineProperty(original.value, "call", originalCall);
			} else {
				delete original.value.call;
			}
		}
		expect(braceSearches).toBe(0);
		expect(tokens.filter((token) => token.type === TOKEN_TYPES.Text).map((token) => token.value)).toEqual([
			"A{x}",
			"B{",
		]);
	});

	it("retains the character path for a string-like preprocessing result", () => {
		const text = Object("{x} tail {");
		const source = { endsWith: () => false, replace: () => text };
		expect(tokenize(source)).toEqual([new Token(text.valueOf(), TOKEN_TYPES.Text)]);
	});

	it("retains the replacement path for string-like inputs", () => {
		const source = { endsWith: () => false, replace: () => "text" };
		expect(tokenize(source)).toEqual([new Token("text", TOKEN_TYPES.Text)]);
	});

	it("applies ordinary whitespace preprocessing without generation tags", () => {
		expect(new Template("head\n  {% if true %}\nbody\n  {% endif %}\ntail\n").render()).toBe("head\nbody\ntail");
	});

	it("preserves generation-tag replacement inside quoted strings", () => {
		expect(new Template("{{ 'A{% generation %}B{% endgeneration %}C' }}").render()).toBe("ABC");
	});

	it("removes generation tags when indexOf is replaced after import", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "indexOf");
		try {
			Object.defineProperty(String.prototype, "indexOf", { ...original, value: () => -1 });
			expect(new Template("A{% generation %}B{% endgeneration %}C").render()).toBe("ABC");
		} finally {
			Object.defineProperty(String.prototype, "indexOf", original);
		}
	});

	it("does not read an overridden indexOf getter for the generation guard", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "indexOf");
		let reads = 0;
		try {
			Object.defineProperty(String.prototype, "indexOf", {
				configurable: true,
				get() {
					++reads;
					throw new Error("indexOf getter must not be read");
				},
			});
			expect(new Template("{{ 'A{% generation %}B{% endgeneration %}C' }}").render()).toBe("ABC");
			expect(new Template("ordinary { text }").render()).toBe("ordinary { text }");
			expect(reads).toBe(0);
		} finally {
			Object.defineProperty(String.prototype, "indexOf", original);
		}
	});

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

	it("preserves literal output when String.slice is replaced", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "slice");
		let output;
		try {
			Object.defineProperty(String.prototype, "slice", { ...original, value: () => "S" });
			output = new Template("A").render();
		} finally {
			Object.defineProperty(String.prototype, "slice", original);
		}
		expect(output).toBe("A");
	});

	it("does not read String.slice while consuming plain literal text", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "slice");
		let output, error;
		let reads = 0;
		try {
			Object.defineProperty(String.prototype, "slice", {
				configurable: true,
				get() {
					++reads;
					throw new Error("slice getter was read");
				},
			});
			try {
				output = new Template("A").render();
			} catch (caught) {
				error = caught;
			}
		} finally {
			Object.defineProperty(String.prototype, "slice", original);
		}
		expect(error).toBeUndefined();
		expect(output).toBe("A");
		expect(reads).toBe(0);
	});

	it("retains replaced String.slice behavior in expression recognition", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "slice");
		let error;
		try {
			Object.defineProperty(String.prototype, "slice", { ...original, value: () => "S" });
			try {
				tokenize("{{123}}");
			} catch (caught) {
				error = caught;
			}
		} finally {
			Object.defineProperty(String.prototype, "slice", original);
		}
		expect(error).toEqual(new SyntaxError("Unexpected character: {"));
	});

	it.each([
		["{{123}}", "123"],
		["{{value}}", "7"],
	])("preserves expression output for %s when String.charCodeAt is replaced", (source, expected) => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "charCodeAt");
		let output, error;
		try {
			Object.defineProperty(String.prototype, "charCodeAt", { ...original, value: () => 0 });
			try {
				output = new Template(source).render({ value: 7 });
			} catch (caught) {
				error = caught;
			}
		} finally {
			Object.defineProperty(String.prototype, "charCodeAt", original);
		}
		expect(error).toBeUndefined();
		expect(output).toBe(expected);
	});
});
