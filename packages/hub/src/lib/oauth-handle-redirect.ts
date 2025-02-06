import { HUB_URL } from "../consts";
import { createApiError } from "../error";

export interface UserInfo {
	/**
	 * OpenID Connect field. Unique identifier for the user, even in case of rename.
	 */
	sub: string;
	/**
	 * OpenID Connect field. The user's full name.
	 */
	name: string;
	/**
	 * OpenID Connect field. The user's username.
	 */
	preferred_username: string;
	/**
	 * OpenID Connect field, available if scope "email" was granted.
	 */
	email_verified?: boolean;
	/**
	 * OpenID Connect field, available if scope "email" was granted.
	 */
	email?: string;
	/**
	 * OpenID Connect field. The user's profile picture URL.
	 */
	picture: string;
	/**
	 * OpenID Connect field. The user's profile URL.
	 */
	profile: string;
	/**
	 * OpenID Connect field. The user's website URL.
	 */
	website?: string;

	/**
	 * Hugging Face field. Whether the user is a pro user.
	 */
	isPro: boolean;
	/**
	 * Hugging Face field. Whether the user has a payment method set up. Needs "read-billing" scope.
	 */
	canPay?: boolean;
	/**
	 * Hugging Face field. The user's orgs
	 */
	orgs?: Array<{
		/**
		 * OpenID Connect field. Unique identifier for the org.
		 */
		sub: string;
		/**
		 * OpenID Connect field. The org's full name.
		 */
		name: string;
		/**
		 * OpenID Connect field. The org's username.
		 */
		preferred_username: string;
		/**
		 * OpenID Connect field. The org's profile picture URL.
		 */
		picture: string;

		/**
		 * Hugging Face field. Whether the org is an enterprise org.
		 */
		isEnterprise: boolean;
		/**
		 * Hugging Face field. Whether the org has a payment method set up. Needs "read-billing" scope, and the user needs to approve access to the org in the OAuth page.
		 */
		canPay?: boolean;
		/**
		 * Hugging Face field. The user's role in the org. The user needs to approve access to the org in the OAuth page.
		 */
		roleInOrg?: string;
		/**
		 * HuggingFace field. When the user granted the oauth app access to the org, but didn't complete SSO.
		 *
		 * Should never happen directly after the oauth flow.
		 */
		pendingSSO?: boolean;
		/**
		 * HuggingFace field. When the user granted the oauth app access to the org, but didn't complete MFA.
		 *
		 * Should never happen directly after the oauth flow.
		 */
		missingMFA?: boolean;
	}>;
}

export interface OAuthResult {
	accessToken: string;
	accessTokenExpiresAt: Date;
	userInfo: UserInfo;
	/**
	 * State passed to the OAuth provider in the original request to the OAuth provider.
	 */
	state?: string;
	/**
	 * Granted scope
	 */
	scope: string;
}

/**
 * To call after the OAuth provider redirects back to the app.
 *
 * There is also a helper function {@link oauthHandleRedirectIfPresent}, which will call `oauthHandleRedirect` if the URL contains an oauth code
 * in the query parameters and return `false` otherwise.
 */
