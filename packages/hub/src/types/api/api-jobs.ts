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

export type JobStatusStage = "DELETING" | "RUNNING" | "PAUSED" | "STOPPED" | "UPDATING" | "ERROR";

export interface ApiJobStatus {
	stage: JobStatusStage;
	message?: string | null;
	failureCount: number;
}

export interface ApiJobUser {
	id: string;
	name: string;
	type?: "user" | "org";
	avatarUrl?: string;
}

export interface ApiJob {
	type: "job";
	id: string;
	status: ApiJobStatus;
	createdAt: string;
	updatedAt?: string;
	startedAt?: string | null;
	finishedAt?: string | null;
	createdBy?: {
		id: string;
		name: string;
	};
	dockerImage?: string | null;
	spaceId?: string | null;
	command?: string[] | null;
	arguments?: string[] | null;
	environment?: Record<string, string> | null;
	flavor: SpaceHardwareFlavor;
	arch?: "amd64" | "arm64" | null;
	timeoutSeconds?: number | null;
	attempts?: number;
	owner?: ApiJobUser;
	initiator?: ApiJobUser;
	secrets?: string[];
	labels?: Record<string, string> | null;
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
		labels?: Record<string, string> | null;
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
	/**
	 * Labels to attach to the job (key-value pairs)
	 */
	labels?: Record<string, string>;
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
