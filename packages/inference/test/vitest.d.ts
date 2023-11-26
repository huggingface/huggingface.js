/// <reference types="vite/client" />
// https://vitest.dev/guide/extending-matchers
import 'vitest';

interface MatcherResult {
    pass: boolean
    message: () => string
    // If you pass these, they will automatically appear inside a diff when
    // the matcher does not pass, so you don't need to print the diff yourself
    actual?: unknown
    expected?: unknown
}

interface CustomMatchers {
    closeTo(expected: number, precision: number): MatcherResult
}

declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Assertion extends CustomMatchers {}
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}
