import { USER_AGENT } from "../consts";

/**
 * Creates a fetch wrapper that automatically adds the user-agent header with the package version
 * 
 * @param fetch - The base fetch function to wrap
 * @returns A wrapped fetch function that includes the user-agent header
 */
export function createFetch(
  baseFetch: typeof fetch = typeof fetch !== "undefined" ? fetch : undefined as unknown as typeof fetch
): typeof fetch {
  return function wrappedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    
    // Only add the user-agent if it's not already set
    if (!headers.has("user-agent")) {
      headers.set("user-agent", USER_AGENT);
    }
    
    const newInit: RequestInit = {
      ...init,
      headers,
    };
    
    return baseFetch(input, newInit);
  };
}

/**
 * Default fetch instance with user-agent header included
 */
export const fetchWithUserAgent = createFetch();