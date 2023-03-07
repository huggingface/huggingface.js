interface CustomMatchers<R = unknown> {
	closeTo(expected: number, precision: number): R;
}

declare global {
	namespace Vi {
		type Assertion = CustomMatchers
		type AsymmetricMatchersContaining = CustomMatchers
	}
}

export {};
