import type {
	StringLiteral,
	FloatLiteral,
	IntegerLiteral,
	ArrayLiteral,
	Program,
	If,
	For,
	SetStatement,
	MemberExpression,
	CallExpression,
	Identifier,
	BinaryExpression,
	FilterExpression,
	TestExpression,
	UnaryExpression,
	SliceExpression,
	KeywordArgumentExpression,
	ObjectLiteral,
	TupleLiteral,
	Macro,
	Parameter,
	Expression,
	SelectExpression,
	CallStatement,
	FilterStatement,
	Ternary,
	SpreadExpression,
	KeywordSpreadExpression,
} from "./ast";
import { Statement } from "./ast";
import { range, replace, slice, strftime_now, titleCase } from "./utils";

export type AnyRuntimeValue =
	| IntegerValue
	| FloatValue
	| StringValue
	| BooleanValue
	| ObjectValue
	| NamespaceValue
	| ArrayValue
	| FunctionValue
	| NullValue
	| UndefinedValue;

// Control-flow exceptions for loop break/continue
class BreakControl extends Error {}
class ContinueControl extends Error {}

const EMPTY_BUILTINS: ReadonlyMap<string, AnyRuntimeValue> = new Map();

/**
 * Abstract base class for all Runtime values.
 * Should not be instantiated directly.
 */
abstract class RuntimeValue<T> {
	// NOTE: These are assigned in the constructors instead of being initialized as class fields (which each
	// subclass would then redefine), since runtime values are created often and this is much faster.
	// The base constructor assigns both, so that their order is always `type`, `value` and so that
	// subclasses may define `value` as an accessor (see LoopValue).
	declare type: string;
	declare value: T;

	/**
	 * A collection of built-in functions for this type.
	 */
	get builtins(): ReadonlyMap<string, AnyRuntimeValue> {
		return EMPTY_BUILTINS;
	}

	/**
	 * Creates a new RuntimeValue.
	 */
	constructor(value: T = undefined as unknown as T) {
		this.type = "RuntimeValue";
		this.value = value;
	}

	/**
	 * Determines truthiness or falsiness of the runtime value.
	 * This function should be overridden by subclasses if it has custom truthiness criteria.
	 * @returns {BooleanValue} BooleanValue(true) if the value is truthy, BooleanValue(false) otherwise.
	 */
	__bool__(): BooleanValue {
		return new BooleanValue(!!this.value);
	}

	toString(): string {
		return String(this.value);
	}
}

/**
 * Represents an integer value at runtime.
 */
export class IntegerValue extends RuntimeValue<number> {
	constructor(value?: number) {
		super(value);
		this.type = "IntegerValue";
	}
}

/**
 * Represents a float value at runtime.
 */
export class FloatValue extends RuntimeValue<number> {
	constructor(value?: number) {
		super(value);
		this.type = "FloatValue";
	}

	override toString(): string {
		if (Object.is(this.value, -0)) {
			return "-0.0";
		}
		return this.value % 1 === 0 ? this.value.toFixed(1) : this.value.toString();
	}
}

/**
 * Represents a string value at runtime.
 */
export class StringValue extends RuntimeValue<string> {
	private _builtins?: Map<string, AnyRuntimeValue>;

	constructor(value?: string) {
		super(value);
		this.type = "StringValue";
	}

	override get builtins(): Map<string, AnyRuntimeValue> {
		return (this._builtins ??= new Map<string, AnyRuntimeValue>([
			[
				"upper",
				new FunctionValue(() => {
					return new StringValue(this.value.toUpperCase());
				}),
			],
			[
				"lower",
				new FunctionValue(() => {
					return new StringValue(this.value.toLowerCase());
				}),
			],
			[
				"strip",
				new FunctionValue(() => {
					return new StringValue(this.value.trim());
				}),
			],
			[
				"title",
				new FunctionValue(() => {
					return new StringValue(titleCase(this.value));
				}),
			],
			[
				"capitalize",
				new FunctionValue(() => {
					return new StringValue(this.value.charAt(0).toUpperCase() + this.value.slice(1));
				}),
			],
			["length", new IntegerValue(this.value.length)],
			[
				"rstrip",
				new FunctionValue(() => {
					return new StringValue(this.value.trimEnd());
				}),
			],
			[
				"lstrip",
				new FunctionValue(() => {
					return new StringValue(this.value.trimStart());
				}),
			],
			[
				"startswith",
				new FunctionValue((args) => {
					if (args.length === 0) {
						throw new Error("startswith() requires at least one argument");
					}
					const pattern = args[0];
					if (pattern instanceof StringValue) {
						return new BooleanValue(this.value.startsWith(pattern.value));
					} else if (pattern instanceof ArrayValue) {
						for (const item of pattern.value) {
							if (!(item instanceof StringValue)) {
								throw new Error("startswith() tuple elements must be strings");
							}
							if (this.value.startsWith(item.value)) {
								return new BooleanValue(true);
							}
						}
						return new BooleanValue(false);
					}
					throw new Error("startswith() argument must be a string or tuple of strings");
				}),
			],
			[
				"endswith",
				new FunctionValue((args) => {
					if (args.length === 0) {
						throw new Error("endswith() requires at least one argument");
					}
					const pattern = args[0];
					if (pattern instanceof StringValue) {
						return new BooleanValue(this.value.endsWith(pattern.value));
					} else if (pattern instanceof ArrayValue) {
						for (const item of pattern.value) {
							if (!(item instanceof StringValue)) {
								throw new Error("endswith() tuple elements must be strings");
							}
							if (this.value.endsWith(item.value)) {
								return new BooleanValue(true);
							}
						}
						return new BooleanValue(false);
					}
					throw new Error("endswith() argument must be a string or tuple of strings");
				}),
			],
			[
				"split",
				// follows Python's `str.split(sep=None, maxsplit=-1)` function behavior
				// https://docs.python.org/3.13/library/stdtypes.html#str.split
				new FunctionValue((args) => {
					const sep = args[0] ?? new NullValue();
					if (!(sep instanceof StringValue || sep instanceof NullValue)) {
						throw new Error("sep argument must be a string or null");
					}
					const maxsplit = args[1] ?? new IntegerValue(-1);
					if (!(maxsplit instanceof IntegerValue)) {
						throw new Error("maxsplit argument must be a number");
					}

					let result = [];
					if (sep instanceof NullValue) {
						// If sep is not specified or is None, runs of consecutive whitespace are regarded as a single separator, and the
						// result will contain no empty strings at the start or end if the string has leading or trailing whitespace.
						// Trailing whitespace may be present when maxsplit is specified and there aren't sufficient matches in the string.
						const text = this.value.trimStart();
						for (const { 0: match, index } of text.matchAll(/\S+/g)) {
							if (maxsplit.value >= 0 && result.length >= maxsplit.value && index !== undefined) {
								result.push(match + text.slice(index + match.length));
								break;
							}
							result.push(match);
						}
					} else {
						// If sep is specified, consecutive delimiters are not grouped together and are deemed to delimit empty strings.
						if (sep.value === "") {
							throw new Error("empty separator");
						}
						result = this.value.split(sep.value);
						if (maxsplit.value >= 0 && result.length > maxsplit.value) {
							// Follow Python's behavior: If maxsplit is given, at most maxsplit splits are done,
							// with any remaining text returned as the final element of the list.
							result.push(result.splice(maxsplit.value).join(sep.value));
						}
					}
					return new ArrayValue(result.map((part) => new StringValue(part)));
				}),
			],
			[
				"replace",
				new FunctionValue((args): StringValue => {
					if (args.length < 2) {
						throw new Error("replace() requires at least two arguments");
					}
					const oldValue = args[0];
					const newValue = args[1];
					if (!(oldValue instanceof StringValue && newValue instanceof StringValue)) {
						throw new Error("replace() arguments must be strings");
					}

					let count: AnyRuntimeValue | undefined;
					if (args.length > 2) {
						if (args[2].type === "KeywordArgumentsValue") {
							count = (args[2] as KeywordArgumentsValue).value.get("count") ?? new NullValue();
						} else {
							count = args[2];
						}
					} else {
						count = new NullValue();
					}
					if (!(count instanceof IntegerValue || count instanceof NullValue)) {
						throw new Error("replace() count argument must be a number or null");
					}
					return new StringValue(replace(this.value, oldValue.value, newValue.value, count.value));
				}),
			],
		]));
	}
}

/**
 * Represents a boolean value at runtime.
 */
export class BooleanValue extends RuntimeValue<boolean> {
	constructor(value?: boolean) {
		super(value);
		this.type = "BooleanValue";
	}
}

/**
 * Options for JSON serialization.
 */
interface ToJSONOptions {
	/** Optional indentation for pretty-printing */
	indent?: number | null;
	/** If true, escape non-ASCII characters. Default is false. */
	ensureAscii?: boolean;
	/** Custom separators: [itemSeparator, keySeparator]. Default is [", ", ": "] or [",", ": "] when indent is set. */
	separators?: [string, string] | null;
	/** If true, sort object keys alphabetically. Default is false. */
	sortKeys?: boolean;
}

/**
 * Regular expression to match non-ASCII characters (code points >= 0x7F).
 * Used when ensure_ascii is true to escape these characters to \uXXXX format in JSON output.
 */
const NON_ASCII_CHARS = /[\x7f-\uffff]/g;

/**
 * Converts a string to an ASCII-safe representation by escaping non-ASCII characters.
 * @param str The input string
 * @returns The ASCII-safe string
 */
