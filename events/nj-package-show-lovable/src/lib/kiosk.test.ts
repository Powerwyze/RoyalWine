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
    expect(buildPrompt(scene("mexxo"), 2)).toContain("exactly 2 people: only the guests from image 1");
  });
  it("adds exactly one reference Mariah on the left, replacing the other reference guest", () => {
    expect(expectedPeople(scene("mariah"), 3)).toBe(4);
    const p = buildPrompt(scene("mariah"), 2);
    expect(p).toContain("exactly 3 people: exactly one Mariah Carey plus the 2 guests");
    expect(p).toContain("from the LEFT side of image 2 on the LEFT");
    expect(p).toContain("Replace the woman on the RIGHT of image 2");
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
    for (const [i, label] of ["leftmost", "middle", "rightmost"].entries()) expect(p).toContain(`the ${label} guest (position ${i + 1} from left in image 1): match ONLY the outfit already visible`);
  });
  it("prohibits gender classification and outfit decisions from personal appearance", () => {
    const p = buildPrompt(scene("black-irish"), 2);
    expect(p).toContain("Do not infer, record, label or return gender identity or male/female classification");
    expect(p).toContain("Do not choose outfits from faces, hair, body or presumed gender");
  });
  it("preserves identities, excludes bystanders and holds masks off the eyes", () => {
    const p = buildPrompt(scene("black-irish"), 2);
    expect(p).toContain("exclude any background bystanders");
    expect(p).toContain("preserve each face, facial features, skin tone, hair and body proportions exactly");
    expect(p).toContain("holds a delicate masquerade mask on a stick beside or below the face (never covering the eyes)");
    expect(p).toContain("Do NOT copy the people from image 2");
  });
  it("validates email", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
  });
});
