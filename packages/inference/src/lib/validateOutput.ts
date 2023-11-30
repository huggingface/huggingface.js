/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Heavily inspired by zod
 *
 * Re-created to avoid extra dependencies
 */

import { InferenceOutputError } from "./InferenceOutputError";

export const z = {
	array<T extends { parse: (value: any) => any }>(
		items: T
	): { parse: (value: any) => ReturnType<T["parse"]>[]; toString: () => string } {
		return {
			parse: (value: unknown) => {
				if (!Array.isArray(value)) {
					throw new Error("Expected " + this.toString());
				}
				try {
					return value.map((val) => items.parse(val));
				} catch (err) {
					throw new Error("Expected " + this.toString(), { cause: err });
				}
			},
			toString(): string {
				return `Array<${items.toString()}>`;
			},
		};
	},
	first<T extends { parse: (value: any) => any }>(
		items: T
	): { parse: (value: any) => ReturnType<T["parse"]>; toString: () => string } {
		return {
			parse: (value: unknown) => {
				if (!Array.isArray(value) || value.length === 0) {
					throw new Error("Expected " + this.toString());
				}
				try {
					return items.parse(value[0]);
				} catch (err) {
					throw new Error("Expected " + this.toString(), { cause: err });
				}
			},
			toString(): string {
				return `[${items.toString()}]`;
			},
		};
	},
	or: <T extends { parse: (value: any) => any }[]>(
		...items: T
	): { parse: (value: any) => ReturnType<T[number]["parse"]>; toString(): string } => ({
		parse: (value: unknown): ReturnType<T[number]["parse"]> => {
			const errors: Error[] = [];
			for (const item of items) {
				try {
					return item.parse(value);
				} catch (err) {
					errors.push(err as Error);
				}
			}
			throw new Error("Expected " + items.map((item) => item.toString()).join(" | "), { cause: errors });
		},
		toString(): string {
			return items.map((item) => item.toString()).join(" | ");
		},
	}),
	object<T extends Record<string, { parse: (value: any) => any }>>(
		item: T
	): { parse: (value: any) => { [key in keyof T]: ReturnType<T[key]["parse"]> }; toString: () => string } {
		return {
			parse: (value: unknown) => {
				if (typeof value !== "object" || value === null || Array.isArray(value)) {
					throw new Error("Expected " + this.toString());
				}
				return Object.fromEntries(Object.entries(item).map(([key, val]) => [key, val.parse((value as any)[key])])) as {
					[key in keyof T]: ReturnType<T[key]["parse"]>;
				};
			},
			toString(): string {
				return `{${Object.entries(item)
					.map(([key, val]) => `${key}: ${val.toString()}`)
					.join(", ")}}`;
			},
		};
	},
	string(): { parse: (value: any) => string; toString: () => string } {
		return {
			parse: (value: unknown): string => {
				if (typeof value !== "string") {
					throw new Error("Expected " + this.toString());
				}
				return value;
			},
			toString(): string {
				return "string";
			},
		};
	},
	boolean(): { parse: (value: any) => boolean; toString: () => string } {
		return {
			parse: (value: unknown): boolean => {
				if (typeof value !== "boolean") {
					throw new Error("Expected " + this.toString());
				}
				return value;
			},
			toString(): string {
				return "boolean";
			},
		};
	},
	number(): { parse: (value: any) => number; toString: () => string } {
		return {
			parse: (value: unknown): number => {
				if (typeof value !== "number") {
					throw new Error("Expected " + this.toString());
				}
				return value;
			},
			toString(): string {
				return "number";
			},
		};
	},
	blob(): { parse: (value: any) => Blob; toString: () => string } {
		return {
			parse: (value: unknown): Blob => {
				if (!(value instanceof Blob)) {
					throw new Error("Expected " + this.toString());
				}
				return value;
			},
			toString(): string {
				return "Blob";
			},
		};
	},
	optional<T extends { parse: (value: any) => any }>(
		item: T
	): { parse: (value: any) => ReturnType<T["parse"]> | undefined; toString: () => string } {
		return {
			parse: (value: unknown): ReturnType<T["parse"]> | undefined => {
				if (value === undefined) {
					return undefined;
				}
				try {
					return item.parse(value);
				} catch (err) {
					throw new Error("Expected " + this.toString(), { cause: err });
				}
			},
			toString(): string {
				return `${item.toString()} | undefined`;
			},
		};
	},
};

export function validateOutput<T>(value: unknown, schema: { parse: (value: any) => T }): T {
	try {
		return schema.parse(value);
	} catch (err) {
		throw new InferenceOutputError(err);
	}
}
