export class InferenceOutputError extends TypeError {
	constructor(message: string) {
		super(
			`Invalid inference output: ${message}. Use the 'request' method with the same parameters to do a custom call with no type checking.`
		);
		this.name = "InferenceOutputError";
	}
}
