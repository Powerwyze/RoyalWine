# Royal Wine / Kedem — NJ Package Show

DEMO-009 · October 28, 2026. The voice-photo kiosk is an isolated application in `events/nj-package-show` in the existing RoyalWine repository. Vercel root directory: `events/nj-package-show`; output: `public`. Existing gallery/capture source and its drkiosk5 deployment remain intact. Work runs remotely: GitHub source, Actions Blender/dependencies/tests, and Vercel deployment.

Julian is an original adult AI guide in a navy business blazer, open ivory shirt and official Kedem badge. The matching SVG fallback preserves the visual identity. Original lightly stylized 3D geometry has realistic business attire, blinking, gentle scanning/listening motion and audio-reactive mouth shapes; it is not a photoreal human or phoneme-perfect lip sync. Host name/appearance are creative defaults because the intake leaves the name open. No official catchphrase is invented.

The navy/cobalt/gold gallery portrait setting is imaginative, not a claim about the venue. Official Kedem, Bartenura and Black Irish logo assets appear in the interface. While generation runs, the host asks about guest/buyer interests, listens, gives one relevant product fact, and follows up or offers a booth-staff handoff. Known names, company and preferences are remembered only within the visit. Silence, interruptions and delays are handled without repeated pitches. See `lib/royal-wine-event.js` for the bounded fact sheet.

## Setup and operator activation

The public `/setup` page lists required server-only Vercel variables: `OPENAI_API_KEY`, `WYZER_GMAIL_USER`, `WYZER_APP_PASSWORD`; `ENABLE_FACE_HOST=true` enables the host. Optional image overrides: `OPENAI_IMAGE_MODEL` (gpt-image-2), `OPENAI_IMAGE_SIZE` (768x1152), `OPENAI_IMAGE_QUALITY` (low). An already configured Resend sender is supported. No credentials belong in source, sheet, emails or browser. Internal build notifications are separate from guest photo email; no marketing enrollment or BCC is added.

User-authorized handoff: **BUILD COMPLETE — KEYS PENDING**. Missing configuration shows a branded waiting screen and starts no microphone/camera/provider requests. Add Production credentials, redeploy the current production deployment, refresh, and enable sentry once. Verify actual voice and captions, explicit count/readiness, five-second countdown, one independently checked generated portrait, delivery to an authorized test inbox, and visit reset. Presence checks are not proof of working credentials. Until these pass the app is not event-ready.

## Sources and provenance

Brief/date/features: user task-sheet DEMO-009. Facts verified September 24, 2026 at https://royalwine.com/brand/bartenura/, https://royalwine.com/brand/black-irish/, https://goblackirish.com/ and https://goblackirish.com/pages/about. The supplied www.kedem.com was unavailable. Brand facts do not establish show stock, pricing, pours or distribution. Staff must confirm those and specific labels/allergens/service eligibility. Do not infer visitor age/religion, promote to a stated minor, or insert drinking/handheld alcohol props into portraits.

Official logos: https://royalwine.com/wp-content/uploads/2020/06/KedemFullColorLogo-152x0-c-default.png, https://royalwine.com/wp-content/uploads/2020/03/bartenura-logo-e1587649879353-152x0-c-default.jpg, https://royalwine.com/wp-content/uploads/2023/03/Black-Irish-Logo_1-01-152x0-c-default.png.

Behavior adapted from the verified Royal Wine Florida/Bytesbee voice-kiosk lineage. Event facts, art, business attire, generation conversation, image prompt and email were deliberately adapted for this separate trade event. Three.js and MediaPipe license files are bundled.

## Remote verification

Root workflows `nj-kiosk-build.yml` and `nj-kiosk-verify-published.yml` run in this application directory. Regression suite: `npm test`; full mocked-provider portrait/phone browser flow: `node tests/host.e2e.mjs`. Tests cover capture timing, presence, guest-only inactivity, group/identity checks, confirmation/retry, cleanup, private captions and missing configuration. Mocks are test-only. After activation, real provider tests accept `ROYAL_WINE_NJ_KIOSK_URL`; paid image and email test destinations require authorized test use. The published workflow verifies anonymous production, assets, responsive screenshots and honest activation status.
