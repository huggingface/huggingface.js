import type { Entries } from "type-fest";

export function typedEntries<T extends { [s: string]: T[keyof T] } | ArrayLike<T[keyof T]>>(obj: T): Entries<T> {
	return Object.entries(obj) as Entries<T>;
}
