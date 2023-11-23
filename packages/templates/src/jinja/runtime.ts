import type {
	Statement,
	Program,
	If,
	For,
	SetStatement,
	MemberExpression,
	CallExpression,
	Identifier,
	BinaryExpression,
	UnaryExpression,
} from "./ast";
import { NumericLiteral, StringLiteral, BooleanLiteral } from "./ast";

/**
 * Abstract base class for all Runtime values.
 * Should not be instantiated directly.
 *
 * @abstract
 * @template T
 */
class RuntimeValue<T = any> {
	type = "RuntimeValue";
	value: T;

	/**
	 * A collection of built-in functions for this type.
	 * @type {Map<string, RuntimeValue>}
	 */
	builtins = new Map<string, RuntimeValue>();

	/**
	 * Creates a new RuntimeValue.
	 * @param {T} value
	 */
	constructor(value: T = undefined as any) {
		this.value = value;
	}
}

/**
 * Represents a numeric value at runtime.
 * @extends {RuntimeValue<number>}
 */
class NumericValue extends RuntimeValue<number> {
	type = "NumericValue";
}

/**
 * Represents a string value at runtime.
 * @extends {RuntimeValue<string>}
 */
class StringValue extends RuntimeValue<string> {
	type = "StringValue";

	builtins = new Map<string, RuntimeValue>([
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
		["length", new NumericValue(this.value.length)],
	]);
}

/**
 * Represents a boolean value at runtime.
 * @extends {RuntimeValue<boolean>}
 */
class BooleanValue extends RuntimeValue<boolean> {
	type = "BooleanValue";
}

/**
 * Represents an Object value at runtime.
 * @extends {RuntimeValue<Map<string, RuntimeValue>>}
 */
class ObjectValue extends RuntimeValue<Map<string, RuntimeValue>> {
	type = "ObjectValue";
}

/**
 * Represents an Array value at runtime.
 * @extends {RuntimeValue<RuntimeValue[]>}
 */
class ArrayValue extends RuntimeValue<RuntimeValue[]> {
	type = "ArrayValue";
}

/**
 * Represents a Function value at runtime.
 * @extends {RuntimeValue<(...args: RuntimeValue[]) => RuntimeValue>}
 */
class FunctionValue extends RuntimeValue<(...args: RuntimeValue[]) => RuntimeValue> {
	type = "FunctionValue";
}

/**
 * Represents a Null value at runtime.
 * @extends {RuntimeValue<null>}
 */
class NullValue extends RuntimeValue<null> {
	type = "NullValue";
}

/**
 * Represents the current environment (scope) at runtime.
 */
export class Environment {
	parent?: Environment;
	variables: Map<string, RuntimeValue>;

	/**
	 *
	 * @param {Environment?} parent
	 */
	constructor(parent?: Environment) {
		this.parent = parent;

		/**
		 * @property The variables declared in this environment.
		 * @type {Map<string, RuntimeValue>}
		 */
		this.variables = new Map();
	}

	/**
	 * Set the value of a variable in the current environment.
	 * @param {string} name The name of the variable.
	 * @param {any} value The value to set.
	 * @returns {RuntimeValue}
	 */
	set(name: string, value: any): RuntimeValue {
		return this.declareVariable(name, convertToRuntimeValues(value));
	}

	/**
	 *
	 * @param {string} name
	 * @param {RuntimeValue} value
	 * @returns {RuntimeValue}
	 * @private
	 */
	private declareVariable(name: string, value: RuntimeValue): RuntimeValue {
		if (this.variables.has(name)) {
			throw new SyntaxError(`Variable already declared: ${name}`);
		}
		this.variables.set(name, value);
		return value;
	}

	/**
	 *
	 * @param {string} name
	 * @param {RuntimeValue} value
	 * @returns {RuntimeValue}
	 * @private
	 */
	private assignVariable(name: string, value: RuntimeValue): RuntimeValue {
		const env = this.resolve(name);
		env.variables.set(name, value);
		return value;
	}

