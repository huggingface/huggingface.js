export function typedIn<T extends object>(obj: T, maybeKey: PropertyKey): maybeKey is keyof T {
	return maybeKey in obj;
}
