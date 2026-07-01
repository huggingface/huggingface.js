import { TaskProviderHelper } from "./providerHelper";

export class MokzuImageToVideoTask extends TaskProviderHelper {
  constructor() {
    super("mokzu", "https://api.mokzu.com", "image-to-video");
  }

  makeRoute(params: any) {
    return "/v1/image-to-video";
  }

  preparePayload(params: any) {
    const payload: any = {
      image: params.image, // base64 encoded image
      prompt: params.prompt || "",
    };
    
    if (params.duration !== undefined) {
      payload.duration = params.duration;
    }
    if (params.instruction !== undefined) {
      payload.instruction = params.instruction;
    }
    
    return payload;
  }

  getResponse(response: any) {
    if (!response.video_url) {
      throw new Error("No video_url in response");
    }
    return response.video_url;
  }
}
