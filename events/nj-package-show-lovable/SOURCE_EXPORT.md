# Royal Wine Masquerade — Lovable source export

Live app: https://royal-wine-masquerade.lovable.app
Editor: https://lovable.dev/projects/d9ad4bcc-97d5-4e4e-ad57-56ebb5cc3312
Lovable source commit: 6f662807acc284dc6712e7adc46b49e82b2d9360
Exported: 2026-10-23.

This is a source snapshot in Powerwyze/RoyalWine, not an automatically synchronized Lovable GitHub connection. Continue editing, dependency installation, builds and tests in Lovable or another approved remote environment.

## Product and generation

Camera-only portrait kiosk with exactly three choices: Black Irish Masquerade, MEXXO Masquerade, and an AI masquerade portrait with Mariah Carey. No avatar, upload/import fallback or manual outfit controls. Guests select one to three foreground people, use the camera countdown and review/retake, then generate, download, optionally confirm photo email, and reset.

The native Lovable Gemini 3 Pro Image editor receives the server-selected scene as image 1 and the camera identity/clothing reference as image 2. Black Irish also receives the approved standalone logo as image 3. The full clean-pose Black Irish PNG powers its preview and generation directly. Its large outlined lettering, gold/green crest and green Irish Cream script replace the prior plain wall branding. The bottle and drinks remain on the table; no corner logo plaque is composited over the output. Browser export adds only the small AI-created portrait label.

The prompt replaces complete guest bodies and their original limbs, requires two attached arms/hands per person, preserves recognizable illustrated identity and source order, and excludes bystanders. The Mariah choice keeps exactly one Mariah with the selected guests. Formalwear follows visible clothing: dresses/skirts become the scene gown; separates/trousers/suits and ambiguous clothing become a tuxedo. The app does not classify gender from appearance.

Normal generation uses one image-model call, with one bounded retry for transient 429/5xx failures. PNG output is converted to JPEG for download/email. Experimental geometry detection and extra logo compositing were reverted after failed visual tests; those paths are absent from final source. LOVABLE_API_KEY remains managed by Lovable and is not included here.

## Photo email

Confirmed photo email uses the existing Royal Wine Vercel delivery service. Name/email review, explicit Send, deduplication and session reset remain. Its heading says “A royal portrait.”; “Great connections.” was removed in delivery-service commit ffed3994c7170ace0c5ea079dbbbc0425a4dc0f7 (deployment dpl_3us8DNyo5k4BJ1gyJrWct4XgPNKe). Previously delivered emails are not modified. Existing RESEND_API_KEY, RESEND_FROM_EMAIL and RESEND_REPLY_TO settings remain unchanged.

## Assets and privacy

Approved brand/reference assets are included at public paths matching their manifests, including both generated scene-only Black Irish reference revisions. Only the clean-pose PNG is active. No private test input, generated guest likeness, contact data, secret/environment file, dependency installation or build output is included. QA media stayed in temporary remote sandbox storage. App code does not persist guest images; AI-provider retention is not established by this code.

## Verification and limits

41 tests and automatic build checks passed remotely. One real authorized private-photo camera → generation → JPEG flow completed in 21.04 seconds. The full portrait and enlarged anatomy/branding crops were inspected: one recognizable illustrated guest, two attached arms/hands, no retained template bodies, outlined wall/bottle branding, tabletop drinks and no corner plaque. The JPEG download matched the mocked email bytes; Finish cleared the session and no page errors occurred.

A separate real two-guest camera → generation → JPEG flow completed in 27.57 seconds using a privately generated fictional adult fixture. Inspection found two recognizable illustrated guests with two coherent arms/hands each, correct tux/gown mapping, no leftover template person and no corner plaque. Downloaded JPEG bytes matched the mocked email, and Finish/reset passed without page errors. The output reversed source guest order; the woman's face was more glamour-stylized than the fixture. Group ordering and exact facial fidelity are not guaranteed.

Small model-rendered lettering and fine facial details can vary. Prompt instructions and passing samples do not guarantee future anatomy or identity. Mariah and three-guest outputs were not regenerated with this final reference/prompt change. No real email was sent in these checks. Historical failed experiments are retained as such in docs/QA-REPORT.md.

The existing Vercel email service previously passed 30 API/mocked-email tests in a cloud validation build; real inbox delivery was not retested.
