import { describe, expect, it } from "vitest";
import { z } from "./validateOutput";

describe("validateOutput", () => {
	it("validates simple types", () => {
		expect(z.string().parse("foo")).toBe("foo");
		expect(z.number().parse(42)).toBe(42);
		expect(z.blob().parse(new Blob())).toBeInstanceOf(Blob);
	});

	it("errors on simple types", () => {
		expect(() => z.string().parse(42)).toThrow(/Expected string/);
		expect(() => z.number().parse("foo")).toThrow(/Expected number/);
		expect(() => z.blob().parse(42)).toThrow(/Expected Blob/);
	});
	it("validates arrays", () => {
		expect(z.array(z.string()).parse(["foo"])).toEqual(["foo"]);
		expect(z.array(z.number()).parse([42])).toEqual([42]);
		expect(z.array(z.blob()).parse([new Blob()])).toEqual([new Blob()]);
	});
	it("errors on arrays", () => {
		expect(() => z.array(z.string()).parse([42])).toThrow(/Expected Array<string>/);
		expect(() => z.array(z.number()).parse(["foo"])).toThrow(/Expected Array<number>/);
		expect(() => z.array(z.blob()).parse([42])).toThrow(/Expected Array<Blob>/);
	});
	it("validates objects", () => {
		expect(z.object({ foo: z.string() }).parse({ foo: "foo" })).toEqual({ foo: "foo" });
		expect(z.object({ foo: z.number() }).parse({ foo: 42 })).toEqual({ foo: 42 });
		expect(z.object({ foo: z.blob() }).parse({ foo: new Blob() })).toEqual({ foo: new Blob() });
		expect(z.object({ foo: z.string(), bar: z.number() }).parse({ foo: "foo", bar: 42 })).toEqual({
			foo: "foo",
			bar: 42,
		});
	});
	it("errors on objects", () => {
		expect(() => z.object({ foo: z.string() }).parse({ foo: 42 })).toThrow(/Expected { foo: string }/);
		expect(() => z.object({ foo: z.number() }).parse({ foo: "foo" })).toThrow(/Expected { foo: number }/);
		expect(() => z.object({ foo: z.blob() }).parse({ foo: 42 })).toThrow(/Expected { foo: Blob }/);
		expect(() => z.object({ foo: z.string(), bar: z.number() }).parse({ foo: "foo", bar: "bar" })).toThrow(
			/Expected { foo: string, bar: number }/
		);
	});
	it("validates unions", () => {
		expect(z.or(z.string(), z.number()).parse("foo")).toBe("foo");
		expect(z.or(z.string(), z.number()).parse(42)).toBe(42);
	});
	it("errors on unions", () => {
		expect(() => z.or(z.string(), z.number()).parse(new Blob())).toThrow(/Expected string | number/);
	});
	it("validates a complex object", () => {
		expect(
			z
				.object({
					foo: z.string(),
					bar: z.array(z.number()),
					baz: z.object({ a: z.string(), b: z.number() }),
				})
				.parse({
					foo: "foo",
					bar: [42],
					baz: { a: "a", b: 42 },
				})
		).toEqual({
			foo: "foo",
			bar: [42],
			baz: { a: "a", b: 42 },
		});
	});
	it("errors on a complex object", () => {
		expect(() =>
			z
				.object({
					foo: z.string(),
					bar: z.array(z.number()),
					baz: z.object({ a: z.string(), b: z.number() }),
				})
				.parse({
					foo: "foo",
					bar: [42],
					baz: { a: "a", b: "b" },
				})
		).toThrow(/Expected { foo: string, bar: Array<number>, baz: { a: string, b: number } }/);
	});
});
