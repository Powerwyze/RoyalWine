// Ported from the five-brand Lovable kiosk; body geometry follows the guest photo.
// Pure, client-safe kiosk rules: scenes, guest counts and automatic outfit prompt building.


const tuxedo = "a classic black tuxedo with crisp white shirt and black bow tie like the reference";
export const SCENES = [
  { id: "bartenura", title: "Bartenura", subtitle: "Blue & gold · Venetian sunset", gown: "a blue-and-gold embroidered gown with the reference watercolor fabric finish", tuxedo, width: 1280, height: 1280, bottleCount: 1, setting: "the approved Venetian sunset terrace, blue/white flowers, iconic blue Bartenura Moscato bottle and wine glass" },
  { id: "boondocks", title: "Boondocks", subtitle: "Red velvet · Amber rye", gown: "an elegant black gown with the reference watercolor fabric finish", tuxedo, width: 1280, height: 1065, bottleCount: 1, setting: "the approved seated red velvet, candlelit gold masquerade setting, amber Boondocks RYE whiskey bottle and whiskey tumbler" },
  { id: "padre-azul", title: "Padre Azul", subtitle: "Skull stopper · Venetian sunset", gown: "a black gown matching the reference watercolor fabric finish", tuxedo, width: 1067, height: 1280, bottleCount: 1, setting: "the approved Venetian sunset terrace, white/blue Padre Azul tequila bottle with skull stopper, margarita and lime garnish" },
  { id: "don-ramon", title: "Don Ramón", subtitle: "Punta Diamante · Agave terrace", gown: "an elegant black gown with the reference watercolor fabric finish", tuxedo: "a black suit with black shirt matching the approved reference watercolor finish", width: 1280, height: 1065, bottleCount: 2, setting: "the approved agave/candle terrace with BOTH Don Ramón Punta Diamante bottles: Plata and Reposado, their diamond stoppers, authentic labels and lime-garnished tumbler" },
  { id: "lvov", title: "Lvov", subtitle: "Red cap · Venetian sunset", gown: "a black gown matching the reference watercolor fabric finish", tuxedo, width: 1067, height: 1280, bottleCount: 1, setting: "the approved Venetian sunset terrace with LVOV vodka bottle, red cap, authentic label and olive martini" },
  { id: "photo-mask", title: "Original + Mask", subtitle: "Your photo · Royal Wine Masquerade", gown: "", tuxedo: "", width: 0, height: 0, bottleCount: 0, setting: "the unchanged original camera photograph" },
];

export const MAX_GUESTS = 3;
export const POSITIONS = ["leftmost", "middle", "rightmost"];

export function getScene(id) {
  return SCENES.find((s) => s.id === id);
}

export function positionLabel(index, count) {
  if (count === 1) return "the guest";
  if (count === 2) return index === 0 ? "the guest on the left" : "the guest on the right";
  return `the ${POSITIONS[index]} guest`;
}

/** Only numeric integer guest counts are accepted by the styling rules. */
export function isValidGuestCount(n) {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= MAX_GUESTS;
}

/** Multipart counts must be exactly 1, 2 or 3; missing and legacy wardrobe-only requests fail. */
export function parseGuestCount(value) {
  return typeof value === "string" && /^[1-3]$/.test(value) ? Number(value) : undefined;
}

/** Total people expected in the final portrait. */
export function expectedPeople(scene, guests) {
  return guests;
}

