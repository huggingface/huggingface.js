import { randomBytes } from "crypto";

export function generateUniqueId(): string {
	return randomBytes(16).toString("hex");
}
