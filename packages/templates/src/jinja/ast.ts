import type { Token } from "./lexer";

/**
 * Statements do not result in a value at runtime. They contain one or more expressions internally.
 */
export class Statement {
	type = "Statement";
}

/**
 * Defines a block which contains many statements. Each chat template corresponds to one Program.
 */
export class Program extends Statement {
	type = "Program";

	/**
	 *
	 * @param {Statement[]} body
	 */
	constructor(public body: Statement[]) {
		super();
	}
}

export class If extends Statement {
	type = "If";

	/**
	 *
	 * @param {Expression} test
	 * @param {Statement[]} body
	 * @param {Statement[]} alternate
	 */
	constructor(public test: Expression, public body: Statement[], public alternate: Statement[]) {
		super();
	}
}

export class For extends Statement {
	type = "For";

	/**
	 *
	 * @param {Identifier} loopvar
	 * @param {Expression} iterable
	 * @param {Statement[]} body
	 */
	constructor(public loopvar: Identifier, public iterable: Expression, public body: Statement[]) {
		super();
	}
}

export class SetStatement extends Statement {
	// `Set` is taken
	type = "Set";
	/**
	 *
	 * @param {Expression} assignee
	 * @param {Expression} value
	 */
	constructor(public assignee: Expression, public value: Expression) {
		super();
	}
}

/**
 * Expressions will result in a value at runtime (unlike statements).
 */
export class Expression extends Statement {
	type = "Expression";
}

export class MemberExpression extends Expression {
	type = "MemberExpression";

	/**
	 *
	 * @param {Expression} object
	 * @param {Expression} property
	 * @param {boolean} computed
	 */
	constructor(public object: Expression, public property: Expression, public computed: boolean) {
		super();
	}
}

export class CallExpression extends Expression {
	type = "CallExpression";

	/**
	 *
	 * @param {Expression} callee
	 * @param {Expression[]} args
	 */
	constructor(public callee: Expression, public args: Expression[]) {
		super();
	}
}

/**
 * Represents a user-defined variable or symbol in the template.
 */
export class Identifier extends Expression {
	type = "Identifier";

	/**
	 *
	 * @param {string} value The name of the identifier
	 */
	constructor(public value: string) {
		super();
	}
}

/**
 * Abstract base class for all Literal expressions.
 * Should not be instantiated directly.
 *
 * @abstract
 * @template T
 */
class Literal<T> extends Expression {
	type = "Literal";

	/**
	 *
	 * @param {T} value
	 */
	constructor(public value: T) {
		super();
	}
}

/**
 * Represents a numeric constant in the template.
 * @extends {Literal<number>}
 */
export class NumericLiteral extends Literal<number> {
	type = "NumericLiteral";
}

/**
 * Represents a text constant in the template.
 * @extends {Literal<string>}
 */
export class StringLiteral extends Literal<string> {
	type = "StringLiteral";
	/**
	 *
	 * @param {string} value
	 */
	constructor(value: string) {
		super(value);
	}
}

/**
 * Represents a boolean constant in the template.
 * @extends {Literal<boolean>}
 */
export class BooleanLiteral extends Literal<boolean> {
	type = "BooleanLiteral";
}

/**
 * An operation with two sides, separated by an operator.
 * Note: Either side can be a Complex Expression, with order
 * of operations being determined by the operator.
 */
export class BinaryExpression extends Expression {
	type = "BinaryExpression";

	/**
	 *
	 * @param {Token} operator
	 * @param {Expression} left
	 * @param {Expression} right
	 */
	constructor(public operator: Token, public left: Expression, public right: Expression) {
		super();
	}
}

/**
 * An operation with one side (operator on the left).
 */
export class UnaryExpression extends Expression {
	type = "UnaryExpression";

	/**
	 *
	 * @param {Token} operator
	 * @param {Expression} argument
	 */
	constructor(public operator: Token, public argument: Expression) {
		super();
	}
}