export function buildPrompt(scene, guestCount) {
  if (scene.id === "photo-mask") return buildPhotoMaskPrompt(guestCount);
  if (!isValidGuestCount(guestCount)) throw new Error("Choose 1–3 guests.");
  const n = guestCount;
  const guests = n === 1 ? "guest" : "guests";
  const outfits = Array.from({ length: n }, (_, i) =>
    `- ${positionLabel(i, n)} (position ${i + 1} from left in image 2): match ONLY the outfit already visible. A visible dress or skirt becomes ${scene.gown}. Visible separates, trousers or a suit become ${scene.tuxedo}. If the original outfit is ambiguous or cropped, use ${scene.tuxedo}.`
  ).join("\n");
  return [
    `Edit the supplied illustrated scene. Image 1 is the BASE ARTWORK: authority ONLY for the selected scene's watercolor technique, palette, environment, brand products, clothing design and general pose. The illustrated model's face and body in image 1 are NOT an anatomy template. Image 2 is the camera IDENTITY/CLOTHING REFERENCE only, not output style or selfie crop, and is the SOLE authority for each guest's identity and visible body shape and anatomical proportions.`,
    "REFERENCE PEOPLE ARE NOT CASTING: scene/reference images guide only artwork, setting, products and styling, never the guests' sex, gender presentation or group pairing. Preserve each camera guest's visible appearance, face, facial hair, hairstyle and body as photographed; never masculinize or feminize a guest to match a reference character. Two men remain the same two men, two women remain the same two women, and mixed groups retain each actual guest unchanged. Do not force a man/woman couple, swap identities, add a partner, or transfer a reference model's face or body. Do not infer, label, record or return gender identity; preserve visible likeness rather than classify people.",
    `BODY INVARIANTS: preserve, as supported by the camera photo, each guest's face fullness and jaw shape, neck length/thickness, shoulder breadth, torso width, waist/hip silhouette, arm fullness, visible limb proportions and head-to-body ratio. Do not inherit the reference character's thin waist, narrow shoulders, long neck/limbs or small body. No slimming, widening, reshaping, muscularizing, youthification, beautification or generic fashion-model idealization. Do not infer measurements, weight, health or body-type labels, and do not output classifications.`,
    `Stylize the surface rendering, preserve the guest's geometry: repaint the actual guest in the chosen watercolor medium, changing rendering technique and outfit, not the guest's anatomy. Garment fabric drapes around that guest's actual build; never reshape the person to fit template clothes. Preserve hairstyle, skin tone and distinctive facial features.`,
    `CAPTURE LIMITS: preserve only what the camera photo actually reveals. A head-and-shoulders capture cannot establish full-body height, waist, hips or legs; for unseen areas use a conservative, anatomically plausible continuation of the visible build, not exact geometry. Never let the template's identity or body fill in regions visible in image 2.`,
    `Preserve exactly ${scene.bottleCount} original ${scene.bottleCount === 1 ? "bottle" : "bottles"} and all original glassware. Preserve the selected real product: bottle silhouette, stopper, liquid color, authentic label and correct brand name from image 1. Never invent a replacement bottle, substitute another brand or add a celebrity. Keep products on their existing display table with labels unobstructed and all hands away from labels.`,
    `Edit ONLY the illustrated character regions of image 1. Retain the original background palette, architecture, flowers/candles, brand placement and visible bottle/label: ${scene.setting}. Do not redesign or reinterpret the environment or replace it with a generic ballroom. Camera identity and hairstyle belong only to the guest characters, never to the environment. Keep the main brand text correct.`,
    `Replace its illustrated guest character(s) with drawn/painted versions of the ${n} primary foreground ${guests} in image 2 (the largest, closest, camera-facing people); exclude any background bystanders, passersby or partially visible people in image 2. Keep source guests ordered left to right.`,
    "WHOLE-PERSON REPLACEMENT: replace the ENTIRE original person(s), including all original arms, hands, legs, torso and clothing, not simply heads or faces. Erase every original template body and all of its old limbs before drawing the requested guests, especially for single-guest output. Do not retain a template body beneath a replacement face.",
    `ANATOMY: exactly ${n} camera ${guests}; every person, has exactly two anatomically attached arms and two hands, and two naturally attached legs. Use natural shoulders, elbows and wrists, each guest's own source proportions and whole-person likeness. No extra, ghost or disconnected limbs, no duplicated hands. Preserve each source guest's identity, hairstyle, body proportions and left-to-right order; never swap guests or their outfits.`,
    "POSE: match the approved seated pose and glassware treatment as a general guide; rebuild complete bodies and attached limbs coherently for the selected count. If the pose or composition conflicts with a guest's source proportions, adapt placement, pose and seating space instead of squeezing or stretching the body, while keeping products, background and brand visible. Keep hands away from bottle labels. No crowded crossed-arm pose or new hands over old hands.",
    `Keep the original artwork's face-rendering technique, drawn eyebrows/eyes/nose/mouth, simplified skin color shapes and illustrated hair exactly consistent throughout. Preserve recognizable identifying facial shapes, skin tone and hair without retaining photographic texture. The finished guest must look like a character painted by the artist of the template, not a photo composited into the scene.`,
    `Use the original's watercolor-on-paper illustration finish: delicate dark drawn contours, smoothly blended painted skin shadows and highlights, richly shaded illustrated hair locks and elegant painted fabric folds. Avoid thick black outlines or flat vector/cel-shaded blocks; match the template artist's softly dimensional brush rendering while keeping every facial feature clearly drawn. Omit photographic pores and skin grain. The drawing technique governs surface rendering only; the guest's face and body geometry come from image 2.`,
    `Within the guest characters only, draw each source guest's distinctive facial outline, eye spacing, nose/lip shapes and beard outline in the reference's soft painted treatment rather than substituting a generic idealized fashion-model face. Keep their actual hairstyle silhouette and arrangement: tied-up hair stays tied up, with the same bun/topknot location and volume; do not invent loose shoulder-length hair. Recognizable artist-translated likeness of each guest's real geometry is the goal, rendered in paint rather than photographic texture.`,
    `Match image 1's smoothly painted shading, illustrated contours, elegant fashion rendering and original scene framing, while head and body proportions follow image 2. Make sensible room within that framing for the exact requested guest count without redesigning the setting. Preserve bottle/branding artwork and placement; hand-painted detail variation is acceptable, a different brand or palette is not. Prevent exaggerated caricature heads and plastic 3D rendering.`,

    `Style visible clothing only. Do not infer, record, label or return gender identity or male/female classification. Do not choose outfits from faces, hair, body or presumed gender.`,
    outfits,
    `MASK: match the reference ornate masquerade mask treatment worn around the eyes. Both guest eyes must remain visible through the eye openings. Preserve distinctive facial features; mask ornament must not hide the identifying face entirely. Do not force a held mask below the face.`,
    `FRAMING: preserve image 1's entire native ${scene.width}:${scene.height} canvas, original aspect ratio and watercolor paper borders on every edge. No cropping bottles, faces, glassware or watercolor edges, no zoom or generic replacement background.`,
    `Replace all original people in image 1. The final image contains exactly ${n} ${n === 1 ? "person" : "people"}: only the ${guests} from image 2. Do not keep original template people or add partners or extra people.`,
  ].join("\n");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function isValidEmail(e) {
  return e.length <= 254 && EMAIL_RE.test(e.trim());
}
export function cleanName(n) {
  return n.replace(/[\u0000-\u001f<>]/g, "").trim();
}
/** Delivery service contract (contactVersion 1): trimmed name 2–120 chars. */
export function isValidName(n) {
  const c = cleanName(n);
  return c.length >= 2 && c.length <= 120;
}

export function buildPhotoMaskPrompt(guestCount) {
  if (!isValidGuestCount(guestCount)) throw new Error("Choose 1–3 guests.");
  return [
    "Make a minimal photographic edit of the SINGLE supplied original camera photograph. This is NOT an illustration, portrait makeover, scene replacement or fashion edit.",
    `Add one realistic ornate Venetian masquerade eye mask to each of the ${guestCount} primary foreground posing guest(s), aligned naturally to their existing eyes, nose bridge, face angle and scale. Use elegant dark metallic filigree with restrained gold accents. Both real eyes must remain visible through the mask openings. Do not replace the eyes or invent a new face.`,
    "CHANGE ONLY the small eye-mask accessory regions. Preserve every guest's identity, facial features outside the mask, skin tone, expression, hairstyle, head size, body shape and proportions, original clothes, pose, arms, hands, held objects and accessories. Keep the actual room/background, lighting, texture, existing bystanders and composition unchanged. No slimming, retouching, beautification, smoothing, de-aging, new formalwear or watercolor/painted treatment.",
    "Keep all original people exactly once and in the same positions. Add masks only to the requested primary foreground guests; leave background bystanders alone. Do not add, remove, clone or replace any people, props, drinks or bottles. Do not infer gender or change outfits.",
    "Preserve the entire original photo, its framing and aspect ratio. Do not crop, zoom, stretch, expand or replace the scene. Match the source photographic realism. Return the edited photograph only.",
    "Do NOT add text, logos, words, signatures, borders or watermarks. ROYAL WINE / MASQUERADE branding is added separately by the application above the photograph, so no lettering belongs in this model output."
  ].join("\n");
}
