# Royal Wine Masquerade

Camera-only event photo kiosk built and verified in Lovable cloud. Exactly three scenes: Black Irish Masquerade, MEXXO Masquerade, and With Mariah Carey. No avatar, guest uploads, file selection, or manual wardrobe controls.

## Guest experience
Choose a scene and 1–3 guests. Use the mirrored camera preview, five-second countdown and unmirrored full-frame JPEG capture, then review or retake. Camera denial/unavailability offers guidance, Retry camera and Start over only; capture waits for a live decoded frame. Generate the portrait, download it, or explicitly confirm optional email (email first, required trimmed name 2–120 characters). Finish clears browser session data. Late camera/capture results cannot revive a reset session.

## Automatic formalwear
Each primary foreground guest’s visible dress/skirt becomes the scene’s floor-length gown: emerald for Black Irish, teal for MEXXO, burgundy/emerald next to Mariah. Visible separates/trousers/suits or ambiguous/cropped outfits become a black tuxedo with white shirt and bow tie. This is artistic clothing matching, not gender classification; no gender labels, questionnaire or manual styling choice are used.

The server validates `guestCount` as integer 1–3, ignores legacy `wardrobes` fields, and binds the scene reference itself. Prompts preserve recognizable identities and exact primary-guest count, exclude bystanders, and keep masks held beside faces with uncovered eyes. Mariah adds exactly one reference Mariah on the left and replaces the other reference guest.

## Privacy and architecture
Guest photos and portraits live only in browser memory, not application storage. The browser posts its camera JPEG, scene and guestCount to `/api/generate`; Lovable AI receives camera photo and server-bound reference. Email goes through `/api/send-photo` to the existing Royal Wine delivery service, only after confirmation. Payload-hash dedupe counts only confirmed upstream success.

## Verification
`bunx vitest run src/lib/kiosk.test.ts src/lib/send-dedupe.test.ts src/test/app-routing.test.tsx` runs focused rules, delivery and routing regressions. Build/type checks run automatically in Lovable. Browser regression scripts are documented in `docs/QA-REPORT.md`; synthetic camera fixtures and generated outputs remain in sandbox `/tmp`, never source or public assets. Earlier upload/manual-wardrobe coverage is historical, not current behavior. Real email delivery still requires a user-approved recipient test.

Built with TanStack Start, React, TypeScript and Tailwind CSS. Publication is a separate user-reviewed deployment action.
