import { Readable } from "stream";
import { createHash } from "crypto";

export async function sha256Node(buffer: ArrayBuffer | Blob): Promise<string> {
	const sha256Stream = createHash("sha256");
	const transform256 = (
		buffer instanceof Blob ? Readable.fromWeb(buffer.stream() as any) : Readable.from(Buffer.from(buffer))
	)
		.pipe(sha256Stream)
		.setEncoding("hex");
	return promisifyRs(transform256);
}

const promisifyRs = (rs: Readable): Promise<string> => {
	return new Promise((resolve, reject) => {
		let out = "";
		rs.on("data", (chunk) => {
			out += chunk;
		});
		rs.on("error", (err) => {
			reject(err);
		});
		rs.on("end", () => {
			resolve(out);
		});
	});
};
