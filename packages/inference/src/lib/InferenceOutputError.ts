export class InferenceOutputError extends TypeError {
	constructor(err: unknown) {
		super(
			`Invalid inference output: ${
				err instanceof Error ? err.message : String(err)
			}. Use the 'request' method with the same parameters to do a custom call with no type checking.`,
			err instanceof Error ? { cause: err } : undefined
		);
		this.name = "InferenceOutputError";
	}
}