function makeAsciiSafe(str: string): string {
	return str.replace(NON_ASCII_CHARS, (char: string) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0"));
}

/**
 * Converts a runtime value to its JSON string representation.
 * @param input The runtime value to convert
 * @param options JSON serialization options
 * @param depth Current recursion depth (used for indentation)
 * @param convertUndefinedToNull If true, undefined becomes "null" (JSON-safe). If false, undefined becomes "undefined".
 */
function toJSON(
	input: AnyRuntimeValue,
	options: ToJSONOptions = {},
	depth: number = 0,
	convertUndefinedToNull: boolean = true,
): string {
	const { indent = null, ensureAscii = false, separators = null, sortKeys = false } = options;

	// Determine the separators to use
	let itemSeparator: string;
	let keySeparator: string;
	if (separators) {
		[itemSeparator, keySeparator] = separators;
	} else if (indent) {
		// When indent is set and no custom separators, use compact item separator
		// but keep the standard key separator (matches Python json.dumps behavior)
		itemSeparator = ",";
		keySeparator = ": ";
	} else {
		// Default separators (matches Python json.dumps default)
		itemSeparator = ", ";
		keySeparator = ": ";
	}

	switch (input.type) {
		case "NullValue":
			return "null";
		case "UndefinedValue":
			return convertUndefinedToNull ? "null" : "undefined";
		case "IntegerValue":
		case "FloatValue":
		case "BooleanValue":
			return JSON.stringify(input.value);
		case "StringValue": {
			let result = JSON.stringify(input.value);
			if (ensureAscii) {
				result = makeAsciiSafe(result);
			}
			return result;
		}
		case "ArrayValue":
		case "NamespaceValue":
		case "ObjectValue": {
			const indentValue = indent ? " ".repeat(indent) : "";
			const basePadding = "\n" + indentValue.repeat(depth);
			const childrenPadding = basePadding + indentValue; // Depth + 1

			// Like Python's json.dumps, empty containers render as [] and {} even when indenting.
			if (input.type === "ArrayValue") {
				const core = (input as ArrayValue).value.map((x) => toJSON(x, options, depth + 1, convertUndefinedToNull));
				return indent && core.length > 0
					? `[${childrenPadding}${core.join(`${itemSeparator}${childrenPadding}`)}${basePadding}]`
					: `[${core.join(itemSeparator)}]`;
			} else {
				let entries = Array.from((input as ObjectValue | NamespaceValue).value.entries());
				if (sortKeys) {
					entries = entries.sort(([a], [b]) => a.localeCompare(b));
				}
				const core = entries.map(([key, value]) => {
					let keyStr = JSON.stringify(key);
					if (ensureAscii) {
						keyStr = makeAsciiSafe(keyStr);
					}
					const v = `${keyStr}${keySeparator}${toJSON(value, options, depth + 1, convertUndefinedToNull)}`;
					return indent ? `${childrenPadding}${v}` : v;
				});
				return indent && core.length > 0
					? `{${core.join(itemSeparator)}${basePadding}}`
					: `{${core.join(itemSeparator)}}`;
			}
		}
		default:
			// e.g., FunctionValue
			throw new Error(`Cannot convert to JSON: ${input.type}`);
	}
}

/**
 * Represents an Object value at runtime.
 */
export class ObjectValue extends RuntimeValue<Map<string, AnyRuntimeValue>> {
	private _builtins?: Map<string, AnyRuntimeValue>;

	constructor(value?: Map<string, AnyRuntimeValue>) {
		super(value);
		this.type = "ObjectValue";
	}

	/**
	 * NOTE: necessary to override since all JavaScript arrays are considered truthy,
	 * while only non-empty Python arrays are consider truthy.
	 *
	 * e.g.,
	 *  - JavaScript:  {} && 5 -> 5
	 *  - Python:      {} and 5 -> {}
	 */
	override __bool__(): BooleanValue {
		return new BooleanValue(this.value.size > 0);
	}

	override get builtins(): Map<string, AnyRuntimeValue> {
		return (this._builtins ??= new Map<string, AnyRuntimeValue>([
			[
				"get",
				new FunctionValue(([key, defaultValue]) => {
					if (!(key instanceof StringValue)) {
						throw new Error(`Object key must be a string: got ${key.type}`);
					}
					return this.value.get(key.value) ?? defaultValue ?? new NullValue();
				}),
			],
			["items", new FunctionValue(() => this.items())],
			["keys", new FunctionValue(() => this.keys())],
			["values", new FunctionValue(() => this.values())],
			[
				"dictsort",
				new FunctionValue((args) => {
					// https://jinja.palletsprojects.com/en/stable/templates/#jinja-filters.dictsort
					// Sort a dictionary and yield (key, value) pairs.
					// Optional parameters:
					//  - case_sensitive: Sort in a case-sensitive manner (default: false)
					//  - by: Sort by 'key' or 'value' (default: 'key')
					//  - reverse: Reverse the sort order (default: false)

					// Extract keyword arguments if present
					let kwargs = new Map<string, AnyRuntimeValue>();
					const positionalArgs = args.filter((arg) => {
						if (arg instanceof KeywordArgumentsValue) {
							kwargs = arg.value;
							return false;
						}
						return true;
					});

					const caseSensitive = positionalArgs.at(0) ?? kwargs.get("case_sensitive") ?? new BooleanValue(false);
					if (!(caseSensitive instanceof BooleanValue)) {
						throw new Error("case_sensitive must be a boolean");
					}

					const by = positionalArgs.at(1) ?? kwargs.get("by") ?? new StringValue("key");
					if (!(by instanceof StringValue)) {
						throw new Error("by must be a string");
					}
					if (!["key", "value"].includes(by.value)) {
						throw new Error("by must be either 'key' or 'value'");
					}

					const reverse = positionalArgs.at(2) ?? kwargs.get("reverse") ?? new BooleanValue(false);
					if (!(reverse instanceof BooleanValue)) {
						throw new Error("reverse must be a boolean");
					}

					// Convert to array of [key, value] pairs and sort
					const items = Array.from(this.value.entries())
						.map(([key, value]) => new ArrayValue([new StringValue(key), value]))
						.sort((a, b) => {
							const index = by.value === "key" ? 0 : 1;
							const aVal = a.value[index];
							const bVal = b.value[index];

							const result = compareRuntimeValues(aVal, bVal, caseSensitive.value);
							return reverse.value ? -result : result;
						});

					return new ArrayValue(items);
				}),
			],
		]));
	}

	items(): ArrayValue {
		return new ArrayValue(
			Array.from(this.value.entries()).map(([key, value]) => new ArrayValue([new StringValue(key), value])),
		);
	}
	keys(): ArrayValue {
		return new ArrayValue(Array.from(this.value.keys()).map((key) => new StringValue(key)));
	}
	values(): ArrayValue {
		return new ArrayValue(Array.from(this.value.values()));
	}
	override toString(): string {
		return toJSON(this, {}, 0, false);
	}
}

/**
 * Represents the special `loop` variable of a for loop: an object whose entries are only created if the template
 * uses them. It keeps only the values they depend on, rather than the whole sequence, so that a `loop` which outlives
 * its iteration (e.g., stored in a namespace) does not keep every item alive.
 */
class LoopValue extends ObjectValue {
	declare entries?: Map<string, AnyRuntimeValue>;

	constructor(
		readonly iteration: number,
		readonly length: number,
		readonly previtem: AnyRuntimeValue | undefined,
		readonly nextitem: AnyRuntimeValue | undefined,
	) {
		super();
	}

	createEntries(): Map<string, AnyRuntimeValue> {
		const i = this.iteration;
		const length = this.length;
		return new Map<string, AnyRuntimeValue>([
			["index", new IntegerValue(i + 1)],
			["index0", new IntegerValue(i)],
			["revindex", new IntegerValue(length - i)],
			["revindex0", new IntegerValue(length - i - 1)],
			["first", new BooleanValue(i === 0)],
			["last", new BooleanValue(i === length - 1)],
			["length", new IntegerValue(length)],
			["previtem", this.previtem ?? new UndefinedValue()],
			["nextitem", this.nextitem ?? new UndefinedValue()],
		]);
	}
}

// TypeScript does not allow a subclass to turn a property into an accessor (TS2611), since a class field in a base
// class would shadow it. The base classes only declare `value`, so it is safe to define the accessor on the prototype.
// The setter is needed since the RuntimeValue constructor assigns `value`.
Object.defineProperty(LoopValue.prototype, "value", {
	get(this: LoopValue): Map<string, AnyRuntimeValue> {
		return (this.entries ??= this.createEntries());
	},
	set(this: LoopValue, entries: Map<string, AnyRuntimeValue> | undefined) {
		this.entries = entries;
	},
	configurable: true,
});

/**
 * Represents a KeywordArguments value at runtime.
 */
export class KeywordArgumentsValue extends ObjectValue {
	constructor(value?: Map<string, AnyRuntimeValue>) {
		super(value);
		this.type = "KeywordArgumentsValue";
	}
}

/**
 * Represents a mutable namespace with attribute/subscript access but no mapping behavior or builtins.
 */
export class NamespaceValue extends RuntimeValue<Map<string, AnyRuntimeValue>> {
	constructor(value?: Map<string, AnyRuntimeValue>) {
		super(value);
		this.type = "NamespaceValue";
	}

	override toString(): string {
		return toJSON(this, {}, 0, false);
	}
}

/**
 * Represents an Array value at runtime.
 */
export class ArrayValue extends RuntimeValue<AnyRuntimeValue[]> {
	private _builtins?: Map<string, AnyRuntimeValue>;

	constructor(value?: AnyRuntimeValue[]) {
		super(value);
		this.type = "ArrayValue";
	}

	override get builtins(): Map<string, AnyRuntimeValue> {
		return (this._builtins ??= new Map<string, AnyRuntimeValue>([["length", new IntegerValue(this.value.length)]]));
	}

	/**
	 * NOTE: necessary to override since all JavaScript arrays are considered truthy,
	 * while only non-empty Python arrays are consider truthy.
	 *
	 * e.g.,
	 *  - JavaScript:  [] && 5 -> 5
	 *  - Python:      [] and 5 -> []
	 */
	override __bool__(): BooleanValue {
		return new BooleanValue(this.value.length > 0);
	}
	override toString(): string {
		return toJSON(this, {}, 0, false);
	}
}

/**
 * Represents a Tuple value at runtime.
 * NOTE: We extend ArrayValue since JavaScript does not have a built-in Tuple type.
 */
export class TupleValue extends ArrayValue {
	constructor(value?: AnyRuntimeValue[]) {
		super(value);
		this.type = "TupleValue";
	}
}

/**
 * Represents a Function value at runtime.
 */
export class FunctionValue extends RuntimeValue<(args: AnyRuntimeValue[], scope: Environment) => AnyRuntimeValue> {
	constructor(value?: (args: AnyRuntimeValue[], scope: Environment) => AnyRuntimeValue) {
		super(value);
		this.type = "FunctionValue";
	}
}

/**
 * Represents a Null value at runtime.
 */
export class NullValue extends RuntimeValue<null> {
	constructor(value?: null) {
		super(value);
		this.type = "NullValue";
	}
}

/**
 * Represents an Undefined value at runtime.
 */
export class UndefinedValue extends RuntimeValue<undefined> {
	constructor(value?: undefined) {
		super(value);
		this.type = "UndefinedValue";
	}
}

function normalizeNamespaceEntry(pair: AnyRuntimeValue): [StringValue, AnyRuntimeValue] {
	let values: AnyRuntimeValue[] | undefined;
	if (pair instanceof ArrayValue) {
		values = pair.value;
	} else if (pair instanceof StringValue) {
		values = Array.from(pair.value, (char) => new StringValue(char));
	}
	if (!values || values.length !== 2) {
		throw new Error("namespace expected an object or an iterable of [key, value] pairs");
	}

	const [key, value] = values;
	if (!(key instanceof StringValue)) {
		throw new Error("namespace keys must be strings");
	}
	return [key, value];
}

/**
 * Implements the `namespace` builtin. Each environment wraps it in its own `FunctionValue`, so that replacing
 * one environment's `namespace` does not affect any other.
 */
function namespaceBuiltin(args: AnyRuntimeValue[]): NamespaceValue {
	// Copy top-level entries so namespace assignment does not mutate the input.
	const positional = args.slice();
	let kwargs: KeywordArgumentsValue | undefined;
	if (positional.at(-1) instanceof KeywordArgumentsValue) {
		kwargs = positional.pop() as KeywordArgumentsValue;
	}
	if (positional.length > 1) {
		throw new Error(`namespace expected at most 1 argument, got ${positional.length}`);
	}
	const entries = new Map<string, AnyRuntimeValue>();
	if (positional.length === 1) {
		const source = positional[0];
		if (source instanceof ObjectValue) {
			for (const [key, value] of source.value) {
				entries.set(key, value);
			}
		} else if (source instanceof ArrayValue) {
			for (const pair of source.value) {
				const [key, value] = normalizeNamespaceEntry(pair);
				entries.set(key.value, value);
			}
		} else {
			throw new Error(`'${source.type}' object is not iterable`);
		}
	}
	if (kwargs) {
		for (const [key, value] of kwargs.value) {
			entries.set(key, value);
		}
	}
	return new NamespaceValue(entries);
}

const CALL_BLOCK_SCOPE = Symbol("callBlockScope");

/**
 * Represents the current environment (scope) at runtime.
 */
export class Environment {
	declare [CALL_BLOCK_SCOPE]?: boolean;

	/**
	 * The variables declared in this environment.
	 */
	variables: Map<string, AnyRuntimeValue> = new Map<string, AnyRuntimeValue>().set(
		"namespace",
		new FunctionValue(namespaceBuiltin),
	);

	/**
	 * The tests available in this environment.
	 */
	private static readonly TESTS: ReadonlyMap<string, (...value: AnyRuntimeValue[]) => boolean> = new Map([
		["boolean", (operand) => operand.type === "BooleanValue"],
		["callable", (operand) => operand instanceof FunctionValue],
		[
			"odd",
			(operand) => {
				if (!(operand instanceof IntegerValue)) {
					throw new Error(`cannot odd on ${operand.type}`);
				}
				return operand.value % 2 !== 0;
			},
		],
		[
			"even",
			(operand) => {
				if (!(operand instanceof IntegerValue)) {
					throw new Error(`cannot even on ${operand.type}`);
				}
				return operand.value % 2 === 0;
			},
		],
		["false", (operand) => operand.type === "BooleanValue" && !(operand as BooleanValue).value],
		["true", (operand) => operand.type === "BooleanValue" && (operand as BooleanValue).value],
		["none", (operand) => operand.type === "NullValue"],
		["string", (operand) => operand.type === "StringValue"],
		["number", (operand) => operand instanceof IntegerValue || operand instanceof FloatValue],
		["integer", (operand) => operand instanceof IntegerValue],
		["iterable", (operand) => operand.type === "ArrayValue" || operand.type === "StringValue"],
		["mapping", (operand) => operand instanceof ObjectValue],
		[
			"sequence",
			(operand) => operand instanceof ArrayValue || operand instanceof ObjectValue || operand instanceof StringValue,
		],
		[
			"lower",
			(operand) => {
				const str = (operand as StringValue).value;
				return operand.type === "StringValue" && str === str.toLowerCase();
			},
		],
		[
			"upper",
			(operand) => {
				const str = (operand as StringValue).value;
				return operand.type === "StringValue" && str === str.toUpperCase();
			},
		],
		["none", (operand) => operand.type === "NullValue"],
		["defined", (operand) => operand.type !== "UndefinedValue"],
		["undefined", (operand) => operand.type === "UndefinedValue"],
		["equalto", (a, b) => a.value === b.value],
		["eq", (a, b) => a.value === b.value],
	]);

	tests: ReadonlyMap<string, (...value: AnyRuntimeValue[]) => boolean> = Environment.TESTS;

	constructor(public parent?: Environment) {}

	/**
	 * Set the value of a variable in the current environment.
	 */
	set(name: string, value: unknown): AnyRuntimeValue {
		return this.declareVariable(name, convertToRuntimeValues(value));
	}

	private declareVariable(name: string, value: AnyRuntimeValue): AnyRuntimeValue {
		if (this.variables.has(name)) {
			throw new SyntaxError(`Variable already declared: ${name}`);
		}
		this.variables.set(name, value);
		return value;
	}

	// private assignVariable(name: string, value: AnyRuntimeValue): AnyRuntimeValue {
	// 	const env = this.resolve(name);
	// 	env.variables.set(name, value);
	// 	return value;
	// }

	/**
	 * Set variable in the current scope.
	 * See https://jinja.palletsprojects.com/en/3.0.x/templates/#assignments for more information.
	 */
	setVariable(name: string, value: AnyRuntimeValue): AnyRuntimeValue {
		this.variables.set(name, value);
		return value;
	}

	/**
	 * Resolve the environment in which the variable is declared.
	 * @param {string} name The name of the variable.
	 * @returns {Environment | undefined} The environment containing the variable, if declared.
	 */
	private resolve(name: string): Environment | undefined {
		if (this.variables.has(name)) {
			return this;
		}

		// Traverse scope chain
		if (this.parent) {
			return this.parent.resolve(name);
		}

		return undefined;
	}

	lookupVariable(name: string): AnyRuntimeValue {
		try {
			return this.resolve(name)?.variables.get(name) ?? new UndefinedValue();
		} catch {
			return new UndefinedValue();
		}
	}
}

export function setupGlobals(env: Environment): void {
	// Declare global variables
	env.set("false", false);
	env.set("true", true);
	env.set("none", null);
	env.set("raise_exception", (args: string) => {
		throw new Error(args);
	});
	env.set("range", range);
	env.set("strftime_now", strftime_now);

	// NOTE: According to the Jinja docs: The special constants true, false, and none are indeed lowercase.
	// Because that caused confusion in the past, (True used to expand to an undefined variable that was considered false),
	// all three can now also be written in title case (True, False, and None). However, for consistency, (all Jinja identifiers are lowercase)
	// you should use the lowercase versions.
	env.set("True", true);
	env.set("False", false);
	env.set("None", null);
}

type AttributeContainer = ObjectValue | NamespaceValue;

function isAttributeContainer(value: AnyRuntimeValue): value is AttributeContainer {
	return value instanceof ObjectValue || value instanceof NamespaceValue;
}

type NumericLikeValue = IntegerValue | FloatValue | BooleanValue;

function isNumericLikeValue(value: AnyRuntimeValue): value is NumericLikeValue {
	return value instanceof IntegerValue || value instanceof FloatValue || value instanceof BooleanValue;
}

function getNumericValue(value: NumericLikeValue): number {
	return value instanceof BooleanValue ? Number(value.value) : value.value;
}

/**
 * Helper function to get a nested attribute value from an object using dot notation.
 * Supports both object properties and array indices.
 * @param item The item to get the value from
 * @param attributePath The attribute path (e.g., "details.priority" or "items.0")
 * @returns The value at the attribute path, or UndefinedValue if not found
 */
function getAttributeValue(item: AnyRuntimeValue, attributePath: string): AnyRuntimeValue {
	const parts = attributePath.split(".");
	let value: AnyRuntimeValue = item;

	for (const part of parts) {
		if (isAttributeContainer(value)) {
			value = value.value.get(part) ?? new UndefinedValue();
		} else if (value instanceof ArrayValue) {
			const index = parseInt(part, 10);
			if (!isNaN(index) && index >= 0 && index < value.value.length) {
				value = value.value[index];
			} else {
				return new UndefinedValue();
			}
		} else {
			return new UndefinedValue();
		}
	}

	return value;
}

/**
 * Helper function to compare two runtime values for sorting.
 * Enforces strict type checking, i.e., types must match exactly (with some exceptions):
 * - Integers and floats can be compared (both are numeric)
 * - Booleans can be compared with numbers (false=0, true=1)
 * - Null values can be compared with null values (they are equal)
 * - Undefined values can be compared with undefined values (they are equal)
 * @param a The first value to compare
 * @param b The second value to compare
 * @param caseSensitive Whether string comparisons should be case-sensitive (default: false)
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 */
function compareRuntimeValues(a: AnyRuntimeValue, b: AnyRuntimeValue, caseSensitive: boolean = false): number {
	// Handle null values (can only compare null with null)
	if (a instanceof NullValue && b instanceof NullValue) {
		return 0; // All null values are equal
	}
	if (a instanceof NullValue || b instanceof NullValue) {
		throw new Error(`Cannot compare ${a.type} with ${b.type}`);
	}

	// Handle undefined values (can only compare undefined with undefined)
	if (a instanceof UndefinedValue && b instanceof UndefinedValue) {
		return 0; // All undefined values are equal
	}
	if (a instanceof UndefinedValue || b instanceof UndefinedValue) {
		throw new Error(`Cannot compare ${a.type} with ${b.type}`);
	}

	// Allow comparing numeric-like types (integers, floats, and booleans)
	if (isNumericLikeValue(a) && isNumericLikeValue(b)) {
		const aNum = getNumericValue(a);
		const bNum = getNumericValue(b);
		return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
	}

	// Strict type checking for non-numeric types
	if (a.type !== b.type) {
		throw new Error(`Cannot compare different types: ${a.type} and ${b.type}`);
	}

	switch (a.type) {
		case "StringValue": {
			let aStr = (a as StringValue).value;
			let bStr = (b as StringValue).value;
			if (!caseSensitive) {
				aStr = aStr.toLowerCase();
				bStr = bStr.toLowerCase();
			}
			return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
		}
		default:
			throw new Error(`Cannot compare type: ${a.type}`);
	}
}

interface ParameterDescriptor {
	name: string;
	defaultValue?: Expression;
}

function getParameterDescriptor(argument: Parameter): ParameterDescriptor {
	if (argument.type === "Identifier") {
		return { name: (argument as Identifier).value };
	}
	const keywordArgument = argument as KeywordArgumentExpression;
	return { name: keywordArgument.key.value, defaultValue: keywordArgument.value };
}

type SpecialMacroArgument = "caller" | "kwargs" | "varargs";

function isSpecialMacroArgument(name: string): name is SpecialMacroArgument {
	return name === "caller" || name === "kwargs" || name === "varargs";
}

/**
 * Find special-argument body loads that precede a declaration, following Jinja's AST visit order.
 */
function findAccessedSpecialMacroArguments(parameters: Parameter[], body: Statement[]): Set<SpecialMacroArgument> {
	const declared = new Set<SpecialMacroArgument>();
	const accessed = new Set<SpecialMacroArgument>();

	const declareName = (name: string): void => {
		if (isSpecialMacroArgument(name)) {
			declared.add(name);
		}
	};

	const declareTarget = (target: Expression): void => {
		if (target.type === "Identifier") {
			declareName((target as Identifier).value);
		} else if (target.type === "TupleLiteral") {
			for (const item of (target as TupleLiteral).value) {
				declareTarget(item);
			}
		}
	};

	const declareArgument = (argument: Parameter): void => {
		declareName(getParameterDescriptor(argument).name);
	};

	const visitArgumentDefaults = (args: Parameter[]): void => {
		for (const argument of args) {
			const parameter = getParameterDescriptor(argument);
			if (parameter.defaultValue) {
				visit(parameter.defaultValue);
			}
		}
	};

	const visitFilter = (filter: Identifier | CallExpression): void => {
		// A filter name is syntax, not a variable load.
		if (filter.type === "CallExpression") {
			visit((filter as CallExpression).args);
		}
	};

	const visit = (node: unknown): void => {
		if (Array.isArray(node)) {
			for (const item of node) {
				visit(item);
			}
			return;
		}
		if (node instanceof Map) {
			for (const [key, value] of node) {
				visit(key);
				visit(value);
			}
			return;
		}
		if (!(node instanceof Statement)) {
			return;
		}

		switch (node.type) {
			case "For": {
				const statement = node as For;
				declareTarget(statement.loopvar);
				if (statement.iterable.type === "SelectExpression") {
					const iterable = statement.iterable as SelectExpression;
					// Jinja visits a for-loop condition after its body and else block.
					visit(iterable.lhs);
					visit(statement.body);
					visit(statement.defaultBlock);
					visit(iterable.test);
					return;
				}
				visit(statement.iterable);
				visit(statement.body);
				visit(statement.defaultBlock);
				return;
			}
			case "Set": {
				const statement = node as SetStatement;
				declareTarget(statement.assignee);
				visit(statement.value);
				visit(statement.body);
				return;
			}
			case "Macro": {
				const statement = node as Macro;
				for (const argument of statement.args) {
					declareArgument(argument);
				}
				visitArgumentDefaults(statement.args);
				visit(statement.body);
				return;
			}
			case "CallStatement": {
				const statement = node as CallStatement;
				visit(statement.call);
				for (const argument of statement.callerArgs ?? []) {
					declareArgument(argument);
				}
				visitArgumentDefaults(statement.callerArgs ?? []);
				visit(statement.body);
				return;
			}
			case "FilterStatement": {
				const statement = node as FilterStatement;
				visit(statement.body);
				visitFilter(statement.filter);
				return;
			}
			case "Identifier": {
				const name = (node as Identifier).value;
				if (isSpecialMacroArgument(name) && !declared.has(name)) {
					accessed.add(name);
				}
				return;
			}
			case "MemberExpression": {
				const expression = node as MemberExpression;
				visit(expression.object);
				if (expression.computed) {
					visit(expression.property);
				}
				return;
			}
			case "FilterExpression": {
				const expression = node as FilterExpression;
				visit(expression.operand);
				visitFilter(expression.filter);
				return;
			}
			case "TestExpression":
				visit((node as TestExpression).operand);
				return;
			case "SelectExpression": {
				const expression = node as SelectExpression;
				visit(expression.test);
				visit(expression.lhs);
				return;
			}
			case "KeywordArgumentExpression":
				visit((node as KeywordArgumentExpression).value);
				return;
			default:
				for (const child of Object.values(node)) {
					visit(child);
				}
		}
	};

	// Do not scan this macro or call block's defaults; its parameter names still suppress collection.
	for (const parameter of parameters) {
		declareArgument(parameter);
	}
	visit(body);
	return accessed;
}

/**
 * The special-argument analysis depends only on the syntax of a macro or call block,
 * so it is computed once per AST node instead of on every evaluation of that node.
 */
const ACCESSED_SPECIAL_ARGUMENTS = new WeakMap<Macro | CallStatement, Set<SpecialMacroArgument>>();

function getAccessedSpecialMacroArguments(node: Macro | CallStatement): Set<SpecialMacroArgument> {
	let accessed = ACCESSED_SPECIAL_ARGUMENTS.get(node);
	if (accessed === undefined) {
		const parameters = node.type === "Macro" ? (node as Macro).args : ((node as CallStatement).callerArgs ?? []);
		accessed = findAccessedSpecialMacroArguments(parameters, node.body);
		ACCESSED_SPECIAL_ARGUMENTS.set(node, accessed);
	}
	return accessed;
}

export class Interpreter {
	global: Environment;

	constructor(env?: Environment) {
		this.global = env ?? new Environment();
	}

	/**
	 * Run the program.
	 */
	run(program: Program): AnyRuntimeValue {
		return this.evaluate(program, this.global);
	}

	/**
	 * Evaluates expressions following the binary operation type.
	 */
	private evaluateBinaryExpression(node: BinaryExpression, environment: Environment): AnyRuntimeValue {
		const operator = node.operator.value;
		const left = this.evaluate(node.left, environment);

		// Logical operators
		// NOTE: Short-circuiting is handled by the `evaluate` function
		switch (operator) {
			case "and":
				return left.__bool__().value ? this.evaluate(node.right, environment) : left;
			case "or":
				return left.__bool__().value ? left : this.evaluate(node.right, environment);
		}

		// Equality operators
		const right = this.evaluate(node.right, environment);
		switch (operator) {
			case "==":
				return new BooleanValue(left.value == right.value);
			case "!=":
				return new BooleanValue(left.value != right.value);
		}

		if (
			(left instanceof IntegerValue || left instanceof FloatValue) &&
			(right instanceof IntegerValue || right instanceof FloatValue) &&
			// These two operators are handled (for all operand types) below
			operator !== "~" &&
			operator !== "**"
		) {
			// Evaulate pure numeric operations with binary operators.
			const a = left.value,
				b = right.value;
			switch (operator) {
				// Arithmetic operators
				case "+":
				case "-":
				case "*": {
					const res = operator === "+" ? a + b : operator === "-" ? a - b : a * b;
					const isFloat = left instanceof FloatValue || right instanceof FloatValue;
					return isFloat ? new FloatValue(res) : new IntegerValue(res);
				}
				case "/":
					return new FloatValue(a / b);
				case "//": {
					// Floor division (rounds towards negative infinity, matching Python semantics)
					const res = Math.floor(a / b);
					const isFloat = left instanceof FloatValue || right instanceof FloatValue;
					return isFloat ? new FloatValue(res) : new IntegerValue(res);
				}
				case "%": {
					const rem = a % b;
					const isFloat = left instanceof FloatValue || right instanceof FloatValue;
					return isFloat ? new FloatValue(rem) : new IntegerValue(rem);
				}
				// Comparison operators
				case "<":
					return new BooleanValue(a < b);
				case ">":
					return new BooleanValue(a > b);
				case ">=":
					return new BooleanValue(a >= b);
				case "<=":
					return new BooleanValue(a <= b);
			}
		} else if (left instanceof UndefinedValue || right instanceof UndefinedValue) {
			if (right instanceof UndefinedValue && ["in", "not in"].includes(operator)) {
				// Special case: `anything in undefined` is `false` and `anything not in undefined` is `true`
				return new BooleanValue(operator === "not in");
			}
			if (operator === "~" && !(left instanceof NullValue || right instanceof NullValue)) {
				// Special case: Jinja concatenates undefined values as empty strings
				const lhs = left instanceof UndefinedValue ? "" : left.value.toString();
				const rhs = right instanceof UndefinedValue ? "" : right.value.toString();
				return new StringValue(lhs + rhs);
			}
			throw new Error(`Cannot perform operation ${operator} on undefined values`);
		} else if (left instanceof NullValue || right instanceof NullValue) {
			throw new Error("Cannot perform operation on null values");
		} else if (operator === "~") {
			// toString and concatenation
			return new StringValue(left.value.toString() + right.value.toString());
		} else if (operator === "**" && isNumericLikeValue(left) && isNumericLikeValue(right)) {
			// Jinja treats booleans as integers here.
			const a = getNumericValue(left);
			const b = getNumericValue(right);
			if (a === 0 && b < 0) {
				throw new Error("0.0 cannot be raised to a negative power");
			}

			const result = a ** b;
			if (!Number.isFinite(result)) {
				// NaN represents an unsupported complex result; Infinity represents overflow.
				throw new Error("Exponentiation result is not a finite real number");
			}

			// Negative exponents produce floats.
			const isFloat = left instanceof FloatValue || right instanceof FloatValue || b < 0;
			return isFloat ? new FloatValue(result) : new IntegerValue(result);
		} else if (left instanceof ArrayValue && right instanceof ArrayValue) {
			// Evaluate array operands with binary operator.
			switch (operator) {
				case "+":
					return new ArrayValue(left.value.concat(right.value));
			}
		} else if (right instanceof ArrayValue) {
			const member = right.value.find((x) => x.value === left.value) !== undefined;
			switch (operator) {
				case "in":
					return new BooleanValue(member);
				case "not in":
					return new BooleanValue(!member);
			}
		}

		if (left instanceof StringValue || right instanceof StringValue) {
			// Support string concatenation as long as at least one operand is a string
			switch (operator) {
				case "+":
					return new StringValue(left.value.toString() + right.value.toString());
			}
		}

		if (left instanceof StringValue && right instanceof StringValue) {
			switch (operator) {
				case "in":
					return new BooleanValue(right.value.includes(left.value));
				case "not in":
					return new BooleanValue(!right.value.includes(left.value));
			}
		}

		if (left instanceof StringValue && right instanceof ObjectValue) {
			switch (operator) {
				case "in":
					return new BooleanValue(right.value.has(left.value));
				case "not in":
					return new BooleanValue(!right.value.has(left.value));
			}
		}

		throw new SyntaxError(`Unknown operator "${operator}" between ${left.type} and ${right.type}`);
	}

	/**
	 * Evaluates the arguments of a call in the calling convention of FunctionValue: the positional arguments,
	 * followed by a single KeywordArgumentsValue with all keyword arguments (if there are any).
	 */
	private evaluateCallArguments(args: Expression[], environment: Environment): AnyRuntimeValue[] {
		// NOTE: The whole list is checked before any argument is evaluated, so that none is evaluated twice.
		for (const argument of args) {
			const type = argument.type;
			if (type === "KeywordArgumentExpression" || type === "SpreadExpression" || type === "KeywordSpreadExpression") {
				const [positionalArguments, keywordArguments] = this.evaluateArguments(args, environment);
				if (keywordArguments.size > 0) {
					positionalArguments.push(new KeywordArgumentsValue(keywordArguments));
				}
				return positionalArguments;
			}
		}

		// Plain positional arguments only (the most common case)
		const positionalArguments: AnyRuntimeValue[] = new Array(args.length);
		for (let i = 0; i < args.length; ++i) {
			positionalArguments[i] = this.evaluate(args[i], environment);
		}
		return positionalArguments;
	}

	private evaluateArguments(
		args: Expression[],
		environment: Environment,
	): [AnyRuntimeValue[], Map<string, AnyRuntimeValue>] {
		// Accumulate args and kwargs
		const positionalArguments: AnyRuntimeValue[] = [];
		const keywordArguments = new Map<string, AnyRuntimeValue>();
		const addKeywordArgument = (key: string, value: AnyRuntimeValue): void => {
			if (keywordArguments.has(key)) {
				throw new Error(`Got multiple values for keyword argument '${key}'`);
			}
			keywordArguments.set(key, value);
		};

		// Like Python, the entire positional part (including a `*` unpacking placed after
		// keyword arguments) is evaluated before any keyword argument value.
		for (const argument of args) {
			// TODO: Lazy evaluation of arguments
			if (argument.type === "SpreadExpression") {
				const spreadNode = argument as SpreadExpression;
				const val = this.evaluate(spreadNode.argument, environment);
				if (!(val instanceof ArrayValue)) {
					throw new Error(`Cannot unpack non-iterable type: ${val.type}`);
				}
				for (const item of val.value) {
					positionalArguments.push(item);
				}
			} else if (argument.type !== "KeywordArgumentExpression" && argument.type !== "KeywordSpreadExpression") {
				positionalArguments.push(this.evaluate(argument, environment));
			}
		}
		for (const argument of args) {
			if (argument.type === "KeywordArgumentExpression") {
				const kwarg = argument as KeywordArgumentExpression;
				addKeywordArgument(kwarg.key.value, this.evaluate(kwarg.value, environment));
			} else if (argument.type === "KeywordSpreadExpression") {
				const spreadNode = argument as KeywordSpreadExpression;
				const val = this.evaluate(spreadNode.argument, environment);
				if (!(val instanceof ObjectValue)) {
					throw new Error(`Argument after ** must be a mapping, not ${val.type}`);
				}
				for (const [key, value] of val.value) {
					addKeywordArgument(key, value);
				}
			}
		}
		return [positionalArguments, keywordArguments];
	}

	private applyFilter(operand: AnyRuntimeValue, filterNode: Identifier | CallExpression, environment: Environment) {
		// For now, we only support the built-in filters
		// TODO: Add support for non-identifier filters
		//   e.g., functions which return filters: {{ numbers | select("odd") }}
		// TODO: Add support for user-defined filters
		//   const filter = environment.lookupVariable(node.filter.value);
		//   if (!(filter instanceof FunctionValue)) {
		//     throw new Error(`Filter must be a function: got ${filter.type}`);
		//   }
		//   return filter.value([operand], environment);

		// https://jinja.palletsprojects.com/en/3.0.x/templates/#list-of-builtin-filters

		if (filterNode.type === "Identifier") {
			const filter = filterNode as Identifier;

			if (filter.value === "safe") {
				return operand;
			}

			if (filter.value === "tojson") {
				return new StringValue(toJSON(operand, {}));
			}

			if (operand instanceof ArrayValue) {
				switch (filter.value) {
					case "list":
						return operand;
					case "first":
						return operand.value[0];
					case "last":
						return operand.value[operand.value.length - 1];
					case "length":
						return new IntegerValue(operand.value.length);
					case "reverse":
						return new ArrayValue(operand.value.slice().reverse());
					case "sort": {
						// Default to case-insensitive sort
						return new ArrayValue(operand.value.slice().sort((a, b) => compareRuntimeValues(a, b, false)));
					}
					case "join":
						return new StringValue(operand.value.map((x) => x.value).join(""));
					case "string":
						return new StringValue(toJSON(operand, {}, 0, false));
					case "unique": {
						const seen = new Set();
						const output: AnyRuntimeValue[] = [];
						for (const item of operand.value) {
							if (!seen.has(item.value)) {
								seen.add(item.value);
								output.push(item);
							}
						}
						return new ArrayValue(output);
					}
					default:
						throw new Error(`Unknown ArrayValue filter: ${filter.value}`);
				}
			} else if (operand instanceof StringValue) {
				switch (filter.value) {
					// Filters that are also built-in functions
					case "length":
					case "upper":
					case "lower":
					case "title":
					case "capitalize": {
						const builtin = operand.builtins.get(filter.value);
						if (builtin instanceof FunctionValue) {
							return builtin.value(/* no arguments */ [], environment);
						} else if (builtin instanceof IntegerValue) {
							return builtin;
						} else {
							throw new Error(`Unknown StringValue filter: ${filter.value}`);
						}
					}
					case "trim":
						return new StringValue(operand.value.trim());
					case "indent":
						return new StringValue(
							operand.value
								.split("\n")
								.map((x, i) =>
									// By default, don't indent the first line or empty lines
									i === 0 || x.length === 0 ? x : "    " + x,
								)
								.join("\n"),
						);
					case "join":
					case "string":
						return operand; // no-op
					case "int": {
						const val = parseInt(operand.value, 10);
						return new IntegerValue(isNaN(val) ? 0 : val);
					}
					case "float": {
						const val = parseFloat(operand.value);
						return new FloatValue(isNaN(val) ? 0.0 : val);
					}
					default:
						throw new Error(`Unknown StringValue filter: ${filter.value}`);
				}
			} else if (operand instanceof IntegerValue || operand instanceof FloatValue) {
				switch (filter.value) {
					case "abs":
						return operand instanceof IntegerValue
							? new IntegerValue(Math.abs(operand.value))
							: new FloatValue(Math.abs(operand.value));
					case "int":
						return new IntegerValue(Math.trunc(operand.value) + 0);
					case "float":
						return new FloatValue(operand.value);
					case "string":
						return new StringValue(operand.toString());
					default:
						throw new Error(`Unknown NumericValue filter: ${filter.value}`);
				}
			} else if (operand instanceof ObjectValue) {
				switch (filter.value) {
					case "items":
						return new ArrayValue(
							Array.from(operand.value.entries()).map(([key, value]) => new ArrayValue([new StringValue(key), value])),
						);
					case "length":
						return new IntegerValue(operand.value.size);
					default: {
						// Check if the filter exists in builtins
						const builtin = operand.builtins.get(filter.value);
						if (builtin) {
							if (builtin instanceof FunctionValue) {
								return builtin.value([], environment);
							}
							return builtin;
						}
						throw new Error(`Unknown ObjectValue filter: ${filter.value}`);
					}
				}
			} else if (operand instanceof BooleanValue) {
				switch (filter.value) {
					case "bool":
						return new BooleanValue(operand.value);
					case "int":
						return new IntegerValue(operand.value ? 1 : 0);
					case "float":
						return new FloatValue(operand.value ? 1.0 : 0.0);
					case "string":
						return new StringValue(operand.value ? "true" : "false");
					default:
						throw new Error(`Unknown BooleanValue filter: ${filter.value}`);
				}
			}
			throw new Error(`Cannot apply filter "${filter.value}" to type: ${operand.type}`);
		} else if (filterNode.type === "CallExpression") {
			const filter = filterNode as CallExpression;

			if (filter.callee.type !== "Identifier") {
				throw new Error(`Unknown filter: ${filter.callee.type}`);
			}
			const filterName = (filter.callee as Identifier).value;

			if (filterName === "tojson") {
				const [, kwargs] = this.evaluateArguments(filter.args, environment);

				// Handle indent parameter
				const indent = kwargs.get("indent") ?? new NullValue();
				if (!(indent instanceof IntegerValue || indent instanceof NullValue)) {
					throw new Error("If set, indent must be a number");
				}

				// Handle ensure_ascii parameter
				const ensureAscii = kwargs.get("ensure_ascii") ?? new BooleanValue(false);
				if (!(ensureAscii instanceof BooleanValue)) {
					throw new Error("If set, ensure_ascii must be a boolean");
				}

				// Handle sort_keys parameter
				const sortKeys = kwargs.get("sort_keys") ?? new BooleanValue(false);
				if (!(sortKeys instanceof BooleanValue)) {
					throw new Error("If set, sort_keys must be a boolean");
				}

				// Handle separators parameter - expects a tuple/array of two strings: (item_separator, key_separator)
				const separatorsArg = kwargs.get("separators") ?? new NullValue();
				let separators: [string, string] | null = null;
				if (separatorsArg instanceof ArrayValue || separatorsArg instanceof TupleValue) {
					if (separatorsArg.value.length !== 2) {
						throw new Error("separators must be a tuple of two strings");
					}
					const [itemSep, keySep] = separatorsArg.value;
					if (!(itemSep instanceof StringValue) || !(keySep instanceof StringValue)) {
						throw new Error("separators must be a tuple of two strings");
					}
					separators = [itemSep.value, keySep.value];
				} else if (!(separatorsArg instanceof NullValue)) {
					throw new Error("If set, separators must be a tuple of two strings");
				}

				return new StringValue(
					toJSON(operand, {
						indent: indent.value,
						ensureAscii: ensureAscii.value,
						sortKeys: sortKeys.value,
						separators,
					}),
				);
			} else if (filterName === "join") {
				let value;
				if (operand instanceof StringValue) {
					// NOTE: string.split('') breaks for unicode characters
					value = Array.from(operand.value);
				} else if (operand instanceof ArrayValue) {
					value = operand.value.map((x) => x.value);
				} else {
					throw new Error(`Cannot apply filter "${filterName}" to type: ${operand.type}`);
				}
				const [args, kwargs] = this.evaluateArguments(filter.args, environment);

				const separator = args.at(0) ?? kwargs.get("separator") ?? new StringValue("");
				if (!(separator instanceof StringValue)) {
					throw new Error("separator must be a string");
				}

				return new StringValue(value.join(separator.value));
			} else if (filterName === "int" || filterName === "float") {
				const [args, kwargs] = this.evaluateArguments(filter.args, environment);
				const defaultValue =
					args.at(0) ?? kwargs.get("default") ?? (filterName === "int" ? new IntegerValue(0) : new FloatValue(0.0));

				if (operand instanceof StringValue) {
					const val = filterName === "int" ? parseInt(operand.value, 10) : parseFloat(operand.value);
					return isNaN(val) ? defaultValue : filterName === "int" ? new IntegerValue(val) : new FloatValue(val);
				} else if (operand instanceof IntegerValue || operand instanceof FloatValue) {
					return filterName === "int" ? new IntegerValue(Math.trunc(operand.value) + 0) : new FloatValue(operand.value);
				} else if (operand instanceof BooleanValue) {
					return filterName === "int"
						? new IntegerValue(operand.value ? 1 : 0)
						: new FloatValue(operand.value ? 1.0 : 0.0);
				} else {
					throw new Error(`Cannot apply filter "${filterName}" to type: ${operand.type}`);
				}
			} else if (filterName === "default") {
				const [args, kwargs] = this.evaluateArguments(filter.args, environment);
				const defaultValue = args[0] ?? new StringValue("");
				const booleanValue = args[1] ?? kwargs.get("boolean") ?? new BooleanValue(false);
				if (!(booleanValue instanceof BooleanValue)) {
					throw new Error("`default` filter flag must be a boolean");
				}
				if (operand instanceof UndefinedValue || (booleanValue.value && !operand.__bool__().value)) {
					return defaultValue;
				}
				return operand;
			}

			if (operand instanceof ArrayValue) {
				switch (filterName) {
					case "sort": {
						// https://jinja.palletsprojects.com/en/stable/templates/#jinja-filters.sort
						// Optional parameters:
						//  - reverse: Sort descending instead of ascending
						//  - case_sensitive: When sorting strings, sort upper and lower case separately
						//  - attribute: When sorting objects or dicts, an attribute or key to sort by
						const [args, kwargs] = this.evaluateArguments(filter.args, environment);

						const reverse = args.at(0) ?? kwargs.get("reverse") ?? new BooleanValue(false);
						if (!(reverse instanceof BooleanValue)) {
							throw new Error("reverse must be a boolean");
						}

						const caseSensitive = args.at(1) ?? kwargs.get("case_sensitive") ?? new BooleanValue(false);
						if (!(caseSensitive instanceof BooleanValue)) {
							throw new Error("case_sensitive must be a boolean");
						}

						const attribute = args.at(2) ?? kwargs.get("attribute") ?? new NullValue();
						if (
							!(attribute instanceof StringValue || attribute instanceof IntegerValue || attribute instanceof NullValue)
						) {
							throw new Error("attribute must be a string, integer, or null");
						}

						// Helper function to get the value to sort by
						const getSortValue = (item: AnyRuntimeValue): AnyRuntimeValue => {
							if (attribute instanceof NullValue) {
								return item;
							}
							const attrPath = attribute instanceof IntegerValue ? String(attribute.value) : attribute.value;
							return getAttributeValue(item, attrPath);
						};

						return new ArrayValue(
							operand.value.slice().sort((a, b) => {
								const aVal = getSortValue(a);
								const bVal = getSortValue(b);
								const result = compareRuntimeValues(aVal, bVal, caseSensitive.value);
								return reverse.value ? -result : result;
							}),
						);
					}
					case "selectattr":
					case "rejectattr": {
						const select = filterName === "selectattr";

						if (operand.value.some((item) => !isAttributeContainer(item))) {
							throw new Error(`\`${filterName}\` can only be applied to array of objects`);
						}
						if (filter.args.some((x) => x.type !== "StringLiteral")) {
							throw new Error(`arguments of \`${filterName}\` must be strings`);
						}

						const [attr, testName, value] = filter.args.map((x) => this.evaluate(x, environment)) as StringValue[];

						let testFunction: (...x: AnyRuntimeValue[]) => boolean;
						if (testName) {
							// Get the test function from the environment
							const test = environment.tests.get(testName.value);
							if (!test) {
								throw new Error(`Unknown test: ${testName.value}`);
							}
							testFunction = test;
						} else {
							// Default to truthiness of first argument
							testFunction = (...x: AnyRuntimeValue[]) => x[0].__bool__().value;
						}

						// Filter the array using the test function
						const filtered = (operand.value as AttributeContainer[]).filter((item) => {
							const a = item.value.get(attr.value);
							const result = a ? testFunction(a, value) : false;
							return select ? result : !result;
						});

						return new ArrayValue(filtered);
					}
					case "map": {
						// Accumulate kwargs
						const [, kwargs] = this.evaluateArguments(filter.args, environment);

						if (kwargs.has("attribute")) {
							// Mapping on attributes
							const attr = kwargs.get("attribute");
							if (!(attr instanceof StringValue)) {
								throw new Error("attribute must be a string");
							}
							const defaultValue = kwargs.get("default");
							const mapped = operand.value.map((item) => {
								if (!isAttributeContainer(item)) {
									throw new Error("items in map must be an object");
								}

								const value = getAttributeValue(item, attr.value);
								return value instanceof UndefinedValue ? (defaultValue ?? new UndefinedValue()) : value;
							});
							return new ArrayValue(mapped);
						} else {
							throw new Error("`map` expressions without `attribute` set are not currently supported.");
						}
					}
				}
				throw new Error(`Unknown ArrayValue filter: ${filterName}`);
			} else if (operand instanceof StringValue) {
				switch (filterName) {
					case "indent": {
						// https://jinja.palletsprojects.com/en/3.1.x/templates/#jinja-filters.indent
						// Return a copy of the string with each line indented by 4 spaces. The first line and blank lines are not indented by default.
						// Parameters:
						//  - width: Number of spaces, or a string, to indent by.
						//  - first: Don't skip indenting the first line.
						//  - blank: Don't skip indenting empty lines.

						const [args, kwargs] = this.evaluateArguments(filter.args, environment);

						const width = args.at(0) ?? kwargs.get("width") ?? new IntegerValue(4);
						if (!(width instanceof IntegerValue || width instanceof StringValue)) {
							throw new Error("width must be an integer or a string");
						}
						const first = args.at(1) ?? kwargs.get("first") ?? new BooleanValue(false);
						const blank = args.at(2) ?? kwargs.get("blank") ?? new BooleanValue(false);

						const lines = operand.value.split("\n");
						const indent = width instanceof StringValue ? width.value : " ".repeat(Math.max(0, width.value));
						const indented = lines.map((x, i) =>
							(!first.value && i === 0) || (!blank.value && x.length === 0) ? x : indent + x,
						);
						return new StringValue(indented.join("\n"));
					}
					case "replace": {
						const replaceFn = operand.builtins.get("replace");
						if (!(replaceFn instanceof FunctionValue)) {
							throw new Error("replace filter not available");
						}
						const [args, kwargs] = this.evaluateArguments(filter.args, environment);
						return replaceFn.value([...args, new KeywordArgumentsValue(kwargs)], environment);
					}
				}
				throw new Error(`Unknown StringValue filter: ${filterName}`);
			} else if (operand instanceof ObjectValue) {
				// Check if the filter exists in builtins for ObjectValue
				const builtin = operand.builtins.get(filterName);
				if (builtin && builtin instanceof FunctionValue) {
					return builtin.value(this.evaluateCallArguments(filter.args, environment), environment);
				}
				throw new Error(`Unknown ObjectValue filter: ${filterName}`);
			} else {
				throw new Error(`Cannot apply filter "${filterName}" to type: ${operand.type}`);
			}
		}
		throw new Error(`Unknown filter: ${filterNode.type}`);
	}

	/**
	 * Evaluates expressions following the filter operation type.
	 */
	private evaluateFilterExpression(node: FilterExpression, environment: Environment): AnyRuntimeValue {
		const operand = this.evaluate(node.operand, environment);
		return this.applyFilter(operand, node.filter, environment);
	}

	/**
	 * Evaluates expressions following the test operation type.
	 */
	private evaluateTestExpression(node: TestExpression, environment: Environment): BooleanValue {
		// For now, we only support the built-in tests
		// https://jinja.palletsprojects.com/en/3.0.x/templates/#list-of-builtin-tests
		//
		// TODO: Add support for non-identifier tests. e.g., divisibleby(number)
		const operand = this.evaluate(node.operand, environment);

		const test = environment.tests.get(node.test.value);
		if (!test) {
			throw new Error(`Unknown test: ${node.test.value}`);
		}
		const result = test(operand);
		return new BooleanValue(node.negate ? !result : result);
	}

	/**
	 * Evaluates expressions following the select operation type.
	 */
	private evaluateSelectExpression(node: SelectExpression, environment: Environment): AnyRuntimeValue {
		const predicate = this.evaluate(node.test, environment);
		if (!predicate.__bool__().value) {
			return new UndefinedValue();
		}
		return this.evaluate(node.lhs, environment);
	}

	/**
	 * Evaluates expressions following the unary operation type.
	 */
	private evaluateUnaryExpression(node: UnaryExpression, environment: Environment): AnyRuntimeValue {
		const argument = this.evaluate(node.argument, environment);

		switch (node.operator.value) {
			case "not":
				return new BooleanValue(!argument.__bool__().value);
			case "+":
			case "-": {
				const sign = node.operator.value === "-" ? -1 : 1;
				if (argument instanceof IntegerValue || argument instanceof FloatValue || argument instanceof BooleanValue) {
					const value = argument instanceof BooleanValue ? (argument.value ? 1 : 0) : argument.value;
					const result = sign * value;
					return argument instanceof FloatValue ? new FloatValue(result) : new IntegerValue(result);
				}
				throw new SyntaxError(`Unknown operator "${node.operator.value}" for ${argument.type}`);
			}
			default:
				throw new SyntaxError(`Unknown operator: ${node.operator.value}`);
		}
	}

	private evaluateTernaryExpression(node: Ternary, environment: Environment): AnyRuntimeValue {
		const cond = this.evaluate(node.condition, environment);
		return cond.__bool__().value
			? this.evaluate(node.trueExpr, environment)
			: this.evaluate(node.falseExpr, environment);
	}

	private evalProgram(program: Program, environment: Environment): StringValue {
		return this.evaluateBlock(program.body, environment);
	}

	private evaluateBlock(statements: Statement[], environment: Environment): StringValue {
		return new StringValue(this.renderBlock(statements, environment));
	}

	/**
	 * Jinja templates always evaluate to a String, so we accumulate the result of each statement into a final string.
	 */
	private renderBlock(statements: Statement[], environment: Environment): string {
		let result = "";
		for (let i = 0; i < statements.length; ++i) {
			const statement = statements[i];
			switch (statement.type) {
				// The most common statements contribute text (or nothing) directly, without an intermediate runtime value.
				case "StringLiteral":
					result += (statement as StringLiteral).value;
					break;
				case "If":
					result += this.renderIf(statement as If, environment);
					break;
				case "For":
					result += this.renderFor(statement as For, environment);
					break;
				case "Set":
					this.executeSet(statement as SetStatement, environment);
					break;
				case "Comment":
					break;
				default: {
					const evaluated = this.evaluate(statement, environment);
					if (evaluated.type !== "NullValue" && evaluated.type !== "UndefinedValue") {
						result += evaluated.toString();
					}
				}
			}
		}
		return result;
	}

	private evaluateIdentifier(node: Identifier, environment: Environment): AnyRuntimeValue {
		return environment.lookupVariable(node.value);
	}

	private evaluateCallExpression(expr: CallExpression, environment: Environment): AnyRuntimeValue {
		const args = this.evaluateCallArguments(expr.args, environment);

		const fn = this.evaluate(expr.callee, environment);
		if (fn.type !== "FunctionValue") {
			throw new Error(`Cannot call something that is not a function: got ${fn.type}`);
		}
		return (fn as FunctionValue).value(args, environment);
	}

	private evaluateSliceExpression(
		object: AnyRuntimeValue,
		expr: SliceExpression,
		environment: Environment,
	): ArrayValue | StringValue {
		if (!(object instanceof ArrayValue || object instanceof StringValue)) {
			throw new Error("Slice object must be an array or string");
		}

		const start = this.evaluate(expr.start, environment);
		const stop = this.evaluate(expr.stop, environment);
		const step = this.evaluate(expr.step, environment);

		// Validate arguments
		if (!(start instanceof IntegerValue || start instanceof UndefinedValue)) {
			throw new Error("Slice start must be numeric or undefined");
		}
		if (!(stop instanceof IntegerValue || stop instanceof UndefinedValue)) {
			throw new Error("Slice stop must be numeric or undefined");
		}
		if (!(step instanceof IntegerValue || step instanceof UndefinedValue)) {
			throw new Error("Slice step must be numeric or undefined");
		}

		if (object instanceof ArrayValue) {
			return new ArrayValue(slice(object.value, start.value, stop.value, step.value));
		} else {
			return new StringValue(slice(Array.from(object.value), start.value, stop.value, step.value).join(""));
		}
	}

	private evaluateMemberExpression(expr: MemberExpression, environment: Environment): AnyRuntimeValue {
		const object = this.evaluate(expr.object, environment);

		let property;
		if (expr.computed) {
			if (expr.property.type === "SliceExpression") {
				return this.evaluateSliceExpression(object, expr.property as SliceExpression, environment);
			} else {
				property = this.evaluate(expr.property, environment);
			}
		} else if (expr.property.type === "IntegerLiteral") {
			property = new IntegerValue((expr.property as IntegerLiteral).value);
		} else {
			property = new StringValue((expr.property as Identifier).value);
		}

		let value;
		if (isAttributeContainer(object)) {
			if (!(property instanceof StringValue)) {
				throw new Error(`Cannot access property with non-string: got ${property.type}`);
			}
			value =
				object.value.get(property.value) ??
				(object instanceof ObjectValue ? object.builtins.get(property.value) : undefined);
		} else if (object instanceof ArrayValue || object instanceof StringValue) {
			if (property instanceof IntegerValue) {
				if (object instanceof StringValue) {
					const character = object.value.at(property.value);
					value = character === undefined ? undefined : new StringValue(character);
				} else {
					value = object.value.at(property.value);
				}
			} else if (property instanceof StringValue) {
				value = object.builtins.get(property.value);
			} else {
				throw new Error(`Cannot access property with non-string/non-number: got ${property.type}`);
			}
		} else {
			if (!(property instanceof StringValue)) {
				throw new Error(`Cannot access property with non-string: got ${property.type}`);
			}
			value = object.builtins.get(property.value);
		}

		return value instanceof RuntimeValue ? value : new UndefinedValue();
	}

	private executeSet(node: SetStatement, environment: Environment): void {
		const rhs = node.value ? this.evaluate(node.value, environment) : this.evaluateBlock(node.body, environment);
		if (node.assignee.type === "Identifier") {
			const variableName = (node.assignee as Identifier).value;
			environment.setVariable(variableName, rhs);
		} else if (node.assignee.type === "TupleLiteral") {
			const tuple = node.assignee as TupleLiteral;
			if (!(rhs instanceof ArrayValue)) {
				throw new Error(`Cannot unpack non-iterable type in set: ${rhs.type}`);
			}
			const arr = rhs.value;
			if (arr.length !== tuple.value.length) {
				throw new Error(`Too ${tuple.value.length > arr.length ? "few" : "many"} items to unpack in set`);
			}
			for (let i = 0; i < tuple.value.length; ++i) {
				const elem = tuple.value[i];
				if (elem.type !== "Identifier") {
					throw new Error(`Cannot unpack to non-identifier in set: ${elem.type}`);
				}
				environment.setVariable((elem as Identifier).value, arr[i]);
			}
		} else if (node.assignee.type === "MemberExpression") {
			const member = node.assignee as MemberExpression;

			const object = this.evaluate(member.object, environment);
			if (!(object instanceof NamespaceValue)) {
				throw new Error("cannot assign attribute on non-namespace object");
			}
			if (member.property.type !== "Identifier") {
				throw new Error("Cannot assign to member with non-identifier property");
			}
			object.value.set((member.property as Identifier).value, rhs);
		} else {
			throw new Error(`Invalid LHS inside assignment expression: ${JSON.stringify(node.assignee)}`);
		}
	}

	private renderIf(node: If, environment: Environment): string {
		const test = this.evaluate(node.test, environment);
		return this.renderBlock(test.__bool__().value ? node.body : node.alternate, environment);
	}

	/**
	 * Assign the current item of a for loop to its loop variable(s).
	 */
	private bindLoopVariable(loopvar: Identifier | TupleLiteral, current: AnyRuntimeValue, scope: Environment): void {
		if (loopvar.type === "Identifier") {
			scope.setVariable((loopvar as Identifier).value, current);
		} else {
			const targets = (loopvar as TupleLiteral).value;
			const values = (current as ArrayValue).value;
			for (let j = 0; j < targets.length; ++j) {
				if (targets[j].type !== "Identifier") {
					throw new Error(`Cannot unpack non-identifier type: ${targets[j].type}`);
				}
				scope.setVariable((targets[j] as Identifier).value, values[j]);
			}
		}
	}

	private renderFor(node: For, environment: Environment): string {
		// Scope for the for loop
		const scope = new Environment(environment);

		let test, iterable;
		if (node.iterable.type === "SelectExpression") {
			const select = node.iterable as SelectExpression;
			iterable = this.evaluate(select.lhs, scope);
			test = select.test;
		} else {
			iterable = this.evaluate(node.iterable, scope);
		}

		if (!(iterable instanceof ArrayValue || iterable instanceof ObjectValue)) {
			throw new Error(`Expected iterable or object type in for loop: got ${iterable.type}`);
		}

		if (iterable instanceof ObjectValue) {
			iterable = iterable.keys();
		}

		// Validate (and, if there is a test, select) every item before the first iteration.
		const loopvar = node.loopvar;
		const candidates = iterable.value;
		let items: AnyRuntimeValue[];
		if (loopvar.type === "Identifier" && !test) {
			items = candidates.slice(); // Nothing to validate or select
		} else {
			items = [];
			for (let i = 0; i < candidates.length; ++i) {
				const current = candidates[i];

				if (loopvar.type === "TupleLiteral") {
					if (current.type !== "ArrayValue") {
						throw new Error(`Cannot unpack non-iterable type: ${current.type}`);
					}

					// check if too few or many items to unpack
					const expected = (loopvar as TupleLiteral).value.length;
					const actual = (current as ArrayValue).value.length;
					if (expected !== actual) {
						throw new Error(`Too ${expected > actual ? "few" : "many"} items to unpack`);
					}
				} else if (loopvar.type !== "Identifier") {
					throw new Error(`Invalid loop variable(s): ${loopvar.type}`);
				}

				if (test) {
					const loopScope = new Environment(scope);
					this.bindLoopVariable(loopvar, current, loopScope);

					const testValue = this.evaluate(test, loopScope);
					if (!testValue.__bool__().value) {
						continue;
					}
				}

				items.push(current);
			}
		}

		let result = "";

		let noIteration = true;
		for (let i = 0; i < items.length; ++i) {
			// Update the loop variable
			scope.setVariable(
				"loop",
				new LoopValue(
					i,
					items.length,
					i > 0 ? items[i - 1] : undefined,
					i < items.length - 1 ? items[i + 1] : undefined,
				),
			);

			// Update scope for this iteration
			this.bindLoopVariable(loopvar, items[i], scope);

			try {
				// Evaluate the body of the for loop
				result += this.renderBlock(node.body, scope);
			} catch (err) {
				if (err instanceof ContinueControl) {
					continue;
				}
				if (err instanceof BreakControl) {
					break;
				}
				throw err;
			}

			// At least one iteration took place
			noIteration = false;
		}

		// no iteration took place, so we render the default block
		if (noIteration) {
			result += this.renderBlock(node.defaultBlock, scope);
		}

		return result;
	}

	/**
	 * Bind every parameter name and special argument before evaluating defaults,
	 * preventing unbound parameters from resolving in an outer scope.
	 */
	private bindMacroArguments(
		displayName: string,
		parameters: Parameter[],
		specialArguments: Set<SpecialMacroArgument>,
		args: AnyRuntimeValue[],
		scope: Environment,
	): void {
		const positionalArguments = args.slice();
		let keywordArguments = new Map<string, AnyRuntimeValue>();
		if (positionalArguments.at(-1) instanceof KeywordArgumentsValue) {
			keywordArguments = new Map((positionalArguments.pop() as KeywordArgumentsValue).value);
		}

		const pendingDefaults: [string, Expression][] = [];
		for (let i = 0; i < parameters.length; ++i) {
			const { name, defaultValue } = getParameterDescriptor(parameters[i]);
			let value = positionalArguments[i] as AnyRuntimeValue | undefined;
			if (value === undefined && keywordArguments.has(name)) {
				value = keywordArguments.get(name);
				keywordArguments.delete(name);
			}
			if (value === undefined && defaultValue !== undefined) {
				pendingDefaults.push([name, defaultValue]);
			}
			scope.setVariable(name, value ?? new UndefinedValue());
		}

		if (specialArguments.has("kwargs")) {
			scope.setVariable("kwargs", new ObjectValue(keywordArguments));
		} else if (keywordArguments.size > 0) {
			throw new Error(`macro ${displayName} takes no keyword argument '${keywordArguments.keys().next().value}'`);
		}
		if (specialArguments.has("varargs")) {
			scope.setVariable("varargs", new ArrayValue(positionalArguments.slice(parameters.length)));
		} else if (positionalArguments.length > parameters.length) {
			throw new Error(`macro ${displayName} takes not more than ${parameters.length} argument(s)`);
		}

		for (const [name, defaultValue] of pendingDefaults) {
			scope.setVariable(name, this.evaluate(defaultValue, scope));
		}
	}

	/**
	 * See https://jinja.palletsprojects.com/en/3.1.x/templates/#macros for more information.
	 */
	private evaluateMacro(node: Macro, environment: Environment): NullValue {
		const specialArguments = getAccessedSpecialMacroArguments(node);
		environment.setVariable(
			node.name.value,
			new FunctionValue((args, callSite) => {
				// Macros are lexically scoped: the body resolves free names against the environment the
				// macro was defined in, not the one it is called from. Capturing that environment by
				// reference rather than copying it also preserves Jinja's late binding, so a name assigned
				// in the defining scope after the macro is declared is still visible to the body.
				// Only body loads need an invocation-local caller; default-only loads stay lexical.
				let parent = environment;
				if (specialArguments.has("caller")) {
					const caller = callSite[CALL_BLOCK_SCOPE] ? callSite.variables.get("caller") : undefined;
					parent = new Environment(environment);
					parent.setVariable("caller", caller ?? new UndefinedValue());
				}

				const macroScope = new Environment(parent);
				this.bindMacroArguments(`'${node.name.value}'`, node.args, specialArguments, args, macroScope);
				return this.evaluateBlock(node.body, macroScope);
			}),
		);

		// Macros are not evaluated immediately, so we return null
		return new NullValue();
	}

	private evaluateCallStatement(node: CallStatement, environment: Environment): AnyRuntimeValue {
		// Call blocks use anonymous-macro argument rules; Jinja labels them `None` in errors.
		const parameters = node.callerArgs ?? [];
		const specialArguments = getAccessedSpecialMacroArguments(node);
		const callerFn = new FunctionValue((callerArguments: AnyRuntimeValue[]) => {
			const callBlockEnv = new Environment(environment);
			this.bindMacroArguments("None", parameters, specialArguments, callerArguments, callBlockEnv);
			return this.evaluateBlock(node.body, callBlockEnv);
		});

		const [macroArgs, macroKwargs] = this.evaluateArguments(node.call.args, environment);
		macroArgs.push(new KeywordArgumentsValue(macroKwargs));
		const fn = this.evaluate(node.call.callee, environment);
		if (fn.type !== "FunctionValue") {
			throw new Error(`Cannot call something that is not a function: got ${fn.type}`);
		}
		const newEnv = new Environment(environment);
		newEnv[CALL_BLOCK_SCOPE] = true;
		newEnv.setVariable("caller", callerFn);
		return (fn as FunctionValue).value(macroArgs, newEnv);
	}

	private evaluateFilterStatement(node: FilterStatement, environment: Environment): AnyRuntimeValue {
		const rendered = this.evaluateBlock(node.body, environment);
		return this.applyFilter(rendered, node.filter, environment);
	}

	evaluate(statement: Statement | undefined, environment: Environment): AnyRuntimeValue {
		if (!statement) {
			return new UndefinedValue();
		}

		// NOTE: Cases are ordered by how often each node type is evaluated in practice.
		switch (statement.type) {
			// Expressions
			case "Identifier":
				return this.evaluateIdentifier(statement as Identifier, environment);
			case "IntegerLiteral":
				return new IntegerValue((statement as IntegerLiteral).value);
			case "BinaryExpression":
				return this.evaluateBinaryExpression(statement as BinaryExpression, environment);
			case "StringLiteral":
				return new StringValue((statement as StringLiteral).value);
			case "MemberExpression":
				return this.evaluateMemberExpression(statement as MemberExpression, environment);
			case "CallExpression":
				return this.evaluateCallExpression(statement as CallExpression, environment);
			case "FilterExpression":
				return this.evaluateFilterExpression(statement as FilterExpression, environment);
			case "TestExpression":
				return this.evaluateTestExpression(statement as TestExpression, environment);
			case "Ternary":
				return this.evaluateTernaryExpression(statement as Ternary, environment);
			case "UnaryExpression":
				return this.evaluateUnaryExpression(statement as UnaryExpression, environment);
			case "FloatLiteral":
				return new FloatValue((statement as FloatLiteral).value);
			case "ArrayLiteral":
				return new ArrayValue((statement as ArrayLiteral).value.map((x) => this.evaluate(x, environment)));
			case "TupleLiteral":
				return new TupleValue((statement as TupleLiteral).value.map((x) => this.evaluate(x, environment)));
			case "ObjectLiteral": {
				const mapping = new Map();
				for (const [key, value] of (statement as ObjectLiteral).value) {
					const evaluatedKey = this.evaluate(key, environment);
					if (!(evaluatedKey instanceof StringValue)) {
						throw new Error(`Object keys must be strings: got ${evaluatedKey.type}`);
					}
					mapping.set(evaluatedKey.value, this.evaluate(value, environment));
				}
				return new ObjectValue(mapping);
			}
			case "SelectExpression":
				return this.evaluateSelectExpression(statement as SelectExpression, environment);

			// Statements
			case "If":
				return new StringValue(this.renderIf(statement as If, environment));
			case "Set":
				this.executeSet(statement as SetStatement, environment);
				return new NullValue();
			case "For":
				return new StringValue(this.renderFor(statement as For, environment));
			case "Macro":
				return this.evaluateMacro(statement as Macro, environment);
			case "CallStatement":
				return this.evaluateCallStatement(statement as CallStatement, environment);
			case "FilterStatement":
				return this.evaluateFilterStatement(statement as FilterStatement, environment);
			case "Comment":
				return new NullValue();

			case "Break":
				throw new BreakControl();
			case "Continue":
				throw new ContinueControl();

			// Program
			case "Program":
				return this.evalProgram(statement as Program, environment);

			default:
				throw new SyntaxError(`Unknown node type: ${statement.type}`);
		}
	}
}

/**
 * Helper function to convert JavaScript values to runtime values.
 */
function convertToRuntimeValues(input: unknown): AnyRuntimeValue {
	switch (typeof input) {
		case "number":
			return Number.isInteger(input) ? new IntegerValue(input) : new FloatValue(input);
		case "string":
			return new StringValue(input);
		case "boolean":
			return new BooleanValue(input);
		case "undefined":
			return new UndefinedValue();
		case "object":
			if (input === null) {
				return new NullValue();
			} else if (Array.isArray(input)) {
				return new ArrayValue(input.map(convertToRuntimeValues));
			} else {
				return new ObjectValue(
					new Map(Object.entries(input).map(([key, value]) => [key, convertToRuntimeValues(value)])),
				);
			}
		case "function":
			// Wrap the user's function in a runtime function
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			return new FunctionValue((args, _scope) => {
				// NOTE: `_scope` is not used since it's in the global scope
				const result = input(...args.map((x) => x.value)) ?? null; // map undefined -> null
				return convertToRuntimeValues(result);
			});
		default:
			throw new Error(`Cannot convert to runtime value: ${input}`);
	}
}
