import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import { hexFromBytes } from "../utils/hexFromBytes";

/**
 * Use "Sign in with Hub" to authenticate a user, and get oauth user info / access token.
 *
 * When called the first time, it will redirect the user to the Hub login page, which then redirects
 * to the current URL (or custom URL set).
 *
 * When called the second time, after the redirect, it will check the query parameters and return
 * the oauth user info / access token.
 *
 * If called inside an iframe, it will open a new window instead of redirecting the iframe, by default.
 *
 * When called from inside a static Space with OAuth enabled, it will load the config from the space.
 *
 * (Theoretically, this function could be used to authenticate a user for any OAuth provider supporting PKCE and OpenID Connect by changing `hubUrl`,
 * but it is currently only tested with the Hugging Face Hub.)
 */
export async function oauthLogin(opts?: {
	/**
	 * OAuth client ID.
	 *
	 * For static Spaces, you can omit this and it will be loaded from the Space config, as long as `hf_oauth: true` is present in the README.md's metadata.
	 * For other Spaces, it is available to the backend in the OAUTH_CLIENT_ID environment variable, as long as `hf_oauth: true` is present in the README.md's metadata.
	 *
	 * You can also create a Developer Application at https://huggingface.co/settings/connected-applications and use its client ID.
	 */
	clientId?: string;
	hubUrl?: string;
	/**
	 * OAuth scope, a list of space separate scopes.
	 *
	 * For static Spaces, you can omit this and it will be loaded from the Space config, as long as `hf_oauth: true` is present in the README.md's metadata.
	 * For other Spaces, it is available to the backend in the OAUTH_SCOPES environment variable, as long as `hf_oauth: true` is present in the README.md's metadata.
	 *
	 * Defaults to "openid profile".
	 *
	 * You can also create a Developer Application at https://huggingface.co/settings/connected-applications and use its scopes.
	 *
	 * See https://huggingface.co/docs/hub/oauth for a list of available scopes.
	 */
	scopes?: string;
	/**
	 * Redirect URI, defaults to the current URL.
	 *
	 * For Spaces, any URL within the Space is allowed.
	 *
	 * For Developer Applications, you can add any URL you want to the list of allowed redirect URIs at https://huggingface.co/settings/connected-applications.
	 */
	redirectUri?: string;
	/**
	 * Whether to open a new window instead of redirecting the current window.
	 *
	 * If called inside an iframe, it will open a new window instead of redirecting the iframe, by default.
	 * Otherwise, it will redirect the current window, by default.
	 *
	 * Use this to override the default behavior.
	 */
	newWindow?: boolean;
	/**
	 * State to pass to the OAuth provider, which will be returned in the call to `oauthLogin` after the redirect.
	 */
	state?: string;
}): Promise<{
	accessToken: string;
	accessTokenExpiresAt: Date;
	userInfo: {
		id: string;
		name: string;
		fullname: string;
		email?: string;
		emailVerified?: boolean;
		avatarUrl: string;
		websiteUrl?: string;
		isPro: boolean;
		orgs: Array<{
			name: string;
			isEnterprise: boolean;
		}>;
	};
	/**
	 * State passed to the OAuth provider in the original request to the OAuth provider.
	 */
	state?: string;
	/**
	 * Granted scope
	 */
	scope?: string;
}> {
	if (typeof window === "undefined") {
		throw new Error("oauthLogin is only available in the browser");
	}

	const hubUrl = opts?.hubUrl || HUB_URL;
	const openidConfigUrl = `${new URL(hubUrl).origin}/.well-known/openid-configuration`;
	const openidConfigRes = await fetch(openidConfigUrl, {
		headers: {
			Accept: "application/json",
		},
	});

	if (!openidConfigRes.ok) {
		throw createApiError(openidConfigRes);
	}

	const opendidConfig: {
		authorization_endpoint: string;
		token_endpoint: string;
		userinfo_endpoint: string;
	} = await openidConfigRes.json();

	const searchParams = new URLSearchParams(window.location.search);

	const [error, errorDescription] = [searchParams.get("error"), searchParams.get("error_description")];

	if (error) {
		throw new Error(`${error}: ${errorDescription}`);
	}

	const code = searchParams.get("code");
	const nonce = localStorage.getItem("huggingface.co:oauth:nonce");

	if (code && !nonce) {
		console.warn("Missing oauth nonce from localStorage");
	}

	if (code && nonce) {
		const codeVerifier = localStorage.getItem("huggingface.co:oauth:code_verifier");

		if (!codeVerifier) {
			throw new Error("Missing oauth code_verifier from localStorage");
		}

		const state = searchParams.get("state");

		if (!state) {
			throw new Error("Missing oauth state from query parameters in redirected URL");
		}

		if (!state.startsWith(nonce + ":")) {
			throw new Error("Invalid oauth state in redirected URL");
		}

		const tokenRes = await fetch(opendidConfig.token_endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				redirect_uri: opts?.redirectUri || window.location.href,
				code_verifier: codeVerifier,
			}).toString(),
		});

		localStorage.removeItem("huggingface.co:oauth:code_verifier");
		localStorage.removeItem("huggingface.co:oauth:nonce");

		if (!tokenRes.ok) {
			throw createApiError(tokenRes);
		}

		const token: {
			access_token: string;
			expires_in: number;
			id_token: string;
			// refresh_token: string;
			scope: string;
			token_type: string;
		} = await tokenRes.json();

		const accessTokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);

		const userInfoRes = await fetch(opendidConfig.userinfo_endpoint, {
			headers: {
				Authorization: `Bearer ${token.access_token}`,
			},
		});

		if (!userInfoRes.ok) {
			throw createApiError(userInfoRes);
		}

		const userInfo: {
			sub: string;
			name: string;
			preferred_username: string;
			email_verified?: boolean;
			email?: string;
			picture: string;
			website?: string;
			isPro: boolean;
			orgs?: Array<{
				name: string;
				isEnterprise: boolean;
			}>;
		} = await userInfoRes.json();

		return {
			accessToken: token.access_token,
			accessTokenExpiresAt,
			userInfo: {
				id: userInfo.sub,
				name: userInfo.name,
				fullname: userInfo.preferred_username,
				email: userInfo.email,
				emailVerified: userInfo.email_verified,
				avatarUrl: userInfo.picture,
				websiteUrl: userInfo.website,
				isPro: userInfo.isPro,
				orgs: userInfo.orgs || [],
			},
			state: state.split(":")[1],
			scope: token.scope,
		};
	}

	const opensInNewWindow = opts?.newWindow ?? (window.self !== window.top && window.self !== window.parent);

	const newNonce = crypto.randomUUID();
	// Two random UUIDs concatenated together, because min length is 43 and max length is 128
	const newCodeVerifier = crypto.randomUUID() + crypto.randomUUID();

	localStorage.setItem("huggingface.co:oauth:nonce", newNonce);
	localStorage.setItem("huggingface.co:oauth:code_verifier", newCodeVerifier);

	const state = `${newNonce}:${opts?.state || ""}`;

	const redirectUri = opts?.redirectUri || window.location.href;

	// @ts-expect-error window.huggingface is defined inside static Spaces.
	const variables: Record<string, string> | null = window?.huggingface?.variables ?? null;

	const clientId = opts?.clientId || variables?.OAUTH_CLIENT_ID;

	if (!clientId) {
		if (variables) {
			throw new Error("Missing clientId, please add hf_oauth: true to the README.md's metadata in your static Space");
		}
		throw new Error("Missing clientId");
	}

	const challenge = hexFromBytes(
		new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(newCodeVerifier)))
	);

	if (opensInNewWindow) {
		window.open(
			`${opendidConfig.authorization_endpoint}?${new URLSearchParams({
				client_id: clientId,
				scope: opts?.scopes || "openid profile",
				response_type: "code",
				redirect_uri: redirectUri,
				state,
				code_challenge: challenge,
				code_challenge_method: "S256",
			}).toString()}`,
			"_blank"
		);
		throw new Error("Opened in new window");
	} else {
		window.location.href = `${opendidConfig.authorization_endpoint}?${new URLSearchParams({
			client_id: clientId,
			scope: opts?.scopes || "openid profile",
			response_type: "code",
			redirect_uri: redirectUri,
			state,
			code_challenge: challenge,
			code_challenge_method: "S256",
		}).toString()}`;
		throw new Error("Redirected");
	}
}
