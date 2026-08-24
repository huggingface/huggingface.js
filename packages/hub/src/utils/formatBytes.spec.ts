import { describe, it, expect } from "vitest";
import { formatBytes } from "./formatBytes";

describe("formatBytes", () => {
	it("uses SI units (multiples of 1000)", () => {
		expect(formatBytes(0)).toBe("0 B");
		expect(formatBytes(999)).toBe("999 B");
		expect(formatBytes(1000)).toBe("1.00 kB");
		expect(formatBytes(1_500)).toBe("1.50 kB");
		expect(formatBytes(1_000_000)).toBe("1.00 MB");
		expect(formatBytes(5_300_000_000)).toBe("5.30 GB");
	});

	it("adjusts precision based on magnitude", () => {
		expect(formatBytes(12_300)).toBe("12.3 kB");
		expect(formatBytes(123_000)).toBe("123 kB");
	});

	it("handles invalid inputs gracefully", () => {
		expect(formatBytes(NaN)).toBe("NaN B");
		expect(formatBytes(-1)).toBe("-1 B");
	});
});
