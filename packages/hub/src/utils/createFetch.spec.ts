import { describe, it, expect, vi } from "vitest";
import { createFetch } from "./createFetch";
import { USER_AGENT } from "../consts";

describe("createFetch", () => {
  it("should add user-agent header to fetch requests", async () => {
    // Create a mock fetch function
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
    });

    // Create a wrapped fetch with our utility
    const wrappedFetch = createFetch(mockFetch);

    // Call the wrapped fetch
    const url = "https://huggingface.co/api/test";
    await wrappedFetch(url);

    // Check if the mock was called with the correct headers
    expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({
      headers: expect.objectContaining({
        get: expect.any(Function),
        has: expect.any(Function),
      })
    }));

    // Get the headers from the mock call
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.get("user-agent")).toBe(USER_AGENT);
  });

  it("should not override existing user-agent header", async () => {
    // Create a mock fetch function
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
    });

    // Create a wrapped fetch with our utility
    const wrappedFetch = createFetch(mockFetch);

    // Call the wrapped fetch with a custom user-agent header
    const url = "https://huggingface.co/api/test";
    const customUserAgent = "custom-user-agent";
    await wrappedFetch(url, {
      headers: {
        "user-agent": customUserAgent,
      },
    });

    // Get the headers from the mock call
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.get("user-agent")).toBe(customUserAgent);
  });

  it("should preserve other headers and request options", async () => {
    // Create a mock fetch function
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
    });

    // Create a wrapped fetch with our utility
    const wrappedFetch = createFetch(mockFetch);

    // Call the wrapped fetch with additional headers and options
    const url = "https://huggingface.co/api/test";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "token-value",
      },
      body: JSON.stringify({ data: "test" }),
    };
    
    await wrappedFetch(url, options);

    // Check if the mock was called with all the options preserved
    expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ data: "test" }),
      headers: expect.objectContaining({
        get: expect.any(Function),
        has: expect.any(Function),
      })
    }));

    // Get the headers from the mock call
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("token-value");
    expect(headers.get("user-agent")).toBe(USER_AGENT);
  });
});