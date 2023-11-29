import { env } from "$env/dynamic/private";
import type { LayoutServerLoad } from "./$types.js";

const supportsOAuth = !!env.OAUTH_CLIENT_ID && !!env.OAUTH_CLIENT_SECRET;

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: supportsOAuth ? locals.getSession() : undefined,
		supportsOAuth,
	};
};
