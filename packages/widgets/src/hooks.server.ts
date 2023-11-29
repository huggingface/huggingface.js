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
					async jwt({ token, account }) {
						if (account) {
							return {
								...token,
								access_token: account.access_token,
							};
						}
						return token;
					},
					async session({ session, token }) {
						return {
							...session,
							access_token: token.access_token,
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
