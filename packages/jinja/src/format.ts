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
	LogicalNegationExpression,
	SliceExpression,
	KeywordArgumentExpression,
	CallStatement,
	FilterStatement,
	SpreadExpression,
	Ternary,
} from "./ast";

const NEWLINE = "\n";
const OPEN_STATEMENT = "{%- ";
const CLOSE_STATEMENT = " -%}";

const OPERATOR_PRECEDENCE: Record<string, number> = {
	MultiplicativeBinaryOperator: 2,
	AdditiveBinaryOperator: 1,
	ComparisonBinaryOperator: 0,
	Ternary: -1,
};

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
	for (let i = 1; i < clauses.length; i++) {
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
	const args = node.args.map(formatExpression).join(", ");
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
	const params =
		node.callerArgs && node.callerArgs.length > 0 ? `(${node.callerArgs.map(formatExpression).join(", ")})` : "";
	const callExpr = formatExpression(node.call, -1);
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
			: formatExpression(node.filter as CallExpression, -1);
	let out = pad + createStatement("filter", spec) + NEWLINE;
	out += formatStatements(node.body, depth + 1, indentStr) + NEWLINE;
	out += pad + createStatement("endfilter");
	return out;
}

function formatExpression(node: Expression, parentPrec: number = -1): string {
	switch (node.type) {
		case "SpreadExpression": {
			const n = node as SpreadExpression;
			return `*${formatExpression(n.argument, -1)}`;
		}
		case "Identifier":
			return (node as Identifier).value;
		case "IntegerLiteral":
			return `${(node as IntegerLiteral).value}`;
		case "FloatLiteral":
			return `${(node as FloatLiteral).value}`;
		case "StringLiteral":
			return JSON.stringify((node as StringLiteral).value);
		case "BinaryExpression": {
			const n = node as BinaryExpression;
			let thisPrecedence = OPERATOR_PRECEDENCE[n.operator.type] ?? 0;
			if (n.operator.value === "or") {
				thisPrecedence = -1;
			}
			const left = formatExpression(n.left, thisPrecedence);
			const right = formatExpression(n.right, thisPrecedence + 1);
			const expr = `${left} ${n.operator.value} ${right}`;
			return thisPrecedence < parentPrec ? `(${expr})` : expr;
		}
		case "UnaryExpression": {
			const n = node as UnaryExpression;
			const val = n.operator.value + (n.operator.value === "not" ? " " : "") + formatExpression(n.argument, Infinity);
			return val;
		}
		case "LogicalNegationExpression":
			return `not ${formatExpression((node as LogicalNegationExpression).argument, Infinity)}`;
		case "CallExpression": {
			const n = node as CallExpression;
			const args = n.args.map((a) => formatExpression(a, -1)).join(", ");
			return `${formatExpression(n.callee, -1)}(${args})`;
		}
		case "MemberExpression": {
			const n = node as MemberExpression;
			let obj = formatExpression(n.object, -1);
			// only wrap if it's not a simple or chained access/call
			if (!["Identifier", "MemberExpression", "CallExpression"].includes(n.object.type)) {
				obj = `(${obj})`;
			}
			let prop = formatExpression(n.property, -1);
			if (!n.computed && n.property.type !== "Identifier") {
				prop = `(${prop})`;
			}
			return n.computed ? `${obj}[${prop}]` : `${obj}.${prop}`;
		}
		case "FilterExpression": {
			const n = node as FilterExpression;
			const operand = formatExpression(n.operand, Infinity);
			if (n.filter.type === "CallExpression") {
				return `${operand} | ${formatExpression(n.filter, -1)}`;
			}
			return `${operand} | ${(n.filter as Identifier).value}`;
		}
		case "SelectExpression": {
			const n = node as SelectExpression;
			return `${formatExpression(n.lhs, -1)} if ${formatExpression(n.test, -1)}`;
		}
		case "TestExpression": {
			const n = node as TestExpression;
			return `${formatExpression(n.operand, -1)} is${n.negate ? " not" : ""} ${n.test.value}`;
		}
		case "ArrayLiteral":
		case "TupleLiteral": {
			const elems = ((node as ArrayLiteral | TupleLiteral).value as Expression[]).map((e) => formatExpression(e, -1));
			const brackets = node.type === "ArrayLiteral" ? "[]" : "()";
			return `${brackets[0]}${elems.join(", ")}${brackets[1]}`;
		}
		case "ObjectLiteral": {
			const entries = Array.from((node as ObjectLiteral).value.entries()).map(
				([k, v]) => `${formatExpression(k, -1)}: ${formatExpression(v, -1)}`
			);
			return `{ ${entries.join(", ")} }`;
		}
		case "SliceExpression": {
			const n = node as SliceExpression;
			const s = n.start ? formatExpression(n.start, -1) : "";
			const t = n.stop ? formatExpression(n.stop, -1) : "";
			const st = n.step ? `:${formatExpression(n.step, -1)}` : "";
			return `${s}:${t}${st}`;
		}
		case "KeywordArgumentExpression": {
			const n = node as KeywordArgumentExpression;
			return `${n.key.value}=${formatExpression(n.value, -1)}`;
		}
		case "Ternary": {
			const n = node as Ternary;
			const expr = `${formatExpression(n.trueExpr, OPERATOR_PRECEDENCE.Ternary)} if ${formatExpression(
				n.condition,
				OPERATOR_PRECEDENCE.Ternary
			)} else ${formatExpression(n.falseExpr, OPERATOR_PRECEDENCE.Ternary)}`;
			return OPERATOR_PRECEDENCE.Ternary < parentPrec ? `(${expr})` : expr;
		}
		default:
			throw new Error(`Unknown expression type: ${node.type}`);
	}
}
