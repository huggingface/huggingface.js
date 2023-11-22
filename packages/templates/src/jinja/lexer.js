

/**
 * Represents tokens that our language understands in parsing.
 */
export const TOKEN_TYPES = Object.freeze({
    Text: 'Text', // The text between Jinja statements or expressions

    NumericLiteral: 'NumericLiteral',
    BooleanLiteral: 'BooleanLiteral',
    StringLiteral: 'StringLiteral',
    Identifier: 'Identifier',
    Equals: 'Equals',
    OpenParen: 'OpenParen',
    CloseParen: 'CloseParen',
    OpenStatement: 'OpenStatement', // {%
    CloseStatement: 'CloseStatement', // %}
    OpenExpression: 'OpenExpression', // {{
    CloseExpression: 'CloseExpression', // }}
    OpenSquareBracket: 'OpenSquareBracket', // [
    CloseSquareBracket: 'CloseSquareBracket', // ]
    Comma: 'Comma',
    Dot: 'Dot',

    CallOperator: 'CallOperator', // ()

    AdditiveBinaryOperator: 'AdditiveBinaryOperator',
    MultiplicativeBinaryOperator: 'MultiplicativeBinaryOperator',
    ComparisonBinaryOperator: 'ComparisonBinaryOperator',
    UnaryOperator: 'UnaryOperator', // not

    Set: 'Set',
    If: 'If',
    For: 'For',
    In: 'In',
    Else: 'Else',
    EndIf: 'EndIf',
    ElseIf: 'ElseIf',
    EndFor: 'EndFor',

    // Logical operators
    And: 'And',
    Or: 'Or',

    // TODO Add unary operators
})

/**
 * @typedef {keyof typeof TOKEN_TYPES} TokenType
 */

/**
 * Constant lookup for keywords and known identifiers + symbols.
 */
const KEYWORDS = Object.freeze({
    set: TOKEN_TYPES.Set,
    for: TOKEN_TYPES.For,
    in: TOKEN_TYPES.In,
    if: TOKEN_TYPES.If,
    else: TOKEN_TYPES.Else,
    endif: TOKEN_TYPES.EndIf,
    elif: TOKEN_TYPES.ElseIf,
    endfor: TOKEN_TYPES.EndFor,

    and: TOKEN_TYPES.And,
    or: TOKEN_TYPES.Or,
    not: TOKEN_TYPES.UnaryOperator,
})

/**
 * Represents a single token in the template.
 */
export class Token {
    /**
     * Constructs a new Token.
     * @param {string} value The raw value as seen inside the source code.
     * @param {TokenType} type The type of token.
     */
    constructor(value, type) {
        this.value = value;
        this.type = type;
    }
}

function isWord(char) {
    return /\w/.test(char);
}

function isInteger(char) {
    return /[0-9]/.test(char);
}

/**
 * Generate a list of tokens from a source string.
 * @param {string} source
 * @returns {Token[]} 
 */
