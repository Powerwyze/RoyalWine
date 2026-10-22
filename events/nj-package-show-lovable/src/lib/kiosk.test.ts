import { describe, expect, it } from "vitest";
import { buildPrompt, expectedPeople, getScene, isValidEmail, isValidGuestCount, parseGuestCount, SCENES } from "./kiosk";

function scene(id: string) {
  const s = getScene(id);
  if (!s) throw new Error("Missing scene");
  return s;
}

describe("camera-only automatic formalwear rules", () => {
  it("offers exactly the three existing scenes", () => {
    expect(SCENES.map((s) => s.id)).toEqual(["black-irish", "mexxo", "mariah"]);
  });
  it("accepts only integer guest counts 1–3", () => {
    for (const n of [1, 2, 3]) expect(isValidGuestCount(n)).toBe(true);
    for (const n of [0, 4, 1.5, NaN, "2", null, undefined]) expect(isValidGuestCount(n)).toBe(false);
    expect(() => buildPrompt(scene("mexxo"), 4)).toThrow("Choose 1–3 guests.");
  });
  it("parses only exact multipart counts, not wardrobe-only or decimal inputs", () => {
    for (const n of ["1", "2", "3"]) expect(parseGuestCount(n)).toBe(Number(n));
    for (const n of [null, "", "0", "4", "2.5", "2.0", "02", " 2", ["gown", "tuxedo"]]) expect(parseGuestCount(n)).toBeUndefined();
  });
  it("keeps exactly the selected primary count in brand scenes", () => {
    expect(expectedPeople(scene("black-irish"), 2)).toBe(2);
    expect(expectedPeople(scene("mexxo"), 1)).toBe(1);
    expect(buildPrompt(scene("mexxo"), 2)).toContain("exactly 2 people: only the guests from image 2");
  });
  it("adds exactly one reference Mariah on the left, replacing the other reference guest", () => {
    expect(expectedPeople(scene("mariah"), 3)).toBe(4);
    const p = buildPrompt(scene("mariah"), 2);
    expect(p).toContain("exactly 3 people: exactly one Mariah Carey plus the 2 guests");
    expect(p).toContain("from the LEFT side of image 1 on the LEFT");
    expect(p).toContain("Replace the woman on the RIGHT of image 1");
  });
  it.each([["black-irish", "emerald-green"], ["mexxo", "teal"], ["mariah", "burgundy or emerald"]])("maps visible dress/skirt to %s scene gown", (id, color) => {
    expect(buildPrompt(scene(id), 2)).toContain(`A visible dress or skirt becomes an elegant ${color} floor-length evening gown`);
  });
  it("maps visible separates/trousers/suit to tuxedo and ambiguous/cropped outfits to the same default", () => {
    for (const s of SCENES) {
      const p = buildPrompt(s, 1);
      expect(p).toContain("Visible separates, trousers or a suit become a classic black tuxedo with crisp white shirt and black bow tie");
      expect(p).toContain("If the original outfit is ambiguous or cropped, use a classic black tuxedo with crisp white shirt and black bow tie");
    }
  });
  it("binds independent outfit matching left to right for all three primary guests", () => {
    const p = buildPrompt(scene("black-irish"), 3);
    for (const [i, label] of ["leftmost", "middle", "rightmost"].entries()) expect(p).toContain(`the ${label} guest (position ${i + 1} from left in image 2): match ONLY the outfit already visible`);
  });
  it("prohibits gender classification and outfit decisions from personal appearance", () => {
    const p = buildPrompt(scene("black-irish"), 2);
    expect(p).toContain("Do not infer, record, label or return gender identity or male/female classification");
    expect(p).toContain("Do not choose outfits from faces, hair, body or presumed gender");
  });
  it("preserves identities, excludes bystanders and holds masks off the eyes", () => {
    const p = buildPrompt(scene("black-irish"), 2);
    expect(p).toContain("exclude any background bystanders");
    expect(p).toContain("recognizable identifying facial shapes, skin tone and hair without retaining photographic texture");
    expect(p).toContain("holds a delicate masquerade mask on a stick beside or below the face (never covering the eyes)");
    expect(p).toContain("Replace all original people in image 1");
  });
  it.each(SCENES)("uses the selected $id reference as authoritative illustration style, not photographic rendering", (s) => {
    const p = buildPrompt(s, 1);
    expect(p).toContain("Image 1 is the BASE ARTWORK and authoritative style/composition template");
    expect(p).toContain("smoothly painted shading, illustrated contours");
    expect(p).toContain("drawn eyebrows/eyes/nose/mouth, simplified skin color shapes and illustrated hair");
    expect(p).toContain("character painted by the artist of the template");
    expect(p).toContain("drawing technique takes priority over literal photo fidelity");
    expect(p).toContain("tied-up hair stays tied up");
    expect(p).toContain("rather than substituting a generic idealized fashion-model face");
    expect(p).toContain("original fashion framing and natural head proportions");
    expect(p).toContain("Image 2 is the camera IDENTITY/CLOTHING REFERENCE only, not output style or selfie crop");
    expect(p).toContain(s.setting);
    expect(p).toContain("bottle/branding artwork and placement");
    const affirmative = p.split(/[.!?]\s+/).filter((sentence) => !/^(No |Identity recognition does not)/.test(sentence.trim())).join(" ");
    expect(affirmative).not.toMatch(/(?:create|use|retain|preserve|render|add|match)\s+(?:a\s+)?photoreal|cinematic|proportions exactly/i);
    expect(p).not.toMatch(/(?:create|use|retain|preserve|render|add|match)\s+(?:a\s+)?photographic/i);
  });
  it("prevents photo compositing, exaggerated heads and plastic 3D without banning illustrated characters", () => {
    const p = buildPrompt(scene("black-irish"), 1);
    expect(p).toContain("not a photo composited into the scene");
    expect(p).toContain("Prevent exaggerated caricature heads and plastic 3D rendering");
    expect(p).not.toMatch(/no cartoon/i);
  });
  it.each(SCENES)("limits $id edits to characters while protecting its original environment and brand", (s) => {
    const p = buildPrompt(s, 3);
    expect(p).toContain("Edit ONLY the illustrated character regions of image 1");
    expect(p).toContain("Retain the original background palette, architecture, flowers/candles, brand placement and visible bottle/label");
    expect(p).toContain(s.setting);
    expect(p).toContain("Do not redesign or reinterpret the environment or replace it with a generic ballroom");
    expect(p).toContain("Camera identity and hairstyle belong only to the guest characters, never to the environment");
    expect(p).toContain("Keep the main brand text correct");
    expect(p).toContain("exact requested guest count without redesigning the setting");
    expect(p).toContain("Recognizable artist-translated likeness is the goal, not pixel-identical photographic geometry");
  });
  it("keeps the Mariah reference treatment cohesive with illustrated guests", () => {
    expect(buildPrompt(scene("mariah"), 1)).toContain("in the same reference facial and fashion treatment");
    expect(expectedPeople(scene("mariah"), 1)).toBe(2);
  });
  it("validates email", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
  });
});
