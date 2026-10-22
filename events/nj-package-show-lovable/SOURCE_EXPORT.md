# Royal Wine Masquerade — Lovable source export

Live app: https://royal-wine-masquerade.lovable.app
Editor: https://lovable.dev/projects/d9ad4bcc-97d5-4e4e-ad57-56ebb5cc3312
Lovable source commit: 8b83d6ea650c07b28dd6a0d3e256ed87ad877144
Exported: 2026-10-22.

This is a source snapshot in Powerwyze/RoyalWine, not an automatically synchronized Lovable GitHub connection. Continue editing, dependency installation, builds and tests in Lovable or another approved remote environment.

## Product and generation

A camera-only portrait kiosk with exactly three choices: Black Irish Masquerade, MEXXO Masquerade, and an AI masquerade portrait with Mariah Carey. No avatar, upload/import fallback or manual outfit controls. Guests choose one to three foreground people and use the five-second camera countdown, review/retake, generation, download, optional confirmed photo email and reset.

Generation now uses the documented native Lovable Gemini 3 Pro Image editor (google/gemini-3-pro-image) to match the supplied scenes' softly painted illustration style, including faces and hair. The server-selected original scene is image 1/base artwork; the camera photo is image 2/identity and clothing reference. The prompt edits guest characters while retaining the reference's brand palette, setting, architecture, bottle and label placement. The two brand scenes contain only selected foreground guests; the Mariah scene contains those guests plus exactly one Mariah. Natural artist-translated likeness and hand-painted detail variation are expected.

Formalwear follows visible clothing only: dresses/skirts become the scene gown; separates/trousers/suits become a tuxedo; cropped or ambiguous clothing defaults to a tuxedo. The app does not classify gender from appearance.

Normal generation uses one model call, with one bounded retry for transient 429/5xx failures. PNG output is composited in the browser and exported as JPEG for download/email. LOVABLE_API_KEY is managed by Lovable and is not included here.

## Photo email

The server forwards explicitly confirmed photo email to the existing Royal Wine Vercel delivery service. Name (2–120 characters) and email are required; address review, Send when ready, deduplication and reset remain. The shared email heading now says “A royal portrait.”; “Great connections.” was removed in delivery-service commit ffed3994c7170ace0c5ea079dbbbc0425a4dc0f7, deployed as dpl_3us8DNyo5k4BJ1gyJrWct4XgPNKe.

The Vercel service uses existing RESEND_API_KEY, RESEND_FROM_EMAIL and RESEND_REPLY_TO variables. No new credentials were added. The Vercel application otherwise retains its prior behavior. Existing delivered emails are not modified.

## Assets and privacy

The four user-approved brand/reference JPEGs and logo favicon remain included in public paths matching the asset manifests. No private test photo, generated guest likeness, contact data, secret/environment file, dependency installation or build output is included. Private QA media stayed in temporary Lovable sandbox storage. Guest images are not persisted by app code; generation still involves an AI provider.

## Verification

Current Lovable correction: 31 tests passed across prompt, actual upstream template/photo ordering, delivery deduplication and routing. Automatic build/type checks passed. Real Black Irish and MEXXO calls completed in 20.6 s and 19.3 s with recognizable softly illustrated guests, source hairstyle, natural proportions, tuxedos, held masks, reference-specific settings and no bystanders. Earlier unsuccessful experiments remain marked historical in docs/QA-REPORT.md. Mariah and multiple-guest images were not regenerated with the final renderer; their prompt/count rules have test coverage.

The real fake-camera browser flow passed countdown, review, generation, PNG compositing and JPEG download. The mocked email payload contained the exact downloaded JPEG and expected synthetic contact values. No real email was sent.

Delivery service: 30 existing API and mocked-email tests passed in a Vercel cloud validation build of the deployed commit. The live mail endpoint returned the expected GET 405. Real inbox delivery was not retested.