export function tokenize(source) {
    /** @type {Token[]} */
    const tokens = [];
    const src = Array.from(source);

    let cursorPosition = 0;

    // Build each token until end of input
    while (cursorPosition < src.length) {

        // First, consume all text that is outside of a Jinja statement or expression
        const lastTokenType = tokens.at(-1)?.type;
        if (lastTokenType === undefined || lastTokenType === TOKEN_TYPES.CloseStatement || lastTokenType === TOKEN_TYPES.CloseExpression) {
            let text = '';
            while (
                cursorPosition < src.length &&
                // Keep going until we hit the next Jinja statement or expression
                !(src[cursorPosition] === '{' && (src[cursorPosition + 1] === '%' || src[cursorPosition + 1] === '{'))
            ) {
                // Consume text
                text += src[cursorPosition++];
            }

            // There is some text to add
            if (text.length > 0) {
                tokens.push(new Token(text, TOKEN_TYPES.Text));
                continue;
            }
        }

        let char = src[cursorPosition];

        // NOTE: Whitespace is only ignored if inside Jinja statements or expressions: {% %} or {{ }}
        if (/\s/.test(char)) { // Ignore whitespace
            ++cursorPosition; continue;
        }

        ////////////////////////////////////////
        // Handle control sequences
        if (char === '{' && src[cursorPosition + 1] === '%') {
            tokens.push(new Token('{%', TOKEN_TYPES.OpenStatement));
            cursorPosition += 2; continue;
        }
        if (char === '%' && src[cursorPosition + 1] === '}') {
            tokens.push(new Token('%}', TOKEN_TYPES.CloseStatement));
            cursorPosition += 2; continue;
        }
        if (char === '{' && src[cursorPosition + 1] === '{') {
            tokens.push(new Token('{{', TOKEN_TYPES.OpenExpression));
            cursorPosition += 2; continue;
        }
        if (char === '}' && src[cursorPosition + 1] === '}') {
            tokens.push(new Token('}}', TOKEN_TYPES.CloseExpression));
            cursorPosition += 2; continue;
        }
        ////////////////////////////////////////

        if (char === '(') {
            tokens.push(new Token(char, TOKEN_TYPES.OpenParen));
            ++cursorPosition; continue;
        }

        if (char === ')') {
            tokens.push(new Token(char, TOKEN_TYPES.CloseParen));
            ++cursorPosition; continue;
        }

        if (char === '[') {
            tokens.push(new Token(char, TOKEN_TYPES.OpenSquareBracket));
            ++cursorPosition; continue;
        }

        if (char === ']') {
            tokens.push(new Token(char, TOKEN_TYPES.CloseSquareBracket));
            ++cursorPosition; continue;
        }

        if (char === ',') {
            tokens.push(new Token(char, TOKEN_TYPES.Comma));
            ++cursorPosition; continue;
        }

        if (char === '.') {
            tokens.push(new Token(char, TOKEN_TYPES.Dot));
            ++cursorPosition; continue;
        }


        // Conditional operators
        if ((['<', '>', '=', '!'].includes(char)) && src[cursorPosition + 1] === '=') { // >= or <= or == or !=
            tokens.push(new Token(char + src[cursorPosition + 1], TOKEN_TYPES.ComparisonBinaryOperator));
            cursorPosition += 2; continue;
        }
        if (['<', '>'].includes(char)) {
            tokens.push(new Token(char, TOKEN_TYPES.ComparisonBinaryOperator));
            ++cursorPosition; continue;
        }

        // Arithmetic operators
        if (['+', '-'].includes(char)) {
            tokens.push(new Token(char, TOKEN_TYPES.AdditiveBinaryOperator));
            ++cursorPosition; continue;
        }
        if (['*', '/', '%'].includes(char)) {
            tokens.push(new Token(char, TOKEN_TYPES.MultiplicativeBinaryOperator));
            ++cursorPosition; continue;
        }


        // Assignment operator
        if (char === '=') {
            tokens.push(new Token(char, TOKEN_TYPES.Equals));
            ++cursorPosition; continue;
        }

        if (char === "'") {
            let str = '';
            char = src[++cursorPosition];
            while (char !== "'") {
                if (char === undefined) {
                    throw new SyntaxError('Unterminated string literal');
                }
                str += char;
                char = src[++cursorPosition];
            }

            tokens.push(new Token(str, TOKEN_TYPES.StringLiteral));
            ++cursorPosition; continue;
        }

        // Handle multi-character tokens

        if (isInteger(char)) {
            let num = '';
            while (true) {
                num += char;
                char = src[++cursorPosition];
                if (!isInteger(char)) {
                    break;
                }
            }
            tokens.push(new Token(num, TOKEN_TYPES.NumericLiteral));
            continue;
        }

        if (isWord(char)) {
            let word = '';
            while (true) {
                word += char;
                char = src[++cursorPosition];
                if (!isWord(char)) {
                    break;
                }
            }
            if (word === 'true' || word === 'false') {
                tokens.push(new Token(word, TOKEN_TYPES.BooleanLiteral));
                continue;
            }

            // Check for reserved keywords
            tokens.push(new Token(word,
                Object.hasOwn(KEYWORDS, word)
                    ? KEYWORDS[word]
                    : TOKEN_TYPES.Identifier
            ));
            continue;
        }

        throw new SyntaxError(`Unexpected character: ${char}`);
    }
    return tokens;
}
