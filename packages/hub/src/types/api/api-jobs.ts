import type { SpaceHardwareFlavor } from "../public";

export interface ApiJobHardware {
	name: string;
	prettyName: string;
	cpu: string;
	ram: string;
	accelerator: {
		type: "gpu" | "neuron";
		model: string;
		quantity: string;
		vram: string;
		manufacturer: "Nvidia" | "AWS";
	} | null;
	unitCostMicroUSD: number;
	unitCostUSD: number;
	unitLabel: string;
}

export type JobStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled" | "cancelling" | "queued";

export interface ApiJob {
	id: string;
	status: JobStatus;
	createdAt: string;
	updatedAt: string;
	startedAt?: string | null;
	finishedAt?: string | null;
	dockerImage?: string | null;
	spaceId?: string | null;
	command?: string[] | null;
	arguments?: string[] | null;
	flavor: SpaceHardwareFlavor;
	arch?: "amd64" | "arm64" | null;
	timeoutSeconds?: number | null;
	attempts?: number;
	initiator?: {
		type: "user" | "scheduled-job" | "duplicated-job";
		id?: string;
	} | null;
}

export interface ApiScheduledJob {
	id: string;
	schedule: string;
	suspend: boolean;
	concurrency: boolean;
	createdAt: string;
	updatedAt: string;
	jobSpec: {
		dockerImage?: string | null;
		spaceId?: string | null;
		command?: string[] | null;
		environment?: Record<string, string> | null;
		flavor: SpaceHardwareFlavor;
		arch?: "amd64" | "arm64" | null;
		timeoutSeconds?: number | null;
		attempts?: number;
	};
}

export interface CreateJobOptions {
	/**
	 * The Docker image to run (e.g., "python:3.12" or "pytorch/pytorch:2.6.0-cuda12.4-cudnn9-devel")
	 */
	dockerImage?: string;
	/**
	 * The Space ID to run (e.g., "username/space-name")
	 */
	spaceId?: string;
	/**
	 * The command to run (array of strings)
	 */
	command?: string[];
	/**
	 * Additional arguments to pass to the command
	 */
	arguments?: string[];
	/**
	 * Environment variables to set
	 */
	environment?: Record<string, string>;
	/**
	 * Secrets to pass (will be encrypted server-side)
	 */
	secrets?: Record<string, string>;
	/**
	 * Hardware flavor to use
	 */
	flavor: SpaceHardwareFlavor;
	/**
	 * Architecture (defaults to "amd64")
	 */
	arch?: "amd64" | "arm64";
	/**
	 * Timeout in seconds
	 */
	timeoutSeconds?: number | null;
	/**
	 * Maximum number of attempts (defaults to 1)
	 */
	attempts?: number;
}

export interface CreateScheduledJobOptions {
	/**
	 * The job specification
	 */
	jobSpec: Omit<CreateJobOptions, "arguments">;
	/**
	 * CRON schedule expression (e.g., "0 9 * * 1" for 9 AM every Monday) or shortcuts like "@hourly", "@daily"
	 */
	schedule: string;
	/**
	 * Whether the scheduled job is suspended (paused)
	 */
	suspend?: boolean;
	/**
	 * Whether multiple instances of this job can run concurrently
	 */
	concurrency?: boolean;
}
