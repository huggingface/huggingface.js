import type {
	Program,
	Statement,
	Comment,
	If,
	For,
	SetStatement,
	Macro,
	Expression,
	MemberExpression,
	CallExpression,
	Identifier,
	FloatLiteral,
	IntegerLiteral,
	StringLiteral,
	ArrayLiteral,
	TupleLiteral,
	ObjectLiteral,
	BinaryExpression,
	FilterExpression,
	SelectExpression,
	TestExpression,
	UnaryExpression,
	SliceExpression,
	KeywordArgumentExpression,
	CallStatement,
	FilterStatement,
	SpreadExpression,
	KeywordSpreadExpression,
	Ternary,
} from "./ast";

const NEWLINE = "\n";
const OPEN_STATEMENT = "{%- ";
const CLOSE_STATEMENT = " -%}";
const PRECEDENCE = Object.freeze({
	CONDITIONAL: 0, // a if b else c
	LOGICAL_OR: 1, // or
	LOGICAL_AND: 2, // and
	LOGICAL_NOT: 3, // not a
	COMPARISON: 4, // == != < <= > >= in, not in
	ADDITIVE: 5, // + -
	MULTIPLICATIVE: 6, // * / // %
	EXPONENTIATION: 7, // **
	TEST: 8, // is
	FILTER: 9, // |
	UNARY_SIGN: 10, // -a +a
	ATOM: 11, // literals, identifiers, calls, member accesses
});

function getBinaryOperatorPrecedence(expr: BinaryExpression): number {
	switch (expr.operator.type) {
		case "ExponentiationBinaryOperator":
			return PRECEDENCE.EXPONENTIATION;
		case "MultiplicativeBinaryOperator":
			return PRECEDENCE.MULTIPLICATIVE;
		case "AdditiveBinaryOperator":
			return PRECEDENCE.ADDITIVE;
		case "ComparisonBinaryOperator":
			return PRECEDENCE.COMPARISON;
		case "Identifier":
			if (expr.operator.value === "and") {
				return PRECEDENCE.LOGICAL_AND;
			}
			if (expr.operator.value === "in" || expr.operator.value === "not in") {
				return PRECEDENCE.COMPARISON;
			}
			return PRECEDENCE.LOGICAL_OR;
	}
	return PRECEDENCE.LOGICAL_OR;
}

function getPrecedence(node: Expression): number {
	switch (node.type) {
		case "SelectExpression":
		case "Ternary":
			return PRECEDENCE.CONDITIONAL;
		case "BinaryExpression":
			return getBinaryOperatorPrecedence(node as BinaryExpression);
		case "UnaryExpression":
			return (node as UnaryExpression).operator.value === "not" ? PRECEDENCE.LOGICAL_NOT : PRECEDENCE.UNARY_SIGN;
		case "TestExpression":
			return PRECEDENCE.TEST;
		case "FilterExpression":
			return PRECEDENCE.FILTER;
		default:
			return PRECEDENCE.ATOM;
	}
}

/**
 * Formats an expression appearing in an operand slot that the parser reads at
 * `minPrecedence`, parenthesizing the expression when it binds more loosely.
 */
function formatOperand(node: Expression, minPrecedence: number): string {
	const expr = formatExpression(node);
	return getPrecedence(node) < minPrecedence ? `(${expr})` : expr;
}

export function format(program: Program, indent: string | number = "\t"): string {
	const indentStr = typeof indent === "number" ? " ".repeat(indent) : indent;
	const body = formatStatements(program.body, 0, indentStr);
	return body.replace(/\n$/, "");
}

function createStatement(...text: string[]): string {
	return OPEN_STATEMENT + text.join(" ") + CLOSE_STATEMENT;
}

function formatStatements(stmts: Statement[], depth: number, indentStr: string): string {
	return stmts.map((stmt) => formatStatement(stmt, depth, indentStr)).join(NEWLINE);
}

function formatExpressionList(expressions: Expression[]): string {
	return expressions.map((expression) => formatExpression(expression)).join(", ");
}

function formatStatement(node: Statement, depth: number, indentStr: string): string {
	const pad = indentStr.repeat(depth);
	switch (node.type) {
		case "Program":
			return formatStatements((node as Program).body, depth, indentStr);
		case "If":
			return formatIf(node as If, depth, indentStr);
		case "For":
			return formatFor(node as For, depth, indentStr);
		case "Set":
			return formatSet(node as SetStatement, depth, indentStr);
		case "Macro":
			return formatMacro(node as Macro, depth, indentStr);
		case "Break":
			return pad + createStatement("break");
		case "Continue":
			return pad + createStatement("continue");
		case "CallStatement":
			return formatCallStatement(node as CallStatement, depth, indentStr);
		case "FilterStatement":
			return formatFilterStatement(node as FilterStatement, depth, indentStr);
		case "Comment":
			return pad + "{# " + (node as Comment).value + " #}";
		default:
			return pad + "{{- " + formatExpression(node as Expression) + " -}}";
	}
}

