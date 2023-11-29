import { env } from "$env/dynamic/private";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	return {
		session,
		supportsOAuth: !!env.OAUTH_CLIENT_ID && !!env.OAUTH_CLIENT_SECRET,
	};
};
