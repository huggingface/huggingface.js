/**
 * Return copy of object, only keeping whitelisted properties.
 */
export function pick<T, K extends keyof T>(o: T, props: K[] | ReadonlyArray<K>): Pick<T, K> {
	return Object.assign(
		{},
		...props.map((prop) => {
			if (o[prop] !== undefined) {
				return { [prop]: o[prop] };
			}
		})
	);
}

/**
 * Return copy of object, omitting blacklisted array of props
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
	o: T,
	props: K[] | K
): Pick<T, Exclude<keyof T, K>> {
	const propsArr = Array.isArray(props) ? props : [props];
	const letsKeep = (Object.keys(o) as (keyof T)[]).filter((prop) => !propsArr.includes(prop as unknown as K));
	return pick(o, letsKeep);
}
