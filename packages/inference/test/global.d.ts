declare global {
	namespace Vi {
		interface Assertion {
			closeTo(expected: number, precision: number): unknown;
		}
		interface AsymmetricMatchersContaining {
			closeTo(expected: number, precision: number): unknown;
		}
	}
}

export {};
