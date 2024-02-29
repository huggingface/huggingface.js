import { describe, expect, it } from "vitest";

import { tokenize } from "../src/lexer";
import { parse } from "../src/parser";
import { Environment, Interpreter } from "../src/runtime";

const TEST_STRINGS = {
	// Text nodes
	NO_TEMPLATE: `Hello world!`,
	TEXT_NODES: `0{{ 'A' }}1{{ 'B' }}{{ 'C' }}2{{ 'D' }}3`,

	// Logical operators
	LOGICAL_AND: `{{ true and true }}{{ true and false }}{{ false and true }}{{ false and false }}`,
	LOGICAL_OR: `{{ true or true }}{{ true or false }}{{ false or true }}{{ false or false }}`,
	LOGICAL_NOT: `{{ not true }}{{ not false }}`,
	LOGICAL_NOT_NOT: `{{ not not true }}{{ not not false }}`,
	LOGICAL_AND_OR: `{{ true and true or false }}{{ true and false or true }}{{ false and true or true }}{{ false and false or true }}{{ false and false or false }}`,
	LOGICAL_AND_NOT: `{{ true and not true }}{{ true and not false }}{{ false and not true }}{{ false and not false }}`,
	LOGICAL_OR_NOT: `{{ true or not true }}{{ true or not false }}{{ false or not true }}{{ false or not false }}`,
	LOGICAL_COMBINED: `{{ 1 == 2 and 2 == 2 }}{{ 1 == 2 or 2 == 2}}`,

	// If statements
	IF_ONLY: `{% if 1 == 1 %}{{ 'A' }}{% endif %}{{ 'B' }}`,
	IF_ELSE_ONLY: `{% if 1 == 2 %}{{ 'A' }}{% else %}{{ 'B' }}{% endif %}{{ 'C' }}`,
	IF_ELIF_ELSE: `{% if 1 == 2 %}{{ 'A' }}{{ 'B' }}{{ 'C' }}{% elif 1 == 2 %}{{ 'D' }}{% elif 1 == 3 %}{{ 'E' }}{{ 'F' }}{% else %}{{ 'G' }}{{ 'H' }}{{ 'I' }}{% endif %}{{ 'J' }}`,
	NESTED_STATEMENTS: `{% set a = 0 %}{% set b = 0 %}{% set c = 0 %}{% set d = 0 %}{% if 1 == 1 %}{% set a = 2 %}{% set b = 3 %}{% elif 1 == 2 %}{% set c = 4 %}{% else %}{% set d = 5 %}{% endif %}{{ a }}{{ b }}{{ c }}{{ d }}`,

	// For loops
	FOR_LOOP: `{% for message in messages %}{{ message['content'] }}{% endfor %}`,

	// Set variables
	VARIABLES: `{% set x = 'Hello' %}{% set y = 'World' %}{{ x + ' ' + y }}`,

	// Numbers
	NUMBERS: `|{{ 5 }}|{{ -5 }}|{{ add(3, -1) }}|{{ (3 - 1) + (a - 5) - (a + 5)}}|`,

	// Binary expressions
	BINOP_EXPR: `{{ 1 % 2 }}{{ 1 < 2 }}{{ 1 > 2 }}{{ 1 >= 2 }}{{ 2 <= 2 }}{{ 2 == 2 }}{{ 2 != 3 }}{{ 2 + 3 }}`,

	// Strings
	STRINGS: `{{ 'Bye' }}{{ bos_token + '[INST] ' }}`,

	// Function calls
	FUNCTIONS: `{{ func() }}{{ func(apple) }}{{ func(x, 'test', 2, false) }}`,

	// Object properties
	PROPERTIES: `{{ obj.x + obj.y }}{{ obj['x'] + obj.y }}`,

	// Object methods
	OBJ_METHODS: `{{ obj.x(x, y) }}{{ ' ' + obj.x() + ' ' }}{{ obj.z[x](x, y) }}`,
	STRING_METHODS: `{{ '  A  '.strip() }}{% set x = '  B  ' %}{{ x.strip() }}{% set y = ' aBcD ' %}{{ y.upper() }}{{ y.lower() }}`,
	STRING_METHODS_2: `{{ 'test test'.title() }}`,

	// String indexing and slicing
	STRING_SLICING: `|{{ x[0] }}|{{ x[:] }}|{{ x[:3] }}|{{ x[1:4] }}|{{ x[1:-1] }}|{{ x[1::2] }}|{{ x[5::-1] }}|`,

	// Array indexing and slicing
	ARRAY_SLICING: `|{{ strings[0] }}|{% for s in strings[:] %}{{ s }}{% endfor %}|{% for s in strings[:3] %}{{ s }}{% endfor %}|{% for s in strings[1:4] %}{{ s }}{% endfor %}|{% for s in strings[1:-1] %}{{ s }}{% endfor %}|{% for s in strings[1::2] %}{{ s }}{% endfor %}|{% for s in strings[5::-1] %}{{ s }}{% endfor %}|`,

	// Membership operators
	MEMBERSHIP: `|{{ 0 in arr }}|{{ 1 in arr }}|{{ true in arr }}|{{ false in arr }}|{{ 'a' in arr }}|{{ 'b' in arr }}|`,
	MEMBERSHIP_NEGATION_1: `|{{ not 0 in arr }}|{{ not 1 in arr }}|{{ not true in arr }}|{{ not false in arr }}|{{ not 'a' in arr }}|{{ not 'b' in arr }}|`,
	MEMBERSHIP_NEGATION_2: `|{{ 0 not in arr }}|{{ 1 not in arr }}|{{ true not in arr }}|{{ false not in arr }}|{{ 'a' not in arr }}|{{ 'b' not in arr }}|`,

	// Escaped characters
	ESCAPED_CHARS: `{{ '\\n' }}{{ '\\t' }}{{ '\\'' }}{{ '\\"' }}{{ '\\\\' }}{{ '|\\n|\\t|\\'|\\"|\\\\|' }}`,

	// Substring inclusion
	SUBSTRING_INCLUSION: `|{{ '' in 'abc' }}|{{ 'a' in 'abc' }}|{{ 'd' in 'abc' }}|{{ 'ab' in 'abc' }}|{{ 'ac' in 'abc' }}|{{ 'abc' in 'abc' }}|{{ 'abcd' in 'abc' }}|`,

	// Filter operator
	FILTER_OPERATOR: `{{ arr | length }}{{ 1 + arr | length }}{{ 2 + arr | sort | length }}{{ (arr | sort)[0] }}`,
	FILTER_OPERATOR_2: `|{{ 'abc' | length }}|{{ 'aBcD' | upper }}|{{ 'aBcD' | lower }}|{{ 'test test' | capitalize}}|{{ 'test test' | title }}|{{ ' a b ' | trim }}|{{ '  A  B  ' | trim | lower | length }}|`,
	FILTER_OPERATOR_3: `|{{ -1 | abs }}|{{ 1 | abs }}|`,

	// Logical operators between non-Booleans
	BOOLEAN_NUMERICAL: `|{{ 1 and 2 }}|{{ 1 and 0 }}|{{ 0 and 1 }}|{{ 0 and 0 }}|{{ 1 or 2 }}|{{ 1 or 0 }}|{{ 0 or 1 }}|{{ 0 or 0 }}|{{ not 1 }}|{{ not 0 }}|`,
	BOOLEAN_STRINGS: `|{{ 'a' and 'b' }}|{{ 'a' and '' }}|{{ '' and 'a' }}|{{ '' and '' }}|{{ 'a' or 'b' }}|{{ 'a' or '' }}|{{ '' or 'a' }}|{{ '' or '' }}|{{ not 'a' }}|{{ not '' }}|`,
	BOOLEAN_MIXED: `|{{ true and 1 }}|{{ true and 0 }}|{{ false and 1 }}|{{ false and 0 }}|{{ true or 1 }}|{{ true or 0 }}|{{ false or 1 }}|{{ false or 0 }}|`,
	BOOLEAN_MIXED_2: `|{{ true and '' }}|{{ true and 'a' }}|{{ false or '' }}|{{ false or 'a' }}|{{ '' and true }}|{{ 'a' and true }}|{{ '' or false }}|{{ 'a' or false }}|`,
	BOOLEAN_MIXED_IF: `{% if '' %}{{ 'A' }}{% endif %}{% if 'a' %}{{ 'B' }}{% endif %}{% if true and '' %}{{ 'C' }}{% endif %}{% if true and 'a' %}{{ 'D' }}{% endif %}`,
};

const TEST_PARSED = {
	// Text nodes
	NO_TEMPLATE: [{ value: "Hello world!", type: "Text" }],
	TEXT_NODES: [
		{ value: "0", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "A", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "1", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "B", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "C", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "2", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "D", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "3", type: "Text" },
	],

	// Logical operators
	LOGICAL_AND: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	LOGICAL_OR: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	LOGICAL_NOT: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	LOGICAL_NOT_NOT: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	LOGICAL_AND_OR: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	LOGICAL_AND_NOT: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	LOGICAL_OR_NOT: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	LOGICAL_COMBINED: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "and", type: "And" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "or", type: "Or" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],

	// If statements
	IF_ONLY: [
		{ value: "{%", type: "OpenStatement" },
		{ value: "if", type: "If" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "A", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endif", type: "EndIf" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "B", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	IF_ELSE_ONLY: [
		{ value: "{%", type: "OpenStatement" },
		{ value: "if", type: "If" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "A", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "else", type: "Else" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "B", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endif", type: "EndIf" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "C", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	IF_ELIF_ELSE: [
		{ value: "{%", type: "OpenStatement" },
		{ value: "if", type: "If" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "A", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "B", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "C", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "elif", type: "ElseIf" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "D", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "elif", type: "ElseIf" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "3", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "E", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "F", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "else", type: "Else" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "G", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "H", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "I", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endif", type: "EndIf" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "J", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],
	NESTED_STATEMENTS: [
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "a", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "b", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "c", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "d", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "if", type: "If" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "a", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "b", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "3", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "elif", type: "ElseIf" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "c", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "4", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "else", type: "Else" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "d", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "5", type: "NumericLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endif", type: "EndIf" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "b", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "c", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "d", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
	],

	// For loops
	FOR_LOOP: [
		{ value: "{%", type: "OpenStatement" },
		{ value: "for", type: "For" },
		{ value: "message", type: "Identifier" },
		{ value: "in", type: "In" },
		{ value: "messages", type: "Identifier" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "message", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "content", type: "StringLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endfor", type: "EndFor" },
		{ value: "%}", type: "CloseStatement" },
	],

	// Set variables
	VARIABLES: [
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "x", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "Hello", type: "StringLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "y", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "World", type: "StringLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: " ", type: "StringLiteral" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "y", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
	],

	// Numbers
	NUMBERS: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "5", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "-5", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "add", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: "3", type: "NumericLiteral" },
		{ value: ",", type: "Comma" },
		{ value: "-1", type: "NumericLiteral" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "(", type: "OpenParen" },
		{ value: "3", type: "NumericLiteral" },
		{ value: "-", type: "AdditiveBinaryOperator" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ")", type: "CloseParen" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "(", type: "OpenParen" },
		{ value: "a", type: "Identifier" },
		{ value: "-", type: "AdditiveBinaryOperator" },
		{ value: "5", type: "NumericLiteral" },
		{ value: ")", type: "CloseParen" },
		{ value: "-", type: "AdditiveBinaryOperator" },
		{ value: "(", type: "OpenParen" },
		{ value: "a", type: "Identifier" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "5", type: "NumericLiteral" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],

	// Binary expressions
	BINOP_EXPR: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "%", type: "MultiplicativeBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "<", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ">", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ">=", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "<=", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "==", type: "ComparisonBinaryOperator" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "!=", type: "ComparisonBinaryOperator" },
		{ value: "3", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "3", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],

	// Strings
	STRINGS: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "Bye", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "bos_token", type: "Identifier" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "[INST] ", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],

	// Function calls
	FUNCTIONS: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "func", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "func", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: "apple", type: "Identifier" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "func", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: "x", type: "Identifier" },
		{ value: ",", type: "Comma" },
		{ value: "test", type: "StringLiteral" },
		{ value: ",", type: "Comma" },
		{ value: "2", type: "NumericLiteral" },
		{ value: ",", type: "Comma" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
	],

	// Object properties
	PROPERTIES: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "obj", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "x", type: "Identifier" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "obj", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "y", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "obj", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "x", type: "StringLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "obj", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "y", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
	],

	// Object methods
	OBJ_METHODS: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "obj", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "x", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: "x", type: "Identifier" },
		{ value: ",", type: "Comma" },
		{ value: "y", type: "Identifier" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: " ", type: "StringLiteral" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "obj", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "x", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: ")", type: "CloseParen" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: " ", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "obj", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "z", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "x", type: "Identifier" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "(", type: "OpenParen" },
		{ value: "x", type: "Identifier" },
		{ value: ",", type: "Comma" },
		{ value: "y", type: "Identifier" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
	],

	// String methods
	STRING_METHODS: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "  A  ", type: "StringLiteral" },
		{ value: ".", type: "Dot" },
		{ value: "strip", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "x", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: "  B  ", type: "StringLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "strip", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "set", type: "Set" },
		{ value: "y", type: "Identifier" },
		{ value: "=", type: "Equals" },
		{ value: " aBcD ", type: "StringLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "y", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "upper", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "y", type: "Identifier" },
		{ value: ".", type: "Dot" },
		{ value: "lower", type: "Identifier" },
		{ value: "(", type: "OpenParen" },
		{ value: ")", type: "CloseParen" },
		{ value: "}}", type: "CloseExpression" },
	],
	STRING_METHODS_2: [
		{ value: '{{', type: 'OpenExpression' },
		{ value: 'test test', type: 'StringLiteral' },
		{ value: '.', type: 'Dot' },
		{ value: 'title', type: 'Identifier' },
		{ value: '(', type: 'OpenParen' },
		{ value: ')', type: 'CloseParen' },
		{ value: '}}', type: 'CloseExpression' }
	],

	// String indexing and slicing
	STRING_SLICING: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: ":", type: "Colon" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: ":", type: "Colon" },
		{ value: "3", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ":", type: "Colon" },
		{ value: "4", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ":", type: "Colon" },
		{ value: "-1", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ":", type: "Colon" },
		{ value: ":", type: "Colon" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "x", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "5", type: "NumericLiteral" },
		{ value: ":", type: "Colon" },
		{ value: ":", type: "Colon" },
		{ value: "-1", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],

	// Array indexing and slicing
	ARRAY_SLICING: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "strings", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "for", type: "For" },
		{ value: "s", type: "Identifier" },
		{ value: "in", type: "In" },
		{ value: "strings", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: ":", type: "Colon" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "s", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endfor", type: "EndFor" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "|", type: "Text" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "for", type: "For" },
		{ value: "s", type: "Identifier" },
		{ value: "in", type: "In" },
		{ value: "strings", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: ":", type: "Colon" },
		{ value: "3", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "s", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endfor", type: "EndFor" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "|", type: "Text" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "for", type: "For" },
		{ value: "s", type: "Identifier" },
		{ value: "in", type: "In" },
		{ value: "strings", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ":", type: "Colon" },
		{ value: "4", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "s", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endfor", type: "EndFor" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "|", type: "Text" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "for", type: "For" },
		{ value: "s", type: "Identifier" },
		{ value: "in", type: "In" },
		{ value: "strings", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ":", type: "Colon" },
		{ value: "-1", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "s", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endfor", type: "EndFor" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "|", type: "Text" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "for", type: "For" },
		{ value: "s", type: "Identifier" },
		{ value: "in", type: "In" },
		{ value: "strings", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "1", type: "NumericLiteral" },
		{ value: ":", type: "Colon" },
		{ value: ":", type: "Colon" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "s", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endfor", type: "EndFor" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "|", type: "Text" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "for", type: "For" },
		{ value: "s", type: "Identifier" },
		{ value: "in", type: "In" },
		{ value: "strings", type: "Identifier" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "5", type: "NumericLiteral" },
		{ value: ":", type: "Colon" },
		{ value: ":", type: "Colon" },
		{ value: "-1", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "s", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endfor", type: "EndFor" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "|", type: "Text" },
	],

	// Membership operators
	MEMBERSHIP: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "b", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],
	MEMBERSHIP_NEGATION_1: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "a", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "b", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],
	MEMBERSHIP_NEGATION_2: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "not in", type: "NotIn" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "not in", type: "NotIn" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "not in", type: "NotIn" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "not in", type: "NotIn" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "not in", type: "NotIn" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "b", type: "StringLiteral" },
		{ value: "not in", type: "NotIn" },
		{ value: "arr", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],

	// Escaped characters
	ESCAPED_CHARS: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "\n", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "\t", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "'", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: '"', type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "\\", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: `|\n|\t|'|"|\\|`, type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
	],

	// Substring inclusion
	SUBSTRING_INCLUSION: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "d", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "ab", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "ac", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "abcd", type: "StringLiteral" },
		{ value: "in", type: "In" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],

	// Filter operator
	FILTER_OPERATOR: [
		{ value: "{{", type: "OpenExpression" },
		{ value: "arr", type: "Identifier" },
		{ value: "|", type: "Pipe" },
		{ value: "length", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "arr", type: "Identifier" },
		{ value: "|", type: "Pipe" },
		{ value: "length", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "+", type: "AdditiveBinaryOperator" },
		{ value: "arr", type: "Identifier" },
		{ value: "|", type: "Pipe" },
		{ value: "sort", type: "Identifier" },
		{ value: "|", type: "Pipe" },
		{ value: "length", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "(", type: "OpenParen" },
		{ value: "arr", type: "Identifier" },
		{ value: "|", type: "Pipe" },
		{ value: "sort", type: "Identifier" },
		{ value: ")", type: "CloseParen" },
		{ value: "[", type: "OpenSquareBracket" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "]", type: "CloseSquareBracket" },
		{ value: "}}", type: "CloseExpression" },
	],
	FILTER_OPERATOR_2: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "abc", type: "StringLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "length", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "aBcD", type: "StringLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "upper", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "aBcD", type: "StringLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "lower", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "test test", type: "StringLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "capitalize", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "test test", type: "StringLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "title", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: " a b ", type: "StringLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "trim", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "  A  B  ", type: "StringLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "trim", type: "Identifier" },
		{ value: "|", type: "Pipe" },
		{ value: "lower", type: "Identifier" },
		{ value: "|", type: "Pipe" },
		{ value: "length", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],
	FILTER_OPERATOR_3: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "-1", type: "NumericLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "abs", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "|", type: "Pipe" },
		{ value: "abs", type: "Identifier" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],

	// Logical operators between non-Booleans
	BOOLEAN_NUMERICAL: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "and", type: "And" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "and", type: "And" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "and", type: "And" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "and", type: "And" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "or", type: "Or" },
		{ value: "2", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "or", type: "Or" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "or", type: "Or" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "or", type: "Or" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],
	BOOLEAN_STRINGS: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "and", type: "And" },
		{ value: "b", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "and", type: "And" },
		{ value: "", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "", type: "StringLiteral" },
		{ value: "and", type: "And" },
		{ value: "a", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "", type: "StringLiteral" },
		{ value: "and", type: "And" },
		{ value: "", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "or", type: "Or" },
		{ value: "b", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "or", type: "Or" },
		{ value: "", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "", type: "StringLiteral" },
		{ value: "or", type: "Or" },
		{ value: "a", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "", type: "StringLiteral" },
		{ value: "or", type: "Or" },
		{ value: "", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "a", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "not", type: "UnaryOperator" },
		{ value: "", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],
	BOOLEAN_MIXED: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "1", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "0", type: "NumericLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],
	BOOLEAN_MIXED_2: [
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "a", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "or", type: "Or" },
		{ value: "a", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "", type: "StringLiteral" },
		{ value: "and", type: "And" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "and", type: "And" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "", type: "StringLiteral" },
		{ value: "or", type: "Or" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "a", type: "StringLiteral" },
		{ value: "or", type: "Or" },
		{ value: "false", type: "BooleanLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "|", type: "Text" },
	],
	BOOLEAN_MIXED_IF: [
		{ value: "{%", type: "OpenStatement" },
		{ value: "if", type: "If" },
		{ value: "", type: "StringLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "A", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endif", type: "EndIf" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "if", type: "If" },
		{ value: "a", type: "StringLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "B", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endif", type: "EndIf" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "if", type: "If" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "", type: "StringLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "C", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endif", type: "EndIf" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "if", type: "If" },
		{ value: "true", type: "BooleanLiteral" },
		{ value: "and", type: "And" },
		{ value: "a", type: "StringLiteral" },
		{ value: "%}", type: "CloseStatement" },
		{ value: "{{", type: "OpenExpression" },
		{ value: "D", type: "StringLiteral" },
		{ value: "}}", type: "CloseExpression" },
		{ value: "{%", type: "OpenStatement" },
		{ value: "endif", type: "EndIf" },
		{ value: "%}", type: "CloseStatement" },
	],
};

