# QA report — Royal Wine Masquerade kiosk

## Final practical illustration acceptance — 2026-10-22, 22:52–22:57 UTC

### Current behavior and acceptance
- Kept the documented single-pass native `google/gemini-3-pro-image` integration and softly painted drawn-feature instructions. Added explicit character-region-only edits: retain the original palette, architecture, brand placement and visible bottle/label; camera identity/hairstyle applies only to guests, never the environment. Preserve distinctive face shapes in a recognizable artistic translation rather than pixel-identical geometry or glamour-model substitution. Server-approved template remains first; browser cannot replace it.
- Practical acceptance **passed for the two inspected outputs** below: clearly drawn faces, recognizable guest, source tied-up hairstyle, natural proportions, automatic black tuxedo/white shirt/bow tie, held mask with eyes uncovered, exactly one guest and no background bystanders. Small artist-translated face/label details are expected, not a failure. These checks are sample-based, not a guarantee that every generative output is identical.

| Actual request | Response / elapsed | Visually compared with the original template and unchanged private source |
|---|---|---|
| Black Irish, one guest via real fake-camera browser capture | HTTP 200 / 20.6 s | Clearly ink-contoured softly painted face and hair, recognizable features and tied-up locks; natural head/body proportions. Original emerald curtains, cream/gold arches, flowers/candles, upper-left BLACK IRISH Irish Cream brand and lower-left bottle retained. Fashion-length framing, tuxedo, held gold/emerald mask; one guest only. Small painted drink-label variation does not change the correct main brand/bottle. |
| MEXXO, one guest via actual app API with unchanged private default fixture | HTTP 200 / 19.3 s | Same recognizable drawn guest and tied-up hair, tuxedo and held mask. Original cream/gold/teal architecture, teal/red MEXXO wordmark/X, flowers, table, bottle with MEXXO label and decorative mask/lime retained. Three-quarter fashion framing rather than exact full-length character pixels; correct brand-specific color composition. One guest, no bystanders. |

- **Two actual model calls total**, one per guest request; no retry or third experiment needed after acceptance. No two-stage pipeline. Mariah and additional guest counts were not regenerated in this pass; focused contract tests preserve exactly one original Mariah left and selected guests replacing the original right character, along with independent visible-clothing rules.

### Focused MIME, download and email verification
- Real browser flow at 1280×1800: private fixture supplied through Chromium fake camera, five-second countdown, review, actual `/api/generate`, PNG response decoded into result, brand plaque and AI-created label composited, downloadable `royal-wine-masquerade.jpg` verified as an **848×1264 JPEG**. No generation mocking was used.
- Only `/api/send-photo` was mocked. Email-first/name-second form and explicit Review → Send now were exercised with non-deliverable synthetic contact values. Outgoing bare-base64 JPEG decoded successfully and matched downloaded JPEG bytes exactly; outgoing name/email matched entered test values. Success state visibly confirmed; **no real email or upstream email request**. Zero browser page errors. Private result/confirmation screenshots inspected and kept only under `/tmp`.
- `bunx vitest run src/lib/kiosk.test.ts src/lib/image-edit.test.ts src/lib/send-dedupe.test.ts src/test/app-routing.test.tsx`: **31 tests passed, 4 files**. Includes three new environment/character separation contracts, actual template/camera order, scene/count/Mariah/clothing rules, name validation, payload dedupe success/failure/retry and routing. No broad camera-race suite repeated.
- Automatic Lovable build/type check: **2026-10-22T22:53:49Z: build OK**. No manual build/typecheck commands. Runtime UI/MIME, model selection, email integration and guest storage unchanged in this pass; only prompt/tests/documentation edited. All private source/output/screenshots remain `/tmp`; no new secrets, uploads, avatar, public guest media or publication.
- External Vercel email correction was **verified by the coordinating agent** at `ffed3994c7170ace0c5ea079dbdbb0425a4dc0f7`: “Great connections” removed, “A royal portrait.” retained, 30 API/mock-email checks passed. Those external checks were not rerun here.
- The image-generation skill informed the separation of requested character edits from retained template elements.

## Historical alternate native renderer — 2026-10-22, 22:46–22:51 UTC

