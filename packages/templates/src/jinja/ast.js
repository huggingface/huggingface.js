import { Token } from "./lexer";

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
	constructor(body) {
		super();
		this.body = body;
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
	constructor(test, body, alternate) {
		super();
		this.test = test;
		this.body = body;
		this.alternate = alternate;
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
	constructor(loopvar, iterable, body) {
		super();
		this.loopvar = loopvar;
		this.iterable = iterable;
		this.body = body;
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
	constructor(assignee, value) {
		super();
		this.assignee = assignee;
		this.value = value;
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
	constructor(object, property, computed) {
		super();
		this.object = object;
		this.property = property;
		this.computed = computed; // true: object[property], false: object.property
	}
}

export class CallExpression extends Expression {
	type = "CallExpression";

	/**
	 *
	 * @param {Expression} callee
	 * @param {Expression[]} args
	 */
	constructor(callee, args) {
		super();
		this.callee = callee;
		this.args = args;
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
	constructor(value) {
		super();
		this.value = value;
	}
}

/**
 * Abstract base class for all Literal expressions.
 * Should not be instantiated directly.
 *
 * @abstract
 * @template T
 */
class Literal extends Expression {
	type = "Literal";

	/**
	 *
	 * @param {T} value
	 */
	constructor(value) {
		super();
		this.value = value;
	}
}

/**
 * Represents a numeric constant in the template.
 * @extends {Literal<number>}
 */
export class NumericLiteral extends Literal {
	type = "NumericLiteral";
}

/**
 * Represents a text constant in the template.
 * @extends {Literal<string>}
 */
export class StringLiteral extends Literal {
	type = "StringLiteral";
	/**
	 *
	 * @param {string} value
	 */
	constructor(value) {
		super(value);
	}
}

/**
 * Represents a boolean constant in the template.
 * @extends {Literal<boolean>}
 */
export class BooleanLiteral extends Literal {
	type = "BooleanLiteral";
}

// TODO use
// export class CallExpressionNode extends Expression {
//     type = 'CallExpression';

//     /**
//      *
//      * @param {string} identifier
//      * @param {Statement} argument
//      */
//     constructor(identifier, argument) {
//         super();
//         this.identifier = identifier;
//         this.argument = argument;
//     }
// }

/**
 * An operation with two sides, seperated by a operator.
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
	constructor(operator, left, right) {
		super();
		this.operator = operator;
		this.left = left;
		this.right = right;
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
	constructor(operator, argument) {
		super();
		this.operator = operator;
		this.argument = argument;
	}
}