const TEST_CONTEXT = {
	// Text nodes
	NO_TEMPLATE: {},
	TEXT_NODES: {},

	// Logical operators
	LOGICAL_AND: {},
	LOGICAL_OR: {},
	LOGICAL_NOT: {},
	LOGICAL_NOT_NOT: {},
	LOGICAL_AND_OR: {},
	LOGICAL_AND_NOT: {},
	LOGICAL_OR_NOT: {},
	LOGICAL_COMBINED: {},

	// If statements
	IF_ONLY: {},
	IF_ELSE_ONLY: {},
	IF_ELIF_ELSE: {},
	NESTED_STATEMENTS: {},

	// For loops
	FOR_LOOP: {
		messages: [
			{ role: "user", content: "A" },
			{ role: "assistant", content: "B" },
			{ role: "user", content: "C" },
		],
	},

	// Set variables
	VARIABLES: {},

	// Numbers
	NUMBERS: {
		a: 0,
		add: (x, y) => x + y,
	},

	// Binary expressions
	BINOP_EXPR: {},

	// Strings
	STRINGS: {
		bos_token: "<s>",
	},

	// Function calls
	FUNCTIONS: {
		x: 10,
		apple: "apple",
		func: (...args) => args.length,
	},

	// Object properties
	PROPERTIES: {
		obj: { x: 10, y: 20 },
	},

	// Object methods
	OBJ_METHODS: {
		x: "A",
		y: "B",
		obj: {
			x: (...args) => args.join(""),
			z: {
				A: (...args) => args.join("_"),
			},
		},
	},

	// String methods
	STRING_METHODS: {},
	STRING_METHODS_2: {},

	// String indexing and slicing
	STRING_SLICING: {
		x: "0123456789",
	},

	// Array indexing and slicing
	ARRAY_SLICING: {
		strings: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
	},

	// Membership operators
	MEMBERSHIP: {
		arr: [0, true, "a"],
	},
	MEMBERSHIP_NEGATION_1: {
		arr: [0, true, "a"],
	},
	MEMBERSHIP_NEGATION_2: {
		arr: [0, true, "a"],
	},

	// Escaped characters
	ESCAPED_CHARS: {},

	// Substring inclusion
	SUBSTRING_INCLUSION: {},

	// Filter operator
	FILTER_OPERATOR: {
		arr: [3, 2, 1],
	},
	FILTER_OPERATOR_2: {},
	FILTER_OPERATOR_3: {},

	// Logical operators between non-Booleans
	BOOLEAN_NUMERICAL: {},
	BOOLEAN_STRINGS: {},
	BOOLEAN_MIXED: {},
	BOOLEAN_MIXED_2: {},
	BOOLEAN_MIXED_IF: {},
};

