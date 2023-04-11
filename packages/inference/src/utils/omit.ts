import { pick } from "./pick";
import { typedInclude } from "./typed-include";

/**
 * Return copy of object, omitting blocklisted array of props
 */
export function omit<T, K extends keyof T>(o: T, props: K[] | K): Pick<T, Exclude<keyof T, K>> {
	if (!o) {
		return o;
	}
	const propsArr = Array.isArray(props) ? props : [props];
	const letsKeep = (Object.keys(o) as (keyof T)[]).filter((prop) => !typedInclude(propsArr, prop));
	return pick(o, letsKeep);
}
