# QA report — Royal Wine Masquerade kiosk

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