const EXPECTED_OUTPUTS = {
	// Text nodes
	NO_TEMPLATE: `Hello world!`,
	TEXT_NODES: `0A1BC2D3`,

	// Logical operators
	LOGICAL_AND: `truefalsefalsefalse`,
	LOGICAL_OR: `truetruetruefalse`,
	LOGICAL_NOT: `falsetrue`,
	LOGICAL_NOT_NOT: `truefalse`,
	LOGICAL_AND_OR: `truetruetruetruefalse`,
	LOGICAL_AND_NOT: `falsetruefalsefalse`,
	LOGICAL_OR_NOT: `truetruefalsetrue`,
	LOGICAL_COMBINED: `falsetrue`,

	// If statements
	IF_ONLY: "AB",
	IF_ELSE_ONLY: "BC",
	IF_ELIF_ELSE: "GHIJ",
	NESTED_STATEMENTS: "2300",

	// For loops
	FOR_LOOP: "ABC",

	// Set variables
	VARIABLES: "Hello World",

	// Numbers
	NUMBERS: "|5|-5|2|-8|",

	// Binary expressions
	BINOP_EXPR: "1truefalsefalsetruetruetrue5",

	// Strings
	STRINGS: "Bye<s>[INST] ",

	// Function calls
	FUNCTIONS: "014",

	// Object properties
	PROPERTIES: "3030",

	// Object methods
	OBJ_METHODS: "AB  A_B",
	STRING_METHODS: "AB ABCD  abcd ",
	STRING_METHODS_2: "Test Test",

	// String indexing and slicing
	STRING_SLICING: "|0|0123456789|012|123|12345678|13579|543210|",

	// Array indexing and slicing
	ARRAY_SLICING: "|0|0123456789|012|123|12345678|13579|543210|",

	// Membership operators
	MEMBERSHIP: "|true|false|true|false|true|false|",
	MEMBERSHIP_NEGATION_1: "|false|true|false|true|false|true|",
	MEMBERSHIP_NEGATION_2: "|false|true|false|true|false|true|",

	// Escaped characters
	// NOTE: Since `trim_blocks` is enabled, we remove the first newline after the template tag,
	// meaning the first newline in the output is not present
	ESCAPED_CHARS: `\t'"\\|\n|\t|'|"|\\|`,

	// Substring inclusion
	SUBSTRING_INCLUSION: `|true|true|false|true|false|true|false|`,

	// Filter operator
	FILTER_OPERATOR: `3451`,
	FILTER_OPERATOR_2: `|3|ABCD|abcd|Test test|Test Test|a b|4|`,
	FILTER_OPERATOR_3: `|1|1|`,

	// Logical operators between non-Booleans
	BOOLEAN_NUMERICAL: `|2|0|0|0|1|1|1|0|false|true|`,
	BOOLEAN_STRINGS: `|b||||a|a|a||false|true|`,
	BOOLEAN_MIXED: `|1|0|false|false|true|true|1|0|`,
	BOOLEAN_MIXED_2: `||a||a||true|false|a|`,
	BOOLEAN_MIXED_IF: `BD`,
};

