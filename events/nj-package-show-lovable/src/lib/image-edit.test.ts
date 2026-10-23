import { describe, expect, it } from "vitest";
import { buildImageEditRequest } from "./image-edit";
import { SCENES } from "./kiosk";
import { getSceneReferences } from "./scene-references";

describe("actual Gemini template-first image-edit contract", () => {
  it.each(SCENES)("sends $id approved template before camera identity with documented fields", (scene) => {
    const refs = getSceneReferences(scene.id);
    const template = `data:${refs.template.content_type};base64,YXBwcm92ZWQtdGVtcGxhdGU=`;
    const camera = "data:image/jpeg;base64,Y2FtZXJhLWlkZW50aXR5";
    const logo = "data:image/jpeg;base64,YXBwcm92ZWQtbG9nbw==";
    const body = buildImageEditRequest(scene, 2, template, camera, logo);
    const parts = body.messages[0]?.content;
    expect(parts?.map((part) => part.image_url?.url).filter(Boolean)).toEqual(scene.id === "black-irish" ? [template, camera, logo] : [template, camera]);
    expect(parts?.[0]?.text).toContain("Image 1 is the BASE ARTWORK");
    expect(parts?.[0]?.text).toContain("Image 2 is the camera IDENTITY/CLOTHING REFERENCE only");
    expect(body.model).toBe("google/gemini-3-pro-image");
    expect(body.image_config.aspect_ratio).toBe("2:3");
    expect(body.modalities).toEqual(["image", "text"]);
    for (const unsupported of ["prompt", "size", "quality", "output_format", "input_fidelity", "partial_images"]) expect(body).not.toHaveProperty(unsupported);
  });
  it("binds the corrected PNG template and approved JPEG logo only to Black Irish", () => {
    const refs = getSceneReferences("black-irish");
    expect(refs.template.original_filename).toBe("black-irish-clean-pose.png");
    expect(refs.template.content_type).toBe("image/png");
    expect(refs.brand?.original_filename).toBe("black-irish-logo.jpg");
    expect(refs.brand?.content_type).toBe("image/jpeg");
    expect(getSceneReferences("mexxo").brand).toBeUndefined();
    expect(getSceneReferences("mariah").brand).toBeUndefined();
  });
  it("rejects Black Irish without the authoritative third reference", () => {
    const scene = SCENES.find((s) => s.id === "black-irish");
    if (!scene) throw new Error("Missing scene");
    expect(() => buildImageEditRequest(scene, 1, "template", "camera")).toThrow("Approved Black Irish brand reference is required.");
  });
});