import type { SetRequired } from "../../vendor/type-fest/set-required";
import type { RepoType, SpaceHardwareFlavor, SpaceSdk } from "../public";
import type { ApiCommitFile } from "./api-commit";

export type ApiCreateRepoPayload = {
	name: string;
	canonical?: boolean;
	license?: string;
	resourceGroupId?: string;
	template?: string;
	organization?: string;
	visibility?: "public" | "private" | "protected";
	lfsmultipartthresh?: number;
	files?: SetRequired<ApiCommitFile, "content">[];
} & (
	| {
			type: Exclude<RepoType, "space">;
	  }
	| {
			type: "space";
			hardware?: SpaceHardwareFlavor;
			sdk: SpaceSdk;
			sdkVersion?: string;
	  }
);
