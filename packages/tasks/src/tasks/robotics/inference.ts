/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Robotics inference: one observation of a robot, returning the policy's next
 * action chunk
 */
export interface RoboticsInput {
	/**
	 * The robot's observation
	 */
	inputs: RoboticsInputs;
	/**
	 * Additional inference parameters for Robotics
	 */
	parameters?: RoboticsParameters;
	[property: string]: unknown;
}
/**
 * The robot's observation
 */
export interface RoboticsInputs {
	/**
	 * Camera images keyed by camera name (the policy's camera names when known), each a
	 * base64-encoded PNG or JPEG or a URL
	 */
	images: { [key: string]: string };
	/**
	 * Natural-language task instruction
	 */
	instruction?: string;
	/**
	 * Proprioceptive state vector (joint positions, gripper, ...)
	 */
	state?: number[];
	[property: string]: unknown;
}
/**
 * Additional inference parameters for Robotics
 */
export interface RoboticsParameters {
	/**
	 * Number of actions of the chunk to return (defaults to the policy's chunk size)
	 */
	num_actions?: number;
	/**
	 * Seed for the policy's own random draws (flow-matching or diffusion noise), for
	 * reproducible actions
	 */
	seed?: number;
	[property: string]: unknown;
}
/**
 * Outputs of inference for the Robotics task
 */
export interface RoboticsOutput {
	/**
	 * Number of values per action
	 */
	action_dim?: number;
	/**
	 * The action chunk: one row per future control step, action_dim values per row, in the
	 * policy's action space
	 */
	actions: Array<number[]>;
	/**
	 * Number of actions in the chunk
	 */
	chunk?: number;
	/**
	 * Control frequency the chunk is meant for, when the policy declares one
	 */
	frequency_hz?: number;
	[property: string]: unknown;
}
