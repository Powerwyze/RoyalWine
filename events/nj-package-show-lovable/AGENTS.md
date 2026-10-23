<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Kiosk rules (scenes, guest-count validation, automatic visible-clothing styling, prompt) live in `src/lib/kiosk.ts` as pure functions with tests; server routes import them so prompts are built server-side only.
- AI generation goes through `src/routes/api/generate.ts` using the documented Gemini image-edit JSON contract in `src/lib/image-edit.ts`: server-approved template first and camera identity/clothing reference second; this alternate renderer produces drawn faces rather than photographic edits. Image output MIME is passed to browser compositing before final JPEG export. Email goes through `/api/send-photo` unchanged; browser never calls either upstream directly.
- Guest photos/portraits stay in browser memory only; no database or storage for guest data.
- Scene reference images are bound server-side in `/api/generate`; the browser sends only the camera JPEG, selected scene and guestCount (integer 1–3); ignore legacy wardrobes fields so callers cannot override automatic styling.
- Approved references live in `src/lib/scene-references.ts`; Black Irish uses the full uploaded clean-pose PNG directly for preview and generation, followed by camera JPEG and approved brand JPEG, while other scenes use two images. Use asset MIME metadata when encoding so PNG bytes are never mislabeled JPEG.
- Keep authoritative reference-style rendering and entire-person replacement/anatomy rules (with the explicit Black Irish tabletop-glass pose exception) in the pure prompt contract with tests; this preserves the selected environment/branding while allowing recognizable softly drawn facial translation instead of photographic pixel fidelity.
- Email dedupe lives in `src/lib/send-dedupe.server.ts`, keyed by a SHA-256 of the full payload; only confirmed upstream `{ok:true}` counts as sent.

- Guest capture is camera-only with no file-selection handlers or fallback paths; this keeps all guest capture behind live-camera readiness and operation-token race protection.
- Formalwear is matched independently to each primary guest’s visible clothing, never gender or other personal appearance; this avoids classification and preserves the guest-count contract.
- Camera preview is mirrored; canvas capture uses the complete unmirrored video frame and is enabled only after a live stream has a decoded frame, preventing empty captures.

- Use the single illustration request and approved third logo reference for Black Irish; browser export adds only attribution, with no experimental geometry/branding overlays, to keep the flow simple.