### Discovery and actual implementation
- Authenticated `/v1/models` returned `workspace_models: included`; `google/gemini-3-pro-image` is available, current/nondeprecated, accepts images/text and emits images/text with zero-retention image-generation surface in the catalog. Read the image-generation skill request-format, provider-parameter and gateway-edit example references. No documented fidelity setting exists for this contract; OpenAI `input_fidelity` is not supported.
- Authorized alternate implemented as one-pass native Gemini edit via `/v1/images/generations`: JSON `messages` with prompt, original template image URL first, camera inline image URL second; `modalities: [image,text]`, supported `image_config.aspect_ratio: 2:3`. No OpenAI size/quality/output-format fields or new credentials. Existing nonstreaming final-result behavior and cancellation signal/bounded transient retry preserved; no artificial timers added.
- Returned PNG MIME is passed through to browser compositing before JPEG download/email. Removed the inaccurate under-a-minute promise. Normal guest request uses **one model call**, potentially two only on the existing bounded 429/5xx transient retry. No two-stage pipeline was tested or implemented.

### Four real calls and visual results
All requests used the unchanged authorized source only in `/tmp` through the updated local app API, Black Irish, guestCount=1. All returned HTTP 200 with no retries. No guest screenshots/public media, new secrets, real emails or publication.

| Call | Elapsed | Visual assessment |
|---|---|---|
| 1: alternate renderer with prior explicit drawn instructions | 18.8 s | Unmistakably 2D drawn face/hair, no photographic pores; correct one-guest tuxedo/held mask and original Black Irish composition. Contours/shading too bold and flat compared with the original softly painted illustration. |
| 2: painted-finish correction submitted immediately after edit | 19.4 s | Still rather flat; invented loose hair around tied-up hair. Correct scene/count/formalwear/mask. Not full acceptance; request may have raced the refreshed prompt, so not used as conclusive current-prompt evidence. |
| 3: settled painted-finish request | 20.0 s | Drawn contours and smoothly painted dimensional facial shading materially closer to original, no photographic texture, no caricature head. Scene/bottle/brand/count/outfit/mask correct. However hairstyle became loose shoulder-length and face more idealized: identity acceptance failed. |
| 4: explicit hairstyle/identity preservation | 18.4 s | Clearly drawn, softly shaded face with tied-up locks, one guest, tuxedo/bow tie and held mask. Final side-by-side inspection **failed combined acceptance**: the model replaced the original emerald/gold scene with a beige illustrated ballroom, shifted bottle/composition and changed bottle artwork; facial shapes are still idealized. |

At this historical checkpoint, the photographic-face mismatch was resolved but combined acceptance remained open because of the concrete hairstyle/background drift above. The final character-only preservation pass documented at the top supersedes that open status; expected illustrated facial translation is not an identity failure. A two-stage alternative was not tested or implemented.

### Focused verification
- `bunx vitest run src/lib/image-edit.test.ts src/lib/kiosk.test.ts`: **21 tests passed across 2 files**. Tests assert the actual ordered template/camera inline data, exact discovered model, supported ratio/modalities, absence of incompatible OpenAI/fidelity fields and styling/count/Mariah rules. Initial missing test callback argument caused three failures and a type error; corrected, final tests passed.
- Latest automatic build/type check observed: **2026-10-22T22:49:30Z: build OK**. No manual builds/typechecks or broad browser/email tests repeated. Browser MIME handling changed but a fresh browser result/export check was not run; API/model output was visually inspected privately.
- Tracked-path scan found no private outputs/input/comparison media. External email remains unchanged and user-reported fixed. The image-generation skill shaped the supported alternate request contract.

## Template-first correction — 2026-10-22, 22:39–22:44 UTC

### Contract and changes
- Actual upstream `image[]` order is now **image 1: server-selected original template; image 2: guest camera identity/clothing reference**. `src/lib/image-edit.ts` builds the multipart body used directly by `/api/generate`; all scene/guest, position, bystander, Mariah-left and template-right prompt references were updated consistently. Browser-supplied templates remain ignored.
- Replaced the prior lengthy mixed instructions with template-edit directions, then added focused facial-rendering guidance based on enlarged comparisons. Original framing/branding/bottle placement, natural heads, guest count, automatic visible-clothing formalwear and no gender classification remain. No global cartoon prohibition, new model, credentials, camera/UI or email changes.
- Three new byte-order tests inspect actual multipart files and payload settings for all three scenes, not merely prompt order. Initial tests failed because the DOM File implementation lacks `.text()`; a Node test environment conflicted with shared DOM setup. Final tests use the DOM FileReader to assert concrete template/camera bytes. No runtime file-selection path was introduced.

### Three actual private Black Irish attempts (maximum reached)
All used the unchanged authorized source already in `/tmp`, guestCount=1, through updated local `/api/generate`, with the existing image-edit model. No provider errors or retries. Outputs, enlarged crops and side-by-side comparison stayed under `/tmp/browser/illustration`; no guest UI screenshots or tracked/public media.

| Attempt | Response and elapsed time | Actual inspection |
|---|---|---|
| 1: template-first concise prompt | HTTP 200, 30.7 s | Correct original cream/emerald/gold layout, upper-left brand and lower-left bottle; exactly one recognizable guest, tuxedo/white shirt/bow tie, held mask and uncovered eyes, no bystanders. Side-by-side and enlarged face comparison **failed style acceptance**: realistic skin detail, fine beard hairs and forehead wrinkles contrast with the original's smooth graphic face. |
| 2: explicit ink contours and painted shapes | HTTP 200, 31.5 s | Same correct count/scene/outfit/mask, drawn suit edges; enlarged face still realistic with granular skin and detailed beard. **Failed style acceptance**. |
| 3: drawing technique prioritized over literal photo fidelity | HTTP 200, 32.2 s | More visibly simplified outlined hands, clothing and facial contour/shadow treatment; recognizable guest and natural proportions, correct scene/count/outfit/mask/branding. Enlarged face still has more realistic forehead/skin and beard detail than the original artist's characters. **Not a completed style match**. |

No MEXXO/Mariah generation was made: Black Irish did not meet style acceptance, so all three iterations were used for focused correction. No further requests were made in that turn. The iteration cap was not a user budget/approval requirement; style QA remains open and authorized until solved. No alternate model was selected or claimed verified in that pass.

### Verification and external email status
- `bunx vitest run src/lib/kiosk.test.ts src/lib/image-edit.test.ts src/lib/send-dedupe.test.ts src/test/app-routing.test.tsx`: **28 tests passed in 4 files**, including all three actual multipart byte-order contracts and consistent prompt-role/count/formalwear rules.
- Latest automatic Lovable build/type signal observed: **2026-10-22T22:42:53Z: build OK**. No manual build/type command run. No broad browser/email suite repeated because UI/email were unchanged; prior browser coverage remains historical.
- Tracked-path inspection found no private input/output/crop copies. No guest storage added. No real emails sent and no publication performed.
- User-reported external Vercel email correction is live at `ffed3994c7170ace0c5ea079dbbbc0425a4dc0f7`: “Great connections” removed, “A royal portrait.” retained, 30 API/mock-email checks passed, no real emails. These are **user-reported external results**, not tests rerun here. Lovable's email integration remains unchanged.
- Image-generation skill guidance shaped reference-role/order and template-edit instructions. Remaining open requirement is full illustrated facial-style acceptance, not transport/count/likeness/branding operation.

## Reference illustration correction — 2026-10-22, 22:29–22:39 UTC

All generation results below this section predate the illustration correction and are **historical**, including the formerly successful photoreal identity checks. They do not establish current reference-style compliance.

### Changes and reference inspection
- Visually inspected all three actual server-bound scene assets before editing. Black Irish and MEXXO have strong drawn contours, painted fashion shading, foreground bottles and upper-left branding; Mariah has softer facial treatment and an emerald/burgundy chandelier composition. No scene asset or image-edit transport/model was replaced.
- Prompt now makes image 2 the authoritative style AND composition target; image 1 supplies identity, pose and visible clothing only. Faces must be re-rendered with painted color planes/contours rather than photographic texture. Explicitly excludes photoreal output, photo-face pasting, caricature, enlarged heads and plastic 3D/cartoon substitutes. Pulled-back fashion framing added after early outputs were too close to the source selfie.
- Camera-only capture, automatic visible-clothing matching, guest counts, Mariah rules, masks, email and reset logic unchanged. No customer-facing “Great connections” occurrence found anywhere in tracked source, so no email integration edit was needed; external email HTML is user-managed.

