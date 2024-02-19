/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Heavily inspired by zod
 *
 * Re-created to avoid extra dependencies
 */

import { InferenceOutputError } from "./InferenceOutputError";

interface Parser<T = any> {
	parse: (value: any) => T;
	toString: () => string;
}

export type Infer<T extends Parser> = ReturnType<T["parse"]>;

export const z = {
	array<T extends Parser>(items: T): Parser<Infer<T>[]> {
		return {
			parse: (value: unknown) => {
				if (!Array.isArray(value)) {
					throw new Error("Expected " + z.array(items).toString());
				}
				try {
					return value.map((val) => items.parse(val));
				} catch (err) {
					throw new Error("Expected " + z.array(items).toString(), { cause: err });
				}
			},
			toString(): string {
				return `Array<${items.toString()}>`;
			},
		};
	},
	first<T extends Parser>(items: T): Parser<Infer<T>> {
		return {
			parse: (value: unknown) => {
				if (!Array.isArray(value) || value.length === 0) {
					throw new Error("Expected " + z.first(items).toString());
				}
				try {
					return items.parse(value[0]);
				} catch (err) {
					throw new Error("Expected " + z.first(items).toString(), { cause: err });
				}
			},
			toString(): string {
				return `[${items.toString()}]`;
			},
		};
	},
	or: <T extends Parser[]>(...items: T): Parser<Infer<T[number]>> => ({
		parse: (value: unknown): ReturnType<T[number]["parse"]> => {
			const errors: Error[] = [];
			for (const item of items) {
				try {
					return item.parse(value);
				} catch (err) {
					errors.push(err as Error);
				}
			}
			throw new Error("Expected " + z.or(...items).toString(), { cause: errors });
		},
		toString(): string {
			return items.map((item) => item.toString()).join(" | ");
		},
	}),
	object<T extends Record<string, Parser>>(item: T): Parser<{ [key in keyof T]: Infer<T[key]> }> {
		return {
			parse: (value: unknown) => {
				if (typeof value !== "object" || value === null || Array.isArray(value)) {
					throw new Error("Expected " + z.object(item).toString());
				}
				try {
					return Object.fromEntries(
						Object.entries(item).map(([key, val]) => [key, val.parse((value as any)[key])])
					) as {
						[key in keyof T]: Infer<T[key]>;
					};
				} catch (err) {
					throw new Error("Expected " + z.object(item).toString(), { cause: err });
				}
			},
			toString(): string {
				return `{ ${Object.entries(item)
					.map(([key, val]) => `${key}: ${val.toString()}`)
					.join(", ")} }`;
			},
		};
	},
	string(): Parser<string> {
		return {
			parse: (value: unknown): string => {
				if (typeof value !== "string") {
					throw new Error("Expected " + z.string().toString());
				}
				return value;
			},
			toString(): string {
				return "string";
			},
		};
	},
	number(): Parser<number> {
		return {
			parse: (value: unknown): number => {
				if (typeof value !== "number") {
					throw new Error("Expected " + z.number().toString());
				}
				return value;
			},
			toString(): string {
				return "number";
			},
		};
	},
	blob(): Parser<Blob> {
		return {
			parse: (value: unknown): Blob => {
				if (!(value instanceof Blob)) {
					throw new Error("Expected " + z.blob().toString());
				}
				return value;
			},
			toString(): string {
				return "Blob";
			},
		};
	},
	optional<T extends Parser>(item: T): Parser<Infer<T> | undefined> {
		return {
			parse: (value: unknown): ReturnType<T["parse"]> | undefined => {
				if (value === undefined) {
					return undefined;
				}
				try {
					return item.parse(value);
				} catch (err) {
					throw new Error("Expected " + z.optional(item).toString(), { cause: err });
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
