export function filesFlags(files?: FileList): { image: boolean; audio: boolean } {
	const image = !!files && files[0].type.startsWith("image");
	const audio = !!files && files[0].type.startsWith("audio");
	return { image, audio };
}

export function isBlob(message: string | Blob): message is Blob {
	return message instanceof Blob;
}