### Actual private AI results through updated local app API
Authorized original test photograph was copied unchanged to temporary private storage. No guest media entered source/assets/public/manifests or public UI screenshots. Requests used the existing app `/api/generate` with scene, guestCount=1 and camera JPEG; server still supplies the selected original reference to the existing image-edit API.

| Run | Actual result | Visual assessment |
|---|---|---|
| First Black Irish prompt | HTTP 200, 34.0 s | One recognizable guest, black tuxedo/white shirt/bow tie, mask beside face, no bystanders, original emerald/cream/gold set and lower-left bottle. Illustrated clothing, but face too photographic and framing too close. Not a full style pass. |
| First MEXXO prompt | HTTP 200, 32.8 s | One recognizable guest, correct tuxedo and held mask; teal/red MEXXO lettering, agave and foreground bottle distinct from Black Irish. Painted suit, but photographic facial detail remained. Not a full style pass. |
| Strengthened Black Irish, actual fake-camera countdown/review request | HTTP 200, 31.5 s | One recognizable guest, natural proportions, knee-up fashion framing, painted suit/hands, held mask with uncovered eyes, no other people, Black Irish logo/bottle and emerald/gold arrangement. Framing improved substantially. Facial skin/hair still more realistic than the original's strongly illustrated face: **remaining art-direction mismatch**. |
| Strengthened MEXXO, direct app API request | HTTP 200, 31.3 s | One recognizable guest, knee-up tuxedo, painted fabric/hands, held feather mask and uncovered eyes, no extras; MEXXO red/teal logo, agave, lime and lower-left bottle match this reference's composition. Facial treatment still too realistic relative to original: **remaining art-direction mismatch**. |

Four real AI requests total, no automatic or manual retries of failed AI responses; all returned images. No Mariah generation or additional guest-count generation in this focused pass. No real emails sent. The outputs improve composition/reference specificity but are not claimed as complete illustration-style compliance; model fidelity remains a review limitation despite explicit prompt constraints.

### Tests and UI verification
- `bunx vitest run src/lib/kiosk.test.ts src/lib/send-dedupe.test.ts src/test/app-routing.test.tsx`: **25 tests passed across 3 files**. Five new cases cover authoritative illustration roles, painted facial rendering/framing, no affirmative photoreal instruction, excluded substitute styles and cohesive Mariah treatment. Existing clothing/count/privacy/delivery/routing tests remain passing.
- An initial test parser treated a Mariah negative photographic clause as affirmative; made that exclusion its own negative sentence, then reran successfully. A simultaneous earlier run read the pre-edit version and failed; final runs passed.
- Browser harness initially clicked before hydration (no camera started), then reached real Black Irish generation successfully but used the wrong role for Save image (it is a link). To avoid another paid request, subsequent browser runs replayed the **existing private generated result**, with generation explicitly mocked, through real fake-camera countdown, review, generating, result and Finish. Those checks passed with no page errors. The prior 31.5 s real response was saved and visually inspected independently; this is not a claim of an uninterrupted real-result browser run.
- At 1080×1920 and 390×844: home and denied-camera/reset screens checked; no file inputs, Upload text, manual wardrobe controls or horizontal overflow. Actual fake-camera live/countdown/review/generating/result/reset checks passed at kiosk size; no new all-state mobile suite, media-race or queued-email browser suite was run. Existing corresponding unit tests passed and earlier browser coverage remains historical.
- Source audit found no runtime file-picker/drop/paste path or visible avatar, no tracked private photo/output copy, and correct app-specific home metadata. Only home and denied-camera screenshots were captured; no private guest UI screenshots.
- Automatic Lovable build/type checks: latest observed entry **2026-10-22T22:32:49Z: build OK**. No manual build/type commands run because Lovable handles these automatically.

### Status
Not published. No integration changes, credentials added, emails sent or guest storage introduced. The image-generation skill shaped reference-role and painted-rendering instructions. Private QA scripts/media stay under `/tmp/browser/illustration`. Remaining limitation: faces still render more realistically than the supplied Black Irish/MEXXO illustrations, despite improved fashion framing and correct scene specificity.

## Historical coverage — before camera-only correction
The upload/manual-wardrobe cases below describe the former implementation only. They do not describe current guest behavior or current request fields.

