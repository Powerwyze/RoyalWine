# Royal Wine Masquerade — Lovable source export

Live app: https://royal-wine-masquerade.lovable.app
Editor: https://lovable.dev/projects/d9ad4bcc-97d5-4e4e-ad57-56ebb5cc3312
Lovable source commit: 608228eb7db9cf8788cb3a83b42a500024f0bfc9
Published application code: 12920b9fa26aa55f699b42cfa063374140330312 (the subsequent commit only updates QA documentation).
Exported: 2026-10-22.

This is a source snapshot in the intended Powerwyze/RoyalWine repository. It is not an automatically synchronized Lovable GitHub connection. The scaffold README describes optional Git synchronization; that has not been configured for this export. Continue editing, dependency installation, builds and tests in Lovable or another approved remote environment.

## Product

A portrait photo kiosk with exactly three choices: Black Irish Masquerade, MEXXO Masquerade, and an AI masquerade portrait with Mariah Carey. The avatar is removed. Guests select one to three people and Tuxedo or Gown for each foreground person, left to right. The camera has a five-second countdown, review/retake, upload fallback, generation, image download, optional confirmed photo email and session reset.

Generation sends the guest photo and the server-selected supplied scene reference to Lovable's image-editing service. The two brand scenes request only the selected foreground guests; the Mariah scene requests those guests plus one Mariah, replacing the other reference person. Runtime AI calls use the Lovable-managed LOVABLE_API_KEY; no secret is included in this export.

Photo email is forwarded server-side to the existing Royal Wine Vercel delivery service. It requires email plus name (2–120 characters), confirms the address, supports Send when ready, and deduplicates complete payloads. This external delivery service must remain available. Real email delivery has not been tested.

## Assets and privacy

The four user-supplied brand/reference JPEGs and generated logo favicon are included. The JPEGs are copied into public paths matching the Lovable asset manifests so they remain available with this source export. No private test photo, generated guest likeness, contact data, environment file, dependency installation, or build output is included. Guest source and output images are not persisted by the app; processing still involves the AI service, so this is not a claim about provider retention.

The existing app in ../nj-package-show and its Vercel production deployment are unchanged by this export.

## Verification

See docs/QA-REPORT.md. Development and testing ran in Lovable cloud. Thirteen automated checks passed. Cloud browser checks covered kiosk/phone layouts, camera reset races, countdown, retries, email drafts, queued sending, long addresses, and concurrent delivery outcomes using mocked email. Real image generation was checked across all three scenes, including one-, two- and three-guest examples. The final published Black Irish test completed successfully in 34.7 seconds with the held-mask prompt. No real email was sent.