describe("Templates", () => {
	describe("Lexing", () => {
		it("should tokenize an input string", () => {
			for (const [name, text] of Object.entries(TEST_STRINGS)) {
				const tokens = tokenize(text);

				if (!TEST_PARSED[name]) {
					throw new Error(`Test case "${name}" not found`);
				}

				if (tokens.length !== TEST_PARSED[name].length) {
					console.log(tokens);
				}
				// console.log(tokens);
				expect(tokens).toMatchObject(TEST_PARSED[name]);
			}
		});

		// TODO add failure cases
	});

	describe("Parsing and intepretation", () => {
		const AST_CACHE = new Map();
		it("should generate an AST", () => {
			// NOTE: In this test case, we just check that no error occurs
			for (const [name, text] of Object.entries(TEST_PARSED)) {
				const ast = parse(text);
				AST_CACHE.set(name, ast);
			}
		});

		it("should interpret an AST", () => {
			for (const [name, ast] of AST_CACHE.entries()) {
				if (TEST_CONTEXT[name] === undefined || EXPECTED_OUTPUTS[name] === undefined) {
					console.warn(`Skipping test case "${name}" due to missing context or expected output`);
					continue;
				}

				const env = new Environment();
				// Declare global variables
				env.set("false", false);
				env.set("true", true);

				// Add user-defined variables
				for (const [key, value] of Object.entries(TEST_CONTEXT[name])) {
					env.set(key, value);
				}

				const interpreter = new Interpreter(env);
				const result = interpreter.run(ast);
				expect(result.value).toEqual(EXPECTED_OUTPUTS[name]);
			}
		});
	});
});

describe("Error checking", () => {
	describe("Lexing errors", () => {
		it("Missing closing curly brace", () => {
			const text = "{{ variable";
			expect(() => tokenize(text)).toThrowError();
		});
		it("Unclosed string literal", () => {
			const text = `{{ 'unclosed string }}`;
			expect(() => tokenize(text)).toThrowError();
		});

		it("Unexpected character", () => {
			const text = "{{ invalid ! invalid }}";
			expect(() => tokenize(text)).toThrowError();
		});
	});

	describe("Parsing errors", () => {
		it("Unclosed statement", () => {
			const text = "{{ variable }}{{";
			const tokens = tokenize(text);
			expect(() => parse(tokens)).toThrowError();
		});

		it("Unclosed expression", () => {
			const text = "{% if condition %}\n    Content";
			const tokens = tokenize(text);
			expect(() => parse(tokens)).toThrowError();
		});

		it("Unmatched control structure", () => {
			const text = "{% if condition %}\n    Content\n{% endif %}\n{% endfor %}";
			const tokens = tokenize(text);
			expect(() => parse(tokens)).toThrowError();
		});

		it("Missing variable in for loop", () => {
			const text = "{% for %}\n    Content\n{% endfor %}";
			const tokens = tokenize(text);
			expect(() => parse(tokens)).toThrowError();
		});

		it("Unclosed parentheses in expression", () => {
			const text = "{{ (variable + 1 }}";
			const tokens = tokenize(text);
			expect(() => parse(tokens)).toThrowError();
		});

		it("Invalid variable name", () => {
			const text = "{{ 1variable }}";
			const tokens = tokenize(text);
			expect(() => parse(tokens)).toThrowError();
		});

		it("Invalid control structure usage", () => {
			const text = "{% if %}Content{% endif %}";
			const tokens = tokenize(text);
			expect(() => parse(tokens)).toThrowError();
		});
	});

	describe("Runtime errors", () => {
		it("Undefined variable", () => {
			const env = new Environment();
			const interpreter = new Interpreter(env);
			const tokens = tokenize("{{ undefined_variable }}");
			const ast = parse(tokens);
			expect(() => interpreter.run(ast)).toThrowError();
		});

		it("Undefined attribute access", () => {
			const env = new Environment();
			const interpreter = new Interpreter(env);
			const tokens = tokenize("{{ object.undefined_attribute }}");
			const ast = parse(tokens);
			expect(() => interpreter.run(ast)).toThrowError();
		});

		it("Undefined function call", () => {
			const env = new Environment();
			const interpreter = new Interpreter(env);
			const tokens = tokenize("{{ undefined_function() }}");
			const ast = parse(tokens);
			expect(() => interpreter.run(ast)).toThrowError();
		});

		it("Incorrect function call", () => {
			const env = new Environment();
			env.set("true", true);

			const interpreter = new Interpreter(env);
			const tokens = tokenize("{{ true() }}");
			const ast = parse(tokens);
			expect(() => interpreter.run(ast)).toThrowError();
		});

		it("Looping over non-iterable", () => {
			const env = new Environment();
			const interpreter = new Interpreter(env);
			env.set("non_iterable", 10);

			const tokens = tokenize("{% for item in non_iterable %}{{ item }}{% endfor %}");
			const ast = parse(tokens);
			expect(() => interpreter.run(ast)).toThrowError();
		});

		it("Invalid variable assignment", () => {
			const env = new Environment();
			const interpreter = new Interpreter(env);

			const tokens = tokenize("{% set 42 = variable %}");
			const ast = parse(tokens);
			expect(() => interpreter.run(ast)).toThrowError();
		});
	});
});