No guest images, likenesses or personal data are stored in this repo. Test photos lived only in sandbox /tmp.

## Real AI generation (Lovable AI image edits, server-bound scene references)
| Test | Fixture | Result |
|---|---|---|
| Black Irish, 1 guest, Tuxedo | authorized private fixture (has background bystanders) | PASS: exactly 1 person, likeness kept, black tuxedo, green/gold set, bystanders excluded. Mask was worn over eyes, so the prompt now asks for a held mask beside the face (not re-run). |
| With Mariah Carey, 1 guest, Tuxedo | authorized private fixture | PASS: exactly 2 people, Mariah left, guest replaces reference right person, tuxedo |
| Black Irish, 3 guests, Tuxedo/Gown/Tuxedo | synthetic 3-person | PASS: exactly 3 people, clothing matches per position |
| Earlier pass: Mariah 2 guests; MEXXO 1 guest | synthetic | PASS |
| Browser-supplied reference is ignored; missing photo -> 400 | — | PASS |

## Automated unit tests (vitest)
Scenes = 3; count + Mariah logic; per-guest wardrobe binding; foreground-only prompt; name 2–120; payload-hash keys with long emails; concurrent duplicate shares success; concurrent duplicate shares failure then retry re-sends; confirmed success not re-sent. All pass.

## Browser regressions (Playwright, AI + email delivery MOCKED)
PASS: no avatar/Blue/Bartenura text; 3 cards; 3-guest wardrobe controls unclipped at 1080px, all ≥48px; Start over during countdown returns home with no capture and no camera; late getUserMedia after Back is stopped; generation failure shows message + Try again works; 1-char name blocks Review; 190+ char email sent untruncated; queued "Send when ready" sends exactly once only after the portrait exists; Try another look disabled while sending; new portrait not auto-sent; Finish clears session; phone 390x844 Create/Upload visible without scrolling, no horizontal overflow, cards side by side.

## Email delivery
No real email sent. Upstream contract checked only with an invalid payload (returns 400 "Missing required fields", cannot send). Real delivery is pending a user-approved recipient test.

## Final production verification (published https://royal-wine-masquerade.lovable.app, 2026-10-22 ~19:56 UTC)
- Home page: HTTP 200, title "Royal Wine Masquerade — Photo Kiosk". No deployment failure observed.
- Public brand assets (logo, Black Irish, MEXXO, Mariah cards): all HTTP 200 image/jpeg.
- Published /api/generate, Black Irish, 1 primary guest, Tuxedo, authorized private fixture (with background bystanders): HTTP 200 in 34.7 s (single request, no retry). Output inspected: PASS — exactly one recognizable guest, black tuxedo with bow tie, cream/emerald/gold Black Irish set, no background people, mask held on a stick beside the face (eyes uncovered). Fixture and output kept in sandbox /tmp only.
- No emails sent.


## Current camera-only / automatic outfit correction — 2026-10-22, 20:36–20:46 UTC

### Final behavior
- Exactly three original branded scenes, no avatar. Guests choose scene and 1–3 people only; no file picker, hidden file input, drop/paste selection, upload fallback or manual wardrobe controls.
- Camera denial, missing camera API, unavailable device and disconnected stream show camera guidance and Retry camera / Start over; capture is absent or disabled until a live decoded frame exists.
- Mirrored full-frame preview (contain rather than cropping); JPEG capture uses the whole unmirrored video frame. Five-second countdown, review, retake, retry, download and optional explicitly confirmed email remain.
- Server accepts exact multipart guestCount values 1, 2, 3, validates the numeric integer rule, and ignores legacy wardrobes. Visible dress/skirt maps to scene gown; separates/trousers/suits and ambiguous/cropped outfits map to black tuxedo, white shirt and bow tie. No gender classifier, gender response fields or manual questionnaire.

### Real AI camera end-to-end
PASS: Black Irish, guestCount=2, synthetic two-distinct-guest fixture with clearly visible shirt/trousers on the left and dress on the right. Chromium fake video capture supplied the frame; the browser countdown captured JPEG and submitted scene + guestCount + guest only, with no wardrobes field. `/api/generate` returned HTTP 200 in **82.4 seconds** (end-to-end browser measurement). Raw result and composited result were inspected: exactly two recognizable synthetic guests in original order; left outfit is black tuxedo with white shirt and bow tie; right outfit is emerald floor-length gown; no extra guests; masks held beside faces with eyes uncovered; Black Irish setting, bottle and branding present. The result read back through the actual UI with Save image and Finish. No gender identity was identified or recorded.

