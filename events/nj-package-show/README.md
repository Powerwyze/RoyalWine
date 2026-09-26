# Royal Wine / Kedem — NJ Package Show

DEMO-009 · October 28, 2026. The voice-photo kiosk is an isolated application in `events/nj-package-show` in the existing RoyalWine repository. Vercel root directory: `events/nj-package-show`; output: `public`. Existing gallery/capture source and its drkiosk5 deployment remain intact. Work runs remotely: GitHub source, Actions Blender/dependencies/tests, and Vercel deployment.

Blue is an original product-inspired AI guide, built around Bartenura's recognizable cobalt bottle and dark-blue capsule. Its face sits above the official Bartenura brand panel. A separate black-glass, green-capsule Black Irish display and a Kedem exhibition plinth tie it to this client's portfolio. The geometry and matching SVG fallback are designed for this event; this is an original character concept, not official retail packaging or an approved brand mascot. No real employee or celebrity likeness is used. Mouth animation, blinking and small listening tilts remain audio-reactive, not phoneme-perfect lip sync. No official catchphrase is invented.

The navy/cobalt/gold gallery portrait setting is imaginative, not a claim about the venue. Official Kedem, Bartenura and Black Irish logo assets appear in the interface. While generation runs, the host asks about guest/buyer interests, listens, gives one relevant product fact, and follows up or offers a booth-staff handoff. Known names, company and preferences are remembered only within the visit. Silence, interruptions and delays are handled without repeated pitches. See `lib/royal-wine-event.js` for the bounded fact sheet.

Product-form references: https://royalwine.com/wines/bartenura-moscato-750ml/ and https://royalwine.com/spirits-liqueurs/black-irish-original-liqueur-750-ml/. The source's Bartenura cobalt bottle and Black Irish black/green packaging inform the silhouette/materials. Existing official logo assets remain intact. Original decorative labels make no product-specification claims.

## Setup and operator activation

The public `/setup` page lists required server-only Vercel variables: `OPENAI_API_KEY`, `WYZER_GMAIL_USER`, `WYZER_APP_PASSWORD`; `ENABLE_FACE_HOST=true` enables the host. Optional image overrides: `OPENAI_IMAGE_MODEL` (gpt-image-2), `OPENAI_IMAGE_SIZE` (768x1152), `OPENAI_IMAGE_QUALITY` (low). An already configured Resend sender is supported. No credentials belong in source, sheet, emails or browser. Internal build notifications are separate from guest photo email; no marketing enrollment or BCC is added.

User-authorized handoff: **BUILD COMPLETE — KEYS PENDING**. Missing configuration shows a branded waiting screen and starts no microphone/camera/provider requests. Add Production credentials, redeploy the current production deployment, refresh, and enable sentry once. Verify actual voice and captions, explicit count/readiness, five-second countdown, one independently checked generated portrait, delivery to an authorized test inbox, and visit reset. Presence checks are not proof of working credentials. Until these pass the app is not event-ready.

## Sources and provenance

Brief/date/features: user task-sheet DEMO-009, with the user's subsequent requirement that avatars visibly relate to the client, brand or event. Facts verified September 24, 2026 at https://royalwine.com/brand/bartenura/, https://royalwine.com/brand/black-irish/, https://goblackirish.com/ and https://goblackirish.com/pages/about. The supplied www.kedem.com was unavailable. Brand facts do not establish show stock, pricing, pours or distribution. Staff must confirm those and specific labels/allergens/service eligibility. Do not infer visitor age/religion, promote to a stated minor, or insert drinking/handheld alcohol props into portraits.

Official logos: https://royalwine.com/wp-content/uploads/2020/06/KedemFullColorLogo-152x0-c-default.png, https://royalwine.com/wp-content/uploads/2020/03/bartenura-logo-e1587649879353-152x0-c-default.jpg, https://royalwine.com/wp-content/uploads/2023/03/Black-Irish-Logo_1-01-152x0-c-default.png.

Behavior adapted from the verified Royal Wine Florida/Bytesbee voice-kiosk lineage. Event facts, art, product-inspired host, generation conversation, image prompt and email were deliberately adapted for this separate trade event. Three.js and MediaPipe license files are bundled.

## Remote verification

Root workflows `nj-kiosk-build.yml` and `nj-kiosk-verify-published.yml` run in this application directory. Regression suite: `npm test`; full mocked-provider portrait/phone browser flow: `node tests/host.e2e.mjs`. Tests cover capture timing, presence, guest-only inactivity, group/identity checks, confirmation/retry, cleanup, private captions and missing configuration. Mocks are test-only. After activation, real provider tests accept `ROYAL_WINE_NJ_KIOSK_URL`; paid image and email test destinations require authorized test use. The published workflow verifies anonymous production, assets, responsive screenshots and honest activation status.

## Shared provider activation

Link the team Secrets `OPENAI_API_KEY`, `OPENAI_BACKUP` and `RESEND_API_KEY` plus shared `RESEND_FROM_EMAIL=wyzer@powerwyze.com`. Set `RESEND_REPLY_TO` to this client's confirmed contact in project settings. Never copy a different client's address.

All OpenAI requests use the primary key first. A confirmed credit/quota rejection is retried once with the backup, with the same payload and deadline. Rate limits, authentication/access errors, timeouts and uncertain network failures do not replay paid work. The backup needs its own available credits and access to the same models; keys on the same exhausted billing account do not add credits. Existing active voice sessions cannot change credentials in place; reconnecting creates a new session through the guarded credential path.

`.github/workflows/provider-activation.yml` runs remote regression/browser checks. Its explicit `live` dispatch verifies the deployed voice session, one real image request with independent subject checking, and one photo email to the authorized internal test mailbox when client Reply-To is configured. No secret values are read or logged. Configuration presence alone is not live verification.