export async function oauthHandleRedirect(opts?: {
	/**
	 * The URL of the hub. Defaults to {@link HUB_URL}.
	 */
	hubUrl?: string;
	/**
	 * The URL to analyze.
	 *
	 * @default window.location.href
	 */
	redirectedUrl?: string;
	/**
	 * nonce generated by oauthLoginUrl
	 *
	 * @default localStorage.getItem("huggingface.co:oauth:nonce")
	 */
	nonce?: string;
	/**
	 * codeVerifier generated by oauthLoginUrl
	 *
	 * @default localStorage.getItem("huggingface.co:oauth:code_verifier")
	 */
	codeVerifier?: string;
}): Promise<OAuthResult> {
	if (typeof window === "undefined" && !opts?.redirectedUrl) {
		throw new Error("oauthHandleRedirect is only available in the browser, unless you provide redirectedUrl");
	}
	if (typeof localStorage === "undefined" && (!opts?.nonce || !opts?.codeVerifier)) {
		throw new Error(
			"oauthHandleRedirect requires localStorage to be available, unless you provide nonce and codeVerifier"
		);
	}

	const redirectedUrl = opts?.redirectedUrl ?? window.location.href;
	const searchParams = (() => {
		try {
			return new URL(redirectedUrl).searchParams;
		} catch (err) {
			throw new Error("Failed to parse redirected URL: " + redirectedUrl);
		}
	})();

	const [error, errorDescription] = [searchParams.get("error"), searchParams.get("error_description")];

	if (error) {
		throw new Error(`${error}: ${errorDescription}`);
	}

	const code = searchParams.get("code");
	const nonce = opts?.nonce ?? localStorage.getItem("huggingface.co:oauth:nonce");

	if (!code) {
		throw new Error("Missing oauth code from query parameters in redirected URL: " + redirectedUrl);
	}

	if (!nonce) {
		throw new Error("Missing oauth nonce from localStorage");
	}

	const codeVerifier = opts?.codeVerifier ?? localStorage.getItem("huggingface.co:oauth:code_verifier");

	if (!codeVerifier) {
		throw new Error("Missing oauth code_verifier from localStorage");
	}

	const state = searchParams.get("state");

	if (!state) {
		throw new Error("Missing oauth state from query parameters in redirected URL");
	}

	let parsedState: { nonce: string; redirectUri: string; state?: string };

	try {
		parsedState = JSON.parse(state);
	} catch {
		throw new Error("Invalid oauth state in redirected URL, unable to parse JSON: " + state);
	}

	if (parsedState.nonce !== nonce) {
		throw new Error("Invalid oauth state in redirected URL");
	}

	const hubUrl = opts?.hubUrl || HUB_URL;

	const openidConfigUrl = `${new URL(hubUrl).origin}/.well-known/openid-configuration`;
	const openidConfigRes = await fetch(openidConfigUrl, {
		headers: {
			Accept: "application/json",
		},
	});

	if (!openidConfigRes.ok) {
		throw await createApiError(openidConfigRes);
	}

	const openidConfig: {
		authorization_endpoint: string;
		token_endpoint: string;
		userinfo_endpoint: string;
	} = await openidConfigRes.json();

	const tokenRes = await fetch(openidConfig.token_endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: parsedState.redirectUri,
			code_verifier: codeVerifier,
		}).toString(),
	});

	if (!opts?.codeVerifier) {
		localStorage.removeItem("huggingface.co:oauth:code_verifier");
	}
	if (!opts?.nonce) {
		localStorage.removeItem("huggingface.co:oauth:nonce");
	}

	if (!tokenRes.ok) {
		throw await createApiError(tokenRes);
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

	const userInfoRes = await fetch(openidConfig.userinfo_endpoint, {
		headers: {
			Authorization: `Bearer ${token.access_token}`,
		},
	});

	if (!userInfoRes.ok) {
		throw await createApiError(userInfoRes);
	}

	const userInfo: UserInfo = await userInfoRes.json();

	return {
		accessToken: token.access_token,
		accessTokenExpiresAt,
		userInfo: userInfo,
		state: parsedState.state,
		scope: token.scope,
	};
}

// if (code && !nonce) {
//   console.warn("Missing oauth nonce from localStorage");
// }

/**
 * To call after the OAuth provider redirects back to the app.
 *
 * It returns false if the URL does not contain an oauth code in the query parameters, otherwise
 * it calls {@link oauthHandleRedirect}.
 *
 * Depending on your app, you may want to call {@link oauthHandleRedirect} directly instead.
 */
export async function oauthHandleRedirectIfPresent(opts?: {
	/**
	 * The URL of the hub. Defaults to {@link HUB_URL}.
	 */
	hubUrl?: string;
	/**
	 * The URL to analyze.
	 *
	 * @default window.location.href
	 */
	redirectedUrl?: string;
	/**
	 * nonce generated by oauthLoginUrl
	 *
	 * @default localStorage.getItem("huggingface.co:oauth:nonce")
	 */
	nonce?: string;
	/**
	 * codeVerifier generated by oauthLoginUrl
	 *
	 * @default localStorage.getItem("huggingface.co:oauth:code_verifier")
	 */
	codeVerifier?: string;
}): Promise<OAuthResult | false> {
	if (typeof window === "undefined" && !opts?.redirectedUrl) {
		throw new Error("oauthHandleRedirect is only available in the browser, unless you provide redirectedUrl");
	}
	if (typeof localStorage === "undefined" && (!opts?.nonce || !opts?.codeVerifier)) {
		throw new Error(
			"oauthHandleRedirect requires localStorage to be available, unless you provide nonce and codeVerifier"
		);
	}
	const searchParams = new URLSearchParams(opts?.redirectedUrl ?? window.location.search);

	if (searchParams.has("error")) {
		return oauthHandleRedirect(opts);
	}

	if (searchParams.has("code")) {
		if (!localStorage.getItem("huggingface.co:oauth:nonce")) {
			console.warn(
				"Missing oauth nonce from localStorage. This can happen when the user refreshes the page after logging in, without changing the URL."
			);
			return false;
		}

		return oauthHandleRedirect(opts);
	}

	return false;
}
