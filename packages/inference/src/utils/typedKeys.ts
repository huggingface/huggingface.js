export function typedKeys<T extends object>(obj: T): (keyof T)[] {
	const keys = Object.keys(obj) as (keyof T)[];
	return keys;
}

