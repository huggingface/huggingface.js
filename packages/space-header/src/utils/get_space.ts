import type { Space } from "./../type";

export const get_space = async (space_id: string): Promise<Space | null> => {
	try {
		const response = await fetch(`https://huggingface.co/api/spaces/${space_id}`);
		const data = await response.json();
		return data as Space;
	} catch (error) {
		return null;
	}
};