function formatIf(node: If, depth: number, indentStr: string): string {
	const pad = indentStr.repeat(depth);

	const clauses: { test: Expression; body: Statement[] }[] = [];
	let current: If | undefined = node;
	while (current) {
		clauses.push({ test: current.test, body: current.body });
		if (current.alternate.length === 1 && current.alternate[0].type === "If") {
			current = current.alternate[0] as If;
		} else {
			break;
		}
	}

	// IF
	let out =
		pad +
		createStatement("if", formatExpression(clauses[0].test)) +
		NEWLINE +
		formatStatements(clauses[0].body, depth + 1, indentStr);

	// ELIF(s)
	for (let i = 1; i < clauses.length; ++i) {
		out +=
			NEWLINE +
			pad +
			createStatement("elif", formatExpression(clauses[i].test)) +
			NEWLINE +
			formatStatements(clauses[i].body, depth + 1, indentStr);
	}

	// ELSE
	if (current && current.alternate.length > 0) {
		out +=
			NEWLINE + pad + createStatement("else") + NEWLINE + formatStatements(current.alternate, depth + 1, indentStr);
	}

	// ENDIF
	out += NEWLINE + pad + createStatement("endif");
	return out;
}

function formatFor(node: For, depth: number, indentStr: string): string {
	const pad = indentStr.repeat(depth);
	let formattedIterable = "";
	if (node.iterable.type === "SelectExpression") {
		// Handle special case: e.g., `for x in [1, 2, 3] if x > 2`
		const n = node.iterable as SelectExpression;
		formattedIterable = `${formatExpression(n.lhs)} if ${formatExpression(n.test)}`;
	} else {
		formattedIterable = formatExpression(node.iterable);
	}
	let out =
		pad +
		createStatement("for", formatExpression(node.loopvar), "in", formattedIterable) +
		NEWLINE +
		formatStatements(node.body, depth + 1, indentStr);

	if (node.defaultBlock.length > 0) {
		out +=
			NEWLINE + pad + createStatement("else") + NEWLINE + formatStatements(node.defaultBlock, depth + 1, indentStr);
	}

	out += NEWLINE + pad + createStatement("endfor");
	return out;
}

function formatSet(node: SetStatement, depth: number, indentStr: string): string {
	const pad = indentStr.repeat(depth);
	const left = formatExpression(node.assignee);
	const right = node.value ? formatExpression(node.value) : "";

	const value = pad + createStatement("set", `${left}${node.value ? " = " + right : ""}`);
	if (node.body.length === 0) {
		return value;
	}
	return (
		value + NEWLINE + formatStatements(node.body, depth + 1, indentStr) + NEWLINE + pad + createStatement("endset")
	);
}

function formatMacro(node: Macro, depth: number, indentStr: string): string {
	const pad = indentStr.repeat(depth);
	const args = formatExpressionList(node.args);
	return (
		pad +
		createStatement("macro", `${node.name.value}(${args})`) +
		NEWLINE +
		formatStatements(node.body, depth + 1, indentStr) +
		NEWLINE +
		pad +
		createStatement("endmacro")
	);
}

function formatCallStatement(node: CallStatement, depth: number, indentStr: string): string {
	const pad = indentStr.repeat(depth);
	const params = node.callerArgs && node.callerArgs.length > 0 ? `(${formatExpressionList(node.callerArgs)})` : "";
	const callExpr = formatExpression(node.call);
	let out = pad + createStatement(`call${params}`, callExpr) + NEWLINE;
	out += formatStatements(node.body, depth + 1, indentStr) + NEWLINE;
	out += pad + createStatement("endcall");
	return out;
}

function formatFilterStatement(node: FilterStatement, depth: number, indentStr: string): string {
	const pad = indentStr.repeat(depth);
	const spec =
		node.filter.type === "Identifier"
			? (node.filter as Identifier).value
			: formatExpression(node.filter as CallExpression);
	let out = pad + createStatement("filter", spec) + NEWLINE;
	out += formatStatements(node.body, depth + 1, indentStr) + NEWLINE;
	out += pad + createStatement("endfilter");
	return out;
}

