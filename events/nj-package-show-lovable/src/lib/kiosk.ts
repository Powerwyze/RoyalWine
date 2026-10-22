// Pure, client-safe kiosk rules: scenes, wardrobe and prompt building.
export type SceneId = "black-irish" | "mexxo" | "mariah";
export type Wardrobe = "tuxedo" | "gown";

export interface Scene {
  id: SceneId;
  title: string;
  subtitle: string;
  gown: string;
  tuxedo: string;
  setting: string;
  withMariah: boolean;
}

export const SCENES: Scene[] = [
  {
    id: "black-irish",
    title: "Black Irish Masquerade",
    subtitle: "Emerald & gold ballroom",
    gown: "an elegant emerald-green floor-length evening gown like the reference",
    tuxedo: "a classic black tuxedo with crisp white shirt and black bow tie like the reference",
    setting:
      "the cream, emerald and antique-gold Black Irish Irish Cream masquerade ballroom from the reference image, with flowers, candles and the Black Irish bottle and branding",
    withMariah: false,
  },
  {
    id: "mexxo",
    title: "MEXXO Masquerade",
    subtitle: "Teal, red & gold feathers",
    gown: "an elegant teal floor-length evening gown like the reference",
    tuxedo: "a classic black tuxedo with bow tie like the reference",
    setting:
      "the cream, gold and teal MEXXO masquerade setting from the reference image, with the MEXXO bottle and branding",
    withMariah: false,
  },
  {
    id: "mariah",
    title: "With Mariah Carey",
    subtitle: "AI masquerade portrait",
    gown: "an elegant burgundy or emerald floor-length evening gown",
    tuxedo: "a classic black tuxedo with bow tie",
    setting: "an opulent emerald, gold and burgundy chandelier ballroom like the reference image",
    withMariah: true,
  },
];

export const MAX_GUESTS = 3;
export const POSITIONS = ["leftmost", "middle", "rightmost"];

export function getScene(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}

export function positionLabel(index: number, count: number): string {
  if (count === 1) return "the guest";
  if (count === 2) return index === 0 ? "the guest on the left" : "the guest on the right";
  return `the ${POSITIONS[index]} guest`;
}

export function isValidWardrobes(w: unknown): w is Wardrobe[] {
  return (
    Array.isArray(w) &&
    w.length >= 1 &&
    w.length <= MAX_GUESTS &&
    w.every((x) => x === "tuxedo" || x === "gown")
  );
}

/** Total people expected in the final portrait. */
export function expectedPeople(scene: Scene, guests: number): number {
  return guests + (scene.withMariah ? 1 : 0);
}

export function buildPrompt(scene: Scene, wardrobes: Wardrobe[]): string {
  const n = wardrobes.length;
  const total = expectedPeople(scene, n);
  const outfits = wardrobes
    .map((w, i) => `- ${positionLabel(i, n)} (position ${i + 1} from left in image 1) wears ${w === "gown" ? scene.gown : scene.tuxedo}.`)
    .join("\n");
  const lines = [
    `Create a photorealistic luxury masquerade portrait.`,
    `Image 1 is the SOURCE PHOTO. Use ONLY the ${n} primary foreground guest${n > 1 ? "s" : ""} (the ${n} largest, closest, camera-facing ${n > 1 ? "people" : "person"}). Ignore and exclude any background bystanders, passersby or partially visible people in image 1.`,
    `Image 2 is the SCENE REFERENCE for composition, lighting, styling and setting only.`,
    `Keep every guest from image 1 recognizably the same person: preserve each face, facial features, skin tone, hair and body proportions exactly. Keep them ordered left to right as in image 1.`,
    `Wardrobe, bound to each guest by position:`,
    outfits,
    `Each guest holds a delicate masquerade mask on a stick beside or below the face (never covering the eyes) so their face stays clearly recognizable.`,
    `Setting: ${scene.setting}. Preserve the brand logo and bottle artwork exactly as shown in the reference; do not invent or misspell text.`,
  ];
  if (scene.withMariah) {
    lines.push(
      `Keep the recognizable Mariah Carey from the LEFT side of image 2 on the LEFT of the portrait. Replace the woman on the RIGHT of image 2 with the guest${n > 1 ? "s" : ""} from image 1.`,
      `The final image contains exactly ${total} people: exactly one Mariah Carey plus the ${n} guest${n > 1 ? "s" : ""}. No other celebrities, do not keep the reference woman from the right of image 2.`,
    );
  } else {
    lines.push(
      `The final image contains exactly ${total} ${total === 1 ? "person" : "people"}: only the guest${n > 1 ? "s" : ""} from image 1. Do NOT copy the people from image 2 and do not add partners or extra people.`,
    );
  }
  lines.push(`Never casual clothing. Tall portrait framing, elegant cinematic lighting.`);
  return lines.join("\n");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function isValidEmail(e: string): boolean {
  return e.length <= 254 && EMAIL_RE.test(e.trim());
}
export function cleanName(n: string): string {
  return n.replace(/[\u0000-\u001f<>]/g, "").trim();
}
/** Delivery service contract (contactVersion 1): trimmed name 2–120 chars. */
export function isValidName(n: string): boolean {
  const c = cleanName(n);
  return c.length >= 2 && c.length <= 120;
}
