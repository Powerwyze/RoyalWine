# Royal Wine Masquerade — Lovable source export

Live app: https://royal-wine-masquerade.lovable.app
Editor: https://lovable.dev/projects/d9ad4bcc-97d5-4e4e-ad57-56ebb5cc3312
Lovable source commit: 8666e63101d9c769c73f254b6280d7d6c1275625
Exported: 2026-10-22.

This is a source snapshot in the intended Powerwyze/RoyalWine repository, not an automatically synchronized Lovable GitHub connection. Continue editing, dependency installation, builds and tests in Lovable or another approved remote environment.

## Product

A camera-only portrait photo kiosk with exactly three choices: Black Irish Masquerade, MEXXO Masquerade, and an AI masquerade portrait with Mariah Carey. The avatar is removed. Guests select one to three foreground people; there are no upload inputs, upload fallbacks, drag/drop or paste import routes, or manual outfit controls. The camera has a five-second countdown, review/retake, generation, image download, optional confirmed photo email and session reset. Camera failure offers retry and start over.

Formalwear is assigned automatically from visible clothing only: dresses or skirts become the selected scene's gown; separates, trousers or suits become a tuxedo. Cropped or ambiguous clothing defaults to a tuxedo. The app does not classify gender or choose clothing from faces, hair, body, or presumed gender. The generation API validates an exact guestCount of 1, 2 or 3 and ignores legacy wardrobe fields.

Generation sends the camera photo and the server-selected supplied scene reference to Lovable's image-editing service. The two brand scenes request only the selected foreground guests; the Mariah scene requests those guests plus one Mariah, replacing the other reference person. Runtime AI calls use the Lovable-managed LOVABLE_API_KEY; no secret is included in this export.

Photo email is forwarded server-side to the existing Royal Wine Vercel delivery service. It requires email plus name (2–120 characters), confirms the address, supports Send when ready, and deduplicates complete payloads. This external delivery service must remain available. Real email delivery has not been tested.

## Assets and privacy

The four user-supplied brand/reference JPEGs and generated logo favicon are included. The JPEGs are copied into public paths matching the Lovable asset manifests so they remain available with this source export. No private test photo, generated guest likeness, contact data, environment file, dependency installation, or build output is included. Guest source and output images are not persisted by the app; processing still involves the AI service, so this is not a claim about provider retention.

The existing app in ../nj-package-show and its Vercel production deployment are unchanged by this export.

## Verification

See docs/QA-REPORT.md. Development and testing ran in Lovable cloud. Twenty automated tests passed. Browser checks at 1080×1920 and 390×844 covered removal of upload/outfit controls, camera denial/unavailability, disconnected tracks, full-frame mirrored preview and unmirrored capture, countdown cancellation, reset races, generation retry, contact validation, queued sending, deduplication and session cleanup. Email was mocked.

A real camera-flow generation with two synthetic guests completed in 82.4 seconds: the guest in separates received a black tuxedo with white shirt and bow tie, and the guest in a dress received an emerald gown. Exactly two guests remained. MEXXO and Mariah automatic-styling prompts were unit tested; historical real generation tests for all three scenes predate this camera-only correction. No real email was sent. Synthetic test fixtures, generated outputs and browser screenshots remain outside this repository.
