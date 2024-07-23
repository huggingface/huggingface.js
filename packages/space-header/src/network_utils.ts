import type { Space } from "./type";

export const get_space = async (space_id: string): Promise<Space | null> => {
	try {
		const response = await fetch(`https://huggingface.co/api/spaces/${space_id}`);
		const data = await response.json();
		console.log(data);
		return data as Space;
	} catch (error) {
		return null;
	}
};

export const check_avatar = async (username: string, type: "user" | "org" = "user"): Promise<boolean> => {
	const route = type === "user" ? "users" : "organizations";

	try {
		const response = await fetch(`https://huggingface.co/api/${route}/${username}/avatar`);
		return response.ok;
	} catch (error) {
		return false;
	}
};
