import { describe, expect, it } from "vitest";

import { Template } from "../src";
import { Token, TOKEN_TYPES, tokenize } from "../src/lexer";

describe("Literal text scanning", () => {
	it("preserves code units and boundaries around expressions, statements and comments", () => {
		const prefix = "long literal {text} \0\uD800🤗";
		const source = `${prefix}{{ value }}{# comment #}{% set x = 2 %}tail {`;
		expect(new Template(source).render({ value: 7 })).toBe(`${prefix}7tail {`);
	});

	it("retains the scalar path for string-like preprocessing results", () => {
		let reads = 0;
		const source = new Proxy(
			{},
			{
				get(_, key) {
					if (key === "length") {
						++reads;
						return 20;
					}
					return String(reads % 10);
				},
			},
		);
		const input = { endsWith: () => false, replace: () => source };
		expect(tokenize(input)).toEqual([new Token("23456789012345678901", TOKEN_TYPES.Text)]);
		expect(reads).toBe(23);
	});

	it("preserves out-of-bounds prototype reads at a trailing brace", () => {
		const source = "long literal text {";
		const key = String(source.length);
		const original = Object.getOwnPropertyDescriptor(String.prototype, key);
		let reads = 0;
		let tokens;
		try {
			Object.defineProperty(String.prototype, key, {
				configurable: true,
				get() {
					++reads;
					return "x";
				},
			});
			tokens = tokenize(source);
		} finally {
			if (original) {
				Object.defineProperty(String.prototype, key, original);
			} else {
				delete String.prototype[key];
			}
		}
		expect(tokens).toEqual([new Token(source, TOKEN_TYPES.Text)]);
		expect(reads).toBe(3);
	});

	it("preserves overridden slice behavior in text and expressions", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "slice");
		let output, error;
		try {
			Object.defineProperty(String.prototype, "slice", { ...original, value: () => "S" });
			output = new Template("long literal text").render();
			try {
				tokenize("{{123}}");
			} catch (caught) {
				error = caught;
			}
		} finally {
			Object.defineProperty(String.prototype, "slice", original);
		}
		expect(output).toBe("long literal text");
		expect(error).toEqual(new SyntaxError("Unexpected character: {"));
	});

	it("does not read slice while consuming literal text", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "slice");
		let output;
		try {
			Object.defineProperty(String.prototype, "slice", {
				configurable: true,
				get() {
					throw new Error("slice read");
				},
			});
			output = new Template("long literal text").render();
		} finally {
			Object.defineProperty(String.prototype, "slice", original);
		}
		expect(output).toBe("long literal text");
	});

	it("preserves numeric and identifier expressions when charCodeAt is overridden", () => {
		const original = Object.getOwnPropertyDescriptor(String.prototype, "charCodeAt");
		let output;
		try {
			Object.defineProperty(String.prototype, "charCodeAt", { ...original, value: () => 0 });
			output = new Template("{{123}}:{{value}}").render({ value: 7 });
		} finally {
			Object.defineProperty(String.prototype, "charCodeAt", original);
		}
		expect(output).toBe("123:7");
	});
});