function formatExpression(node: Expression): string {
	switch (node.type) {
		case "SpreadExpression": {
			const n = node as SpreadExpression;
			return `*${formatExpression(n.argument)}`;
		}
		case "KeywordSpreadExpression": {
			const n = node as KeywordSpreadExpression;
			return `**${formatExpression(n.argument)}`;
		}
		case "Identifier":
			return (node as Identifier).value;
		case "IntegerLiteral":
			return `${(node as IntegerLiteral).value}`;
		case "FloatLiteral": {
			const value = (node as FloatLiteral).value;
			if (Object.is(value, -0)) {
				return "-0.0";
			}
			return value % 1 === 0 ? value.toFixed(1) : value.toString();
		}
		case "StringLiteral":
			return JSON.stringify((node as StringLiteral).value);
		case "BinaryExpression": {
			const n = node as BinaryExpression;
			const thisPrecedence = getBinaryOperatorPrecedence(n);
			// All binary operators are left-associative, so the right operand slot is the next-tighter level.
			const left = formatOperand(n.left, thisPrecedence);
			const right = formatOperand(n.right, thisPrecedence + 1);
			return `${left} ${n.operator.value} ${right}`;
		}
		case "UnaryExpression": {
			const n = node as UnaryExpression;
			// Keep chained unary operators bare, but parenthesize any other compound operand for readability.
			const operandPrecedence = n.argument.type === "UnaryExpression" ? getPrecedence(n) : PRECEDENCE.ATOM;
			return n.operator.value + (n.operator.value === "not" ? " " : "") + formatOperand(n.argument, operandPrecedence);
		}
		case "CallExpression": {
			const n = node as CallExpression;
			const args = formatExpressionList(n.args);
			return `${formatExpression(n.callee)}(${args})`;
		}
		case "MemberExpression": {
			const n = node as MemberExpression;
			const obj = formatOperand(n.object, PRECEDENCE.ATOM);
			let prop = formatExpression(n.property);
			if (!n.computed && n.property.type !== "Identifier" && n.property.type !== "IntegerLiteral") {
				prop = `(${prop})`;
			}
			return n.computed ? `${obj}[${prop}]` : `${obj}.${prop}`;
		}
		case "FilterExpression": {
			const n = node as FilterExpression;
			const operand = formatOperand(n.operand, PRECEDENCE.FILTER);
			if (n.filter.type === "CallExpression") {
				return `${operand} | ${formatExpression(n.filter)}`;
			}
			return `${operand} | ${(n.filter as Identifier).value}`;
		}
		case "SelectExpression": {
			const n = node as SelectExpression;
			return `${formatOperand(n.lhs, PRECEDENCE.LOGICAL_OR)} if ${formatOperand(n.test, PRECEDENCE.LOGICAL_OR)}`;
		}
		case "TestExpression": {
			const n = node as TestExpression;
			return `${formatOperand(n.operand, PRECEDENCE.TEST)} is${n.negate ? " not" : ""} ${n.test.value}`;
		}
		case "ArrayLiteral":
		case "TupleLiteral": {
			const elems = formatExpressionList((node as ArrayLiteral | TupleLiteral).value as Expression[]);
			const brackets = node.type === "ArrayLiteral" ? "[]" : "()";
			return `${brackets[0]}${elems}${brackets[1]}`;
		}
		case "ObjectLiteral": {
			const entries = Array.from((node as ObjectLiteral).value.entries()).map(
				([k, v]) => `${formatExpression(k)}: ${formatExpression(v)}`,
			);
			return `{${entries.join(", ")}}`;
		}
		case "SliceExpression": {
			const n = node as SliceExpression;
			const s = n.start ? formatExpression(n.start) : "";
			const t = n.stop ? formatExpression(n.stop) : "";
			const st = n.step ? `:${formatExpression(n.step)}` : "";
			return `${s}:${t}${st}`;
		}
		case "KeywordArgumentExpression": {
			const n = node as KeywordArgumentExpression;
			return `${n.key.value}=${formatExpression(n.value)}`;
		}
		case "Ternary": {
			const n = node as Ternary;
			// `else` is right-recursive, so a conditional in the false branch stays bare.
			return `${formatOperand(n.trueExpr, PRECEDENCE.LOGICAL_OR)} if ${formatOperand(
				n.condition,
				PRECEDENCE.LOGICAL_OR,
			)} else ${formatOperand(n.falseExpr, PRECEDENCE.CONDITIONAL)}`;
		}
		default:
			throw new Error(`Unknown expression type: ${node.type}`);
	}
}
