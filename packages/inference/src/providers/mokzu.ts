import { TaskProviderHelper } from "./providerHelper";

export class MokzuTextToVideoTask extends TaskProviderHelper {
  constructor() {
    super("mokzu", "https://api.mokzu.com/v1", "text-to-video");
  }

  makeRoute(params: any) {
    return "/text-to-video";
  }

  preparePayload(params: any) {
    return { prompt: params.prompt };
  }

  getResponse(response: any) {
    return response.video_url;
  }
}

export class MokzuImageToVideoTask extends TaskProviderHelper {
  constructor() {
    super("mokzu", "https://api.mokzu.com/v1", "image-to-video");
  }

  makeRoute(params: any) {
    return "/image-to-video";
  }

  preparePayload(params: any) {
    return { image: params.image }; // base64 or file upload
  }

  getResponse(response: any) {
    return response.video_url;
  }
}
