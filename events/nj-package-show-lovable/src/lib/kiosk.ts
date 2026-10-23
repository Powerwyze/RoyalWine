// Pure, client-safe kiosk rules: scenes, guest counts and automatic outfit prompt building.
export type SceneId = "black-irish" | "mexxo" | "mariah";

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
    tuxedo: "a classic black tuxedo with crisp white shirt and black bow tie like the reference",
    setting:
      "the cream, gold and teal MEXXO masquerade setting from the reference image, with the MEXXO bottle and branding",
    withMariah: false,
  },
  {
    id: "mariah",
    title: "With Mariah Carey",
    subtitle: "AI masquerade portrait",
    gown: "an elegant burgundy or emerald floor-length evening gown",
    tuxedo: "a classic black tuxedo with crisp white shirt and black bow tie",
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

/** Only numeric integer guest counts are accepted by the styling rules. */
export function isValidGuestCount(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= MAX_GUESTS;
}

/** Multipart counts must be exactly 1, 2 or 3; missing and legacy wardrobe-only requests fail. */
export function parseGuestCount(value: unknown): number | undefined {
  return typeof value === "string" && /^[1-3]$/.test(value) ? Number(value) : undefined;
}

/** Total people expected in the final portrait. */
export function expectedPeople(scene: Scene, guests: number): number {
  return guests + (scene.withMariah ? 1 : 0);
}

export function buildPrompt(scene: Scene, guestCount: number): string {
  if (!isValidGuestCount(guestCount)) throw new Error("Choose 1–3 guests.");
  const n = guestCount;
  const guests = n === 1 ? "guest" : "guests";
  const outfits = Array.from({ length: n }, (_, i) =>
    `- ${positionLabel(i, n)} (position ${i + 1} from left in image 2): match ONLY the outfit already visible. A visible dress or skirt becomes ${scene.gown}. Visible separates, trousers or a suit become ${scene.tuxedo}. If the original outfit is ambiguous or cropped, use ${scene.tuxedo}.`
  ).join("\n");
  return [
    `Edit the supplied illustrated scene. Image 1 is the BASE ARTWORK and authoritative style/composition template. Image 2 is the camera IDENTITY/CLOTHING REFERENCE only, not output style or selfie crop.`,
    ...(scene.id === "black-irish" ? ["For Black Irish, image 1 is the full supplied clean-pose reference, used directly without a prepared derivative. Image 3 is the approved BRAND REFERENCE only. Preserve image 1's approved outlined/light-inline BLACK IRISH wall AND bottle wordmarks, gold/green butterfly crest, gold detailing and green Irish Cream script in their existing locations. Keep the supplied brand family rather than substitute a plain old all-black main wordmark. Preserve existing bottle/glass materials, shape, labels and room; tiny model-rendered glass lettering may vary naturally. Do not redesign or erase product printing. Integrate branding only on existing surfaces; never paste image 3 as a separate badge, floating logo, corner plaque, card or white rectangle."] : []),
    `Edit ONLY the illustrated character regions of image 1. Retain the original background palette, architecture, flowers/candles, brand placement and visible bottle/label: ${scene.setting}. Do not redesign or reinterpret the environment or replace it with a generic ballroom. Camera identity and hairstyle belong only to the guest characters, never to the environment. Keep the main brand text correct.`,
    `Replace its illustrated guest character(s) with drawn/painted versions of the ${n} primary foreground ${guests} in image 2 (the largest, closest, camera-facing people); exclude any background bystanders, passersby or partially visible people in image 2. Keep source guests ordered left to right.`,
    scene.withMariah
      ? "WHOLE-PERSON REPLACEMENT: replace the ENTIRE original right-hand guest, including all original arms, hands, legs, torso and clothing, not simply the head or face. Erase every old limb belonging to that guest; preserve exactly one complete Mariah on the left."
      : "WHOLE-PERSON REPLACEMENT: replace the ENTIRE original person(s), including all original arms, hands, legs, torso and clothing, not simply heads or faces. Erase both template bodies and all of their old limbs before drawing the requested guests, especially for single-guest output. Do not retain a template body beneath a replacement face.",
    `ANATOMY: exactly ${n} camera ${guests}; every person, including retained Mariah when present, has exactly two anatomically attached arms and two hands, and two naturally attached legs. Use natural shoulders, elbows and wrists, balanced body proportions and whole-person likeness. No extra, ghost or disconnected limbs, no duplicated hands. Preserve each source guest's identity, hairstyle, body proportions and left-to-right order; never swap guests or their outfits.`,
    "POSE: one arm may hold a mask below the chin or beside the shoulder; the other hand rests naturally. No crowded crossed-arm pose. Rebuild each complete body and its attached limbs coherently rather than adding new hands over old hands.",
    ...(scene.id === "black-irish" ? ["BLACK IRISH TABLETOP POSE EXCEPTION: keep the drinks already on the marble table beside the bottle; move the cream-drink glass from the guest hand onto the marble table beside the bottle only if necessary. One shared tabletop cream-drink glass is fine even for a group; preserve the reference's tabletop props rather than forcing a new composition. Keep each front printed label fully visible and unobstructed. Keep all hands away from ALL bottle and glass label/print surfaces; other hands rest naturally away from the products. Preserve the cream/emerald/gold room and approved main wall logo."] : []),
    `Keep the original artwork's face-rendering technique, drawn eyebrows/eyes/nose/mouth, simplified skin color shapes and illustrated hair exactly consistent throughout. Preserve recognizable identifying facial shapes, skin tone and hair without retaining photographic texture. The finished guest must look like a character painted by the artist of the template, not a photo composited into the scene.`,
    `Use the original's polished editorial/fashion illustration finish: delicate dark drawn contours, smoothly blended painted skin shadows and highlights, richly shaded illustrated hair locks and elegant painted fabric folds. Avoid thick black outlines or flat vector/cel-shaded blocks; match the template artist's softly dimensional brush rendering while keeping every facial feature clearly drawn. Omit photographic pores and skin grain. Interpret identity through face silhouette, eye spacing, nose/lip shapes, skin tone and hairstyle. The drawing technique takes priority over literal photo fidelity; likeness survives as a painted character, not photographic realism.`,
    `Within the guest characters only, draw each source guest's distinctive facial outline, eye spacing, nose/lip shapes and beard outline in the reference's soft painted treatment rather than substituting a generic idealized fashion-model face. Keep their actual hairstyle silhouette and arrangement: tied-up hair stays tied up, with the same bun/topknot location and volume; do not invent loose shoulder-length hair. Recognizable artist-translated likeness is the goal, not pixel-identical photographic geometry.`,
    `Match image 1's smoothly painted shading, illustrated contours, elegant fashion rendering, original fashion framing and natural head proportions. Make sensible room within that framing for the exact requested guest count without redesigning the setting. Preserve bottle/branding artwork and placement (except the Black Irish tabletop glass pose); hand-painted detail variation is acceptable, a different brand or palette is not. Prevent exaggerated caricature heads and plastic 3D rendering.`,
    `Style visible clothing only. Do not infer, record, label or return gender identity or male/female classification. Do not choose outfits from faces, hair, body or presumed gender.`,
    outfits,
    `Each guest holds a delicate masquerade mask on a stick beside or below the face (never covering the eyes). Position the entire mask outside the face silhouette, at shoulder height or lower; neither the mask nor its eye holes may overlap either guest eye. Both real eyes must remain completely unobstructed.`,
    scene.withMariah
      ? `Keep exactly one recognizable Mariah Carey from the LEFT side of image 1 on the LEFT. Replace the woman on the RIGHT of image 1 with the ${n} ${guests} from image 2, in the same reference facial and fashion treatment. The final image contains exactly ${expectedPeople(scene, n)} people: exactly one Mariah Carey plus the ${n} ${guests}. Remove the original right-hand guest; no other celebrities or people.`
      : `Replace all original people in image 1. The final image contains exactly ${n} ${n === 1 ? "person" : "people"}: only the ${guests} from image 2. Do not keep original template people or add partners or extra people.`,
    ...(scene.id === "black-irish" ? [`FINAL BLACK IRISH PRESERVATION CHECK: this is an edit of image 1, not a new scene. Keep its cream wall with the large approved BLACK IRISH / Irish Cream logo, emerald curtains, gold arches, left-side black Irish Cream bottle with cream label, and cream drink glass on the marble table beside the bottle with hands away from labels. Image 3 supplies the same Irish Cream brand, not a whisky/masquerade rebrand. Retain the circular gold/green butterfly crest and green Irish Cream words on wall, bottle and glass. Never replace Irish Cream with MASQUERADE or age/whisky labels, never substitute a green spirit bottle, and never replace the cream wall with a dark green branded panel. Preserve the new reference's outlined wall and bottle branding and cream-label layout, with image 3 as authority; do not redraw the scene to chase tiny glass lettering. Keep mask wholly below the chin, beside the shoulder, not at eye level.`] : []),
  ].join("\n");
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
