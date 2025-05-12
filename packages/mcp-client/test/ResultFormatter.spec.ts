// test/CallToolResultFormatter.test.ts
import { describe, expect, it } from "vitest";
import { ResultFormatter } from "../src/ResultFormatter";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

describe("CallToolResultFormatter", () => {
  it("should handle empty content", () => {
    const result: CallToolResult = {
      content: []
    };
    expect(ResultFormatter.format(result)).toBe("[No content]");
  });

  it("should format text content", () => {
    const result: CallToolResult = {
      content: [
        {
          type: "text",
          text: "Hello, world!"
        },
        {
          type: "text",
          text: "This is a test."
        }
      ]
    };
    expect(ResultFormatter.format(result)).toBe("Hello, world!\nThis is a test.");
  });

  it("should format binary content with summaries", () => {
    const result: CallToolResult = {
      content: [
        {
          type: "image",
          mimeType: "image/png",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        },
        {
          type: "audio",
          mimeType: "audio/mp3",
          data: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8"
        }
      ]
    };
    
    const formatted = ResultFormatter.format(result);
    expect(formatted).toContain("[Binary Content: Image image/png");
    expect(formatted).toContain("[Binary Content: Audio audio/mp3");
    expect(formatted).toContain("bytes]");
  });

  it("should format resource content correctly", () => {
    const result: CallToolResult = {
      content: [
        {
          type: "resource",
          resource: {
            uri: "https://example.com/text.txt",
            text: "This is text from a resource."
          }
        },
        {
          type: "resource",
          resource: {
            uri: "https://example.com/image.png",
            mimeType: "image/png",
            blob: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
          }
        }
      ]
    };
    
    const formatted = ResultFormatter.format(result);
    expect(formatted).toContain("This is text from a resource.");
    expect(formatted).toContain("[Binary Content (https://example.com/image.png): image/png");
    expect(formatted).toContain("bytes]");
  });

  it("should handle mixed content types", () => {
    const result: CallToolResult = {
      content: [
        {
          type: "text",
          text: "Here's a file I found:"
        },
        {
          type: "resource",
          resource: {
            uri: "https://example.com/document.pdf",
            mimeType: "application/pdf",
            blob: "JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAEtjTsKgDAUBHt"
          }
        }
      ]
    };
    
    const formatted = ResultFormatter.format(result);
    expect(formatted).toContain("Here's a file I found:");
    expect(formatted).toContain("[Binary Content (https://example.com/document.pdf): application/pdf");
  });
});
