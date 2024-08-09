export const check_avatar = async (username: string, type: "user" | "org" = "user"): Promise<boolean> => {
	const route = type === "user" ? "users" : "organizations";

	try {
		const response = await fetch(`https://huggingface.co/api/${route}/${username}/avatar`);
		return response.ok;
	} catch (error) {
		return false;
	}
};
