declare global {
	namespace Vi {
		interface Assertion {
			closeTo(expected: number, precision: number): Assertion;
		}
		interface AsymmetricMatchersContaining {
			closeTo(expected: number, precision: number): Assertion;
		}
	}

	const __TEST_FILES__: Record<string, string>;
}

export {};
