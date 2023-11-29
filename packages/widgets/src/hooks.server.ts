import { env } from "$env/dynamic/private";
import { skipCSRFCheck } from "@auth/core";
import { SvelteKitAuth } from "@auth/sveltekit";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const handleSSO =
	env.OAUTH_CLIENT_ID && env.OAUTH_CLIENT_SECRET
		? SvelteKitAuth({
				// Should be fine as long as your reverse proxy is configured to only accept traffic with the correct host header
				trustHost: true,
				/**
				 * SvelteKit has built-in CSRF protection, so we can skip the check
				 */
				skipCSRFCheck: skipCSRFCheck,
				cookies: {
					sessionToken: {
						name: "session_token",
						options: {
							httpOnly: true,
							sameSite: "lax",
							secure: true,
							path: "/",
							maxAge: 3600, // The OAuth token's lifetime is 3600 seconds
						},
					},
				},
				providers: [
					{
						name: "Hugging Face",
						id: "huggingface",
						type: "oidc",
						clientId: env.OAUTH_CLIENT_ID,
						clientSecret: env.OAUTH_CLIENT_SECRET,
						issuer: "https://huggingface.co",
						wellKnown: "https://huggingface.co/.well-known/openid-configuration",
						/** Add "inference-api" scope and remove "email" scope */
						authorization: { params: { scope: "openid profile inference-api" } },
						checks: ["state" as never, "pkce" as never],
					},
				],
				secret: env.OAUTH_CLIENT_SECRET,
				/**
				 * Get the access_token without an account in DB, to make calls to the inference API
				 */
				callbacks: {
					jwt({ token, account, profile }) {
						return {
							...token,
							/**
							 * account & profile are undefined beyond the first login, in those
							 * cases `token.access_token` and `token.username` are defined
							 */
							...(account && { access_token: account.access_token }),
							...(profile && { username: profile.preferred_username }),
						};
					},
					session({ session, token }) {
						return {
							...session,
							access_token: token.access_token,
							user: Object.assign({}, session.user, {
								username: token.username,
							}),
						};
					},
				},
		  })
		: null;

const handleGlobal: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	return response;
};

export const handle = handleSSO ? sequence(handleSSO, handleGlobal) : handleGlobal;
