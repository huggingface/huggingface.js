declare global {
	namespace Vi {
		interface Assertion {
			closeTo(expected: number, precision: number): Assertion;
		}
		interface AsymmetricMatchersContaining {
			closeTo(expected: number, precision: number): Assertion;
		}
	}
}

export {};