An earlier real verification request reached the gateway successfully (HTTP 200), but its browser harness stopped because Playwright did not expose multipart request bytes. Its output was not visually verified. The second request above fixed the inspection using browser FormData interception. No further real generation was repeated after success. Synthetic input, camera frames, generated outputs and screenshots remained in `/tmp/browser`; no private guest photo was used in this correction and no test images were added to source or public assets.

### Browser regressions in Lovable sandbox
PASS at **1080×1920** and **390×844**, using real Chromium fake-camera capture and mocked generation/email responses for regression cases:
- Initial, live camera, countdown, review, generating, error/retry, result and reset: no Upload text, file inputs, wardrobe buttons, inline drop/paste handlers or horizontal overflow. Source scan found no runtime file-picker/drop/paste path or file-selection query alternative. Screenshots inspected at both sizes, including full-frame live preview, denied camera, initial and result layouts.
- Camera denied (`NotAllowedError`), unavailable (`NotFoundError`), missing mediaDevices: clear guidance, Retry camera and Start over; no capture or alternative photo-selection control. Retry/reset exercised at both sizes.
- Five-second countdown reset: after waiting beyond capture time, home stays visible, no camera, no generation request. Review/retake works with the camera only.
- Mirroring verified through computed CSS scale; camera JPEG has original left-to-right ordering and all foreground guests in frame (768×1080 negotiated capture). Pixel comparison against resized synthetic input: unmirrored mean error 16.71 versus mirrored 54.82. Initial comparison assumed fixture dimensions instead of negotiated camera dimensions; that harness assertion was corrected.
- Generation failure shows the actual mock message; explicit Try again succeeds. Request inspection confirms scene=black-irish, guestCount=2, JPEG snapshot and no wardrobes on each request.
- One-character required name blocks Review; confirmed optional email queues without premature send, then sends exactly once after a portrait exists. Edits preserve draft; another portrait does not auto-send; email draft survives another look; Finish resets the session. Every email request was intercepted and mocked; **no real emails sent**.
- Late permission after Start over stops the superseded stream; delayed JPEG blob encoding after Start over cannot revive review.
- Additional final edge checks at both sizes: disconnected camera disables capture and Retry camera restores it; Cancel timer invalidates a pending blob so late encoding cannot enter review. Full-frame mirrored preview screenshots inspected.
- Server rejects missing guestCount and 0, 4, 2.5, 2.0, 02 with HTTP 400 even when legacy wardrobes are supplied. These invalid requests never invoke AI.

### Automated checks
PASS: `bunx vitest run src/lib/kiosk.test.ts src/lib/send-dedupe.test.ts src/test/app-routing.test.tsx` — **20 tests in 3 files**. Includes exact three scenes; integer 1–3 validation and strict multipart parsing; per-position independent automatic styling; three scene gown colors; separates and ambiguous tuxedo defaults; prohibition of gender classification/personal-appearance outfit inference; guest counts, Mariah positioning/count, bystander exclusion, identity/mask constraints; required name; long-email payload hashes; concurrent duplicate success/failure and retry; confirmed-success dedupe; root routing.

Lovable automatic build/type checks: latest entry **2026-10-22T20:44:30Z: build OK**. Earlier type errors from obsolete wardrobe-array tests were corrected. No runtime page errors were reported by the completed browser runs. Build/type commands were not manually rerun because Lovable automatically performs them.

### Remaining limits and deployment
No known remaining app errors from this pass. Real generation verified for Black Irish/two synthetic guests; MEXXO and Mariah automatic gown rules have unit coverage but were not separately regenerated during this focused pass. Browser email coverage is mocked; real email delivery remains unverified pending a user-approved recipient. No publication/deployment tool was called; the previously published version is unchanged. Current revision is recorded in the final chat after source documentation is saved.

The image-generation skill shaped the prompt and preserved existing image-edit protocol/model. Browser scripts and evidence are temporary QA material under `/tmp/browser/camera-only`, not app assets.
