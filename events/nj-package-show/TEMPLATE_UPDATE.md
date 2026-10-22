# Royal Wine kiosk2 layout update

Source reference: Powerwyze/turespana-imex-kiosk at 3724bc14b372b3ddc49a1e80be3a27989ada93b6; https://turespana-imex-kiosk2.vercel.app/.
Client source: Powerwyze/RoyalWine, events/nj-package-show, production base 78430b30f4988b8a2411f78adfd88471319e0752.

The camera-first layout uses a fixed caption band, Royal Wine/Kedem/Bartenura/Black Irish branding, a persistent live camera preview, large touch controls, four distinct art directions, and an illustrated before/after explanation. The existing Blue bottle host, voice model, image provider, independent people check, and Resend sender settings remain in use.

Email appears above the required name during generation. Explicit confirmation queues one delivery until the checked image is ready; image completion preserves unfinished details. Voice failures hand the current visit to the touch controls. Reset clears guest data and resumes the home preview. The existing 1–3 person limit is preserved.

The four looks are original art directions, not claims about the actual venue. UI previews are illustrations, not generated sample guest photos. The user's private reference photo is supplied externally at PHOTO_TEST_REFERENCE for browser tests and must never be committed.

## Verification
- npm test
- PHOTO_TEST_REFERENCE=/secure/path/reference.jpg node tests/template.e2e.mjs
- Browser checks cover all four themes, 1080×1920 and 390×844, five-second shutter, denied microphone, contact confirmation before/after result, delivery failure/retry, duplicate guards, reset, and camera preview recovery. Image/email responses are mocked; these tests do not verify a live provider result or real inbox arrival.

## Production
Project: royal-wine-nj-package-kiosk, team powerwyzes-projects.
Production alias: https://royal-wine-nj-package-kiosk.vercel.app/
Rollback deployment: dpl_96UfQhGQYeEjgvXSyEn3dsjwLaLd.

No new provider variables are required. Existing OpenAI: OPENAI_API_KEY, OPENAI_BACKUP, OPENAI_IMAGE_MODEL, OPENAI_IMAGE_SIZE, OPENAI_IMAGE_QUALITY; host enablement uses ENABLE_FACE_HOST. Existing Resend: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_REPLY_TO.

Marketing enrollment is not activated by this layout update. A Royal Wine Terms URL and an authorized durable consent destination were not established; do not add a decorative opt-in or claim consent persistence. Existing photo delivery remains transactional. Verified Privacy URL: https://royalwine.com/privacy-policy/ (October 22, 2026).
