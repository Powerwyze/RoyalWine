import { buildPrompt, type Scene } from "./kiosk";

/** Documented Gemini image-edit JSON: base artwork precedes identity reference. */
export function buildImageEditRequest(scene: Scene, guestCount: number, templateUrl: string, guestUrl: string) {
  return {
    model: "google/gemini-3-pro-image",
    messages: [{ role: "user", content: [
      { type: "text", text: buildPrompt(scene, guestCount) },
      { type: "image_url", image_url: { url: templateUrl } },
      { type: "image_url", image_url: { url: guestUrl } },
    ] }],
    modalities: ["image", "text"],
    image_config: { aspect_ratio: "2:3" },
  };
}