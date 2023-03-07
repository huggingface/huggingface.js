declare global {
	namespace Vi {
		interface Assertion {
			// todo: fix the any
			closeTo(expected: number, precision: number): any;
		}
		interface AsymmetricMatchersContaining {
			// todo: fix the any
			closeTo(expected: number, precision: number): any;
		}
	}
}

export {};
