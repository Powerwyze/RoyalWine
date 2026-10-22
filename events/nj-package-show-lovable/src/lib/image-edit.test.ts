import { describe, expect, it } from "vitest";
import { buildImageEditRequest } from "./image-edit";
import { SCENES } from "./kiosk";

describe("actual Gemini template-first image-edit contract", () => {
  it.each(SCENES)("sends $id approved template before camera identity with documented fields", (scene) => {
    const template = "data:image/jpeg;base64,YXBwcm92ZWQtdGVtcGxhdGU=";
    const camera = "data:image/jpeg;base64,Y2FtZXJhLWlkZW50aXR5";
    const body = buildImageEditRequest(scene, 2, template, camera);
    const parts = body.messages[0]?.content;
    expect(parts?.map((part) => part.image_url?.url).filter(Boolean)).toEqual([template, camera]);
    expect(parts?.[0]?.text).toContain("Image 1 is the BASE ARTWORK");
    expect(parts?.[0]?.text).toContain("Image 2 is the camera IDENTITY/CLOTHING REFERENCE only");
    expect(body.model).toBe("google/gemini-3-pro-image");
    expect(body.image_config.aspect_ratio).toBe("2:3");
    expect(body.modalities).toEqual(["image", "text"]);
    for (const unsupported of ["prompt", "size", "quality", "output_format", "input_fidelity", "partial_images"]) expect(body).not.toHaveProperty(unsupported);
  });
});