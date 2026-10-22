import { describe, expect, it } from "vitest";
import { buildPrompt, expectedPeople, getScene, isValidEmail, isValidWardrobes, SCENES } from "./kiosk";

describe("kiosk rules", () => {
  it("offers exactly three scenes", () => {
    expect(SCENES.map((s) => s.id)).toEqual(["black-irish", "mexxo", "mariah"]);
  });
  it("brand scenes contain only the guest count", () => {
    expect(expectedPeople(getScene("black-irish")!, 2)).toBe(2);
    expect(expectedPeople(getScene("mexxo")!, 1)).toBe(1);
    expect(buildPrompt(getScene("mexxo")!, ["gown"])).toContain("exactly 1 person");
  });
  it("Mariah scene adds exactly one Mariah", () => {
    expect(expectedPeople(getScene("mariah")!, 3)).toBe(4);
    const p = buildPrompt(getScene("mariah")!, ["tuxedo", "gown"]);
    expect(p).toContain("exactly 3 people");
    expect(p).toContain("exactly one Mariah Carey");
  });
  it("binds wardrobe per guest by position", () => {
    const p = buildPrompt(getScene("black-irish")!, ["tuxedo", "gown", "tuxedo"]);
    expect(p).toMatch(/leftmost guest \(position 1[^\n]*tuxedo/);
    expect(p).toMatch(/middle guest \(position 2[^\n]*emerald-green[^\n]*gown/);
    expect(p).toMatch(/rightmost guest \(position 3[^\n]*tuxedo/);
  });
  it("rejects invalid guest/wardrobe lists", () => {
    expect(isValidWardrobes([])).toBe(false);
    expect(isValidWardrobes(["gown", "gown", "gown", "gown"])).toBe(false);
    expect(isValidWardrobes(["casual"])).toBe(false);
    expect(isValidWardrobes(["gown", "tuxedo"])).toBe(true);
  });
  it("validates email", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
  });
});
