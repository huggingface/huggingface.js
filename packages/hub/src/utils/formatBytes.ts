/**
 * Format a byte count using SI units (multiples of 1000, e.g. `1.2 GB`).
 *
 * Negative or non-finite inputs are returned as `"<value> B"` without unit conversion.
 */
export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) {
		return `${bytes} B`;
	}
	const units = ["B", "kB", "MB", "GB", "TB", "PB"];
	let value = bytes;
	let i = 0;
	while (value >= 1000 && i < units.length - 1) {
		value /= 1000;
		i++;
	}
	const formatted = i === 0 ? value.toString() : value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2);
	return `${formatted} ${units[i]}`;
}