	/**
	 * Declare if doesn't exist, assign otherwise.
	 * @param {string} name
	 * @param {RuntimeValue} value
	 * @returns {RuntimeValue}
	 */
	setVariable(name: string, value: RuntimeValue): RuntimeValue {
		let env: Environment = this;
		try {
			env = this.resolve(name);
		} catch {}
		env.variables.set(name, value);
		return value;
	}

	/**
	 * Resolve the environment in which the variable is declared.
	 * @param {string} name The name of the variable.
	 * @returns {Environment} The environment in which the variable is declared.
	 * @private
	 */
	private resolve(name: string): Environment {
		if (this.variables.has(name)) {
			return this;
		}

		// Traverse scope chain
		if (this.parent) {
			return this.parent.resolve(name);
		}

		throw new Error(`Unknown variable: ${name}`);
	}

	/**
	 *
	 * @param {string} name
	 * @returns {RuntimeValue}
	 */
	lookupVariable(name: string): RuntimeValue {
		return this.resolve(name).variables.get(name);
	}
}

export class Interpreter {
	global: Environment;

	/**
	 *
	 * @param {Environment?} env
	 */
	constructor(env?: Environment) {
		this.global = env ?? new Environment();
	}

	/**
	 * Run the program.
	 * @param {Program} program
	 * @returns {RuntimeValue}
	 */
	run(program: Program): RuntimeValue {
		return this.evaluate(program, this.global);
	}

	/**
	 * Evaulates expressions following the binary operation type.
	 * @param {BinaryExpression} node
	 * @param {Environment} environment
	 * @returns {RuntimeValue}
	 * @private
	 */
	private evaluateBinaryExpression(node: BinaryExpression, environment: Environment): RuntimeValue {
		const left = this.evaluate(node.left, environment);
		const right = this.evaluate(node.right, environment);

		if (left instanceof NumericValue && right instanceof NumericValue) {
			// Evaulate pure numeric operations with binary operators.
			switch (node.operator.value) {
				// Arithmetic operators
				case "+":
					return new NumericValue(left.value + right.value);
				case "-":
					return new NumericValue(left.value - right.value);
				case "*":
					return new NumericValue(left.value * right.value);
				case "/":
					return new NumericValue(left.value / right.value);
				case "%":
					return new NumericValue(left.value % right.value);

				// Comparison operators
				case "<":
					return new BooleanValue(left.value < right.value);
				case ">":
					return new BooleanValue(left.value > right.value);
				case ">=":
					return new BooleanValue(left.value >= right.value);
				case "<=":
					return new BooleanValue(left.value <= right.value);
				case "==":
					return new BooleanValue(left.value == right.value);
				case "!=":
					return new BooleanValue(left.value != right.value);

				default:
					throw new SyntaxError(`Unknown operator: ${node.operator.value}`);
			}
		} else if (left instanceof BooleanValue && right instanceof BooleanValue) {
			// Logical operators
			switch (node.operator.value) {
				case "and":
					return new BooleanValue(left.value && right.value);
				case "or":
					return new BooleanValue(left.value || right.value);
				case "!=":
					return new BooleanValue(left.value != right.value);
				default:
					throw new SyntaxError(`Unknown operator: ${node.operator.value}`);
			}
		} else {
			switch (node.operator.value) {
				case "+":
					return new StringValue(left.value + right.value);
				case "==":
					return new BooleanValue(left.value == right.value);
				case "!=":
					return new BooleanValue(left.value != right.value);
				default:
					throw new SyntaxError(`Unknown operator: ${node.operator.value}`);
			}
		}
	}

	/**
	 * Evaulates expressions following the unary operation type.
	 * @param {UnaryExpression} node
	 * @param {Environment} environment
	 * @returns {RuntimeValue}
	 * @private
	 */
	private evaluateUnaryExpression(node: UnaryExpression, environment: Environment): RuntimeValue {
		const argument = this.evaluate(node.argument, environment);

		switch (node.operator.value) {
			case "not":
				return new BooleanValue(!argument.value);
			default:
				throw new SyntaxError(`Unknown operator: ${node.operator.value}`);
		}
	}

	/**
	 *
	 * @param {Program} program
	 * @param {Environment} environment
	 * @returns {RuntimeValue}
	 * @private
	 */
	private evalProgram(program: Program, environment: Environment): RuntimeValue {
		return this.evaluateBlock(program.body, environment);
	}

	/**
	 *
	 * @param {Statement[]} statements
	 * @param {Environment} environment
	 * @returns {StringValue}
	 * @private
	 */
	private evaluateBlock(statements: Statement[], environment: Environment): StringValue {
		// Jinja templates always evaluate to a String,
		// so we accumulate the result of each statement into a final string

		let result = "";
		for (const statement of statements) {
			const lastEvaluated = this.evaluate(statement, environment);

			if (lastEvaluated.type !== "NullValue") {
				result += lastEvaluated.value;
			}
		}

		return new StringValue(result);
	}

	/**
	 *
	 * @param {Identifier} node
	 * @param {Environment} environment
	 * @returns {RuntimeValue}
	 * @private
	 */
	private evaluateIdentifier(node: Identifier, environment: Environment): RuntimeValue {
		return environment.lookupVariable(node.value);
	}

	/**
	 *
	 * @param {CallExpression} expr
	 * @param {Environment} environment
	 * @returns {RuntimeValue}
	 * @private
	 */
	private evaluateCallExpression(expr: CallExpression, environment: Environment): RuntimeValue {
		const args = expr.args.map((arg) => this.evaluate(arg, environment));
		const fn = this.evaluate(expr.callee, environment);
		if (fn.type !== "FunctionValue") {
			throw new Error(`Cannot call something that is not a function: got ${fn.type}`);
		}
		return (fn as FunctionValue).value(args, environment);
	}

	/**
	 *
	 * @param {MemberExpression} expr
	 * @param {Environment} environment
	 * @private
	 */
	private evaluateMemberExpression(expr: MemberExpression, environment: Environment): RuntimeValue {
		const property = expr.computed ? this.evaluate(expr.property, environment) : new StringValue(expr.property.value);

		if (property.type !== "StringValue") {
			// TODO integer indexing for arrays
			throw new Error(`Cannot access property with non-string: got ${property.type}`);
		}

		const object = this.evaluate(expr.object, environment);

		const value =
			object instanceof ObjectValue
				? object.value.get(property.value) ?? object.builtins.get(property.value)
				: object.builtins.get(property.value);

		if (!(value instanceof RuntimeValue)) {
			throw new Error(`${object.type} has no property '${property.value}'`);
		}
		return value;
	}

	/**
	 *
	 * @param {SetStatement} node
	 * @param {Environment} environment
	 * @returns {NullValue}
	 * @private
	 */
	private evaluateSet(node: SetStatement, environment: Environment): NullValue {
		if (node.assignee.type !== "Identifier") {
			throw new Error(`Invalid LHS inside assignment expression: ${JSON.stringify(node.assignee)}`);
		}

		const variableName = (node.assignee as Identifier).value;
		environment.setVariable(variableName, this.evaluate(node.value, environment));
		return new NullValue();
	}

	/**
	 *
	 * @param {If} node
	 * @param {Environment} environment
	 * @returns {RuntimeValue}
	 * @private
	 */
	private evaluateIf(node: If, environment: Environment): RuntimeValue {
		const test = this.evaluate(node.test, environment);
		if (!["BooleanValue", "BooleanLiteral"].includes(test.type)) {
			throw new Error(`Expected boolean expression in if statement: got ${test.type}`);
		}
		return this.evaluateBlock(test.value ? node.body : node.alternate, environment);
	}

	/**
	 *
	 * @param {For} node
	 * @param {Environment} environment
	 * @returns {RuntimeValue}
	 * @private
	 */
	private evaluateFor(node: For, environment: Environment): RuntimeValue {
		// Scope for the for loop
		const scope = new Environment(environment);

		const iterable = this.evaluate(node.iterable, scope);
		if (iterable.type !== "ArrayValue") {
			throw new Error(`Expected object in for loop: got ${iterable.type}`);
		}

		let result = "";

		for (let i = 0; i < iterable.value.length; ++i) {
			// Update the loop variable
			// TODO: Only create object once, then update value?
			scope.setVariable(
				"loop",
				new ObjectValue(
					new Map(
						(
							[
								["index", new NumericValue(i + 1)],
								["index0", new NumericValue(i)],
								["first", new BooleanValue(i === 0)],
								["last", new BooleanValue(i === iterable.value.length - 1)],
								["length", new NumericValue(iterable.value.length)],
							] as [string, RuntimeValue][]
						).map(([key, value]) => [key, value])
					)
				)
			);

			// For this iteration, set the loop variable to the current element
			scope.setVariable(node.loopvar.value, iterable.value[i]);

			// Evaluate the body of the for loop
			const evaluated = this.evaluateBlock(node.body, scope);
			result += evaluated.value;
		}

		return new StringValue(result);
	}
	/**
	 *
	 * @param {Statement} statement
	 * @param {Environment} environment
	 * @returns {RuntimeValue}
	 * @private
	 */
	evaluate(statement: Statement, environment: Environment): RuntimeValue {
		switch (statement.type) {
			// Program
			case "Program":
				return this.evalProgram(/** @type {Program} */ statement, environment);

			// Statements
			case "Set":
				return this.evaluateSet(/** @type {SetStatement} */ statement, environment);
			case "If":
				return this.evaluateIf(/** @type {If} */ statement, environment);
			case "For":
				return this.evaluateFor(/** @type {For} */ statement, environment);

			// Expressions
			case "NumericLiteral":
				return new NumericValue(Number(/** @type {NumericLiteral} */ statement.value));
			case "StringLiteral":
				return new StringValue(/** @type {StringLiteral} */ statement.value);
			case "BooleanLiteral":
				return new BooleanValue(/** @type {BooleanLiteral} */ statement.value);
			case "Identifier":
				return this.evaluateIdentifier(/** @type {Identifier} */ statement, environment);
			case "CallExpression":
				return this.evaluateCallExpression(/** @type {CallExpression} */ statement, environment);
			case "MemberExpression":
				return this.evaluateMemberExpression(/** @type {MemberExpression} */ statement, environment);

			case "UnaryExpression":
				return this.evaluateUnaryExpression(/** @type {UnaryExpression} */ statement, environment);
			case "BinaryExpression":
				return this.evaluateBinaryExpression(/** @type {BinaryExpression} */ statement, environment);

			default:
				throw new SyntaxError(`Unknown node type: ${statement.type}`);
		}
	}
}

/**
 * Helper function to convert JavaScript values to runtime values.
 * @param {any} input
 * @returns {RuntimeValue}
 */
function convertToRuntimeValues(input: any): RuntimeValue {
	switch (typeof input) {
		case "number":
			return new NumericValue(input);
		case "string":
			return new StringValue(input);
		case "boolean":
			return new BooleanValue(input);
		case "object":
			if (input === null) {
				return new NullValue();
			} else if (Array.isArray(input)) {
				return new ArrayValue(input.map(convertToRuntimeValues));
			} else {
				return new ObjectValue(
					new Map(Object.entries(input).map(([key, value]) => [key, convertToRuntimeValues(value)]))
				);
			}
		case "function":
			// Wrap the user's function in a runtime function
			return new FunctionValue((args, scope) => {
				// NOTE: `scope` is not used since it's in the global scope
				const result = input(...args.map((x) => x.value)) ?? null; // map undefined -> null
				return convertToRuntimeValues(result);
			});
		default:
			throw new Error(`Cannot convert to runtime value: ${input}`);
	}
}
