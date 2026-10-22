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
- AI generation goes through `src/routes/api/generate.ts` (Lovable AI image edits, guest photo + scene reference as two images); email goes through `src/routes/api/send-photo.ts`, which forwards to the existing Royal Wine delivery service. Browser never calls either upstream directly.
- Guest photos/portraits stay in browser memory only; no database or storage for guest data.
- Scene reference images are bound server-side in `/api/generate`; the browser sends only the camera JPEG, selected scene and guestCount (integer 1–3); ignore legacy wardrobes fields so callers cannot override automatic styling.
- Email dedupe lives in `src/lib/send-dedupe.server.ts`, keyed by a SHA-256 of the full payload; only confirmed upstream `{ok:true}` counts as sent.

- Guest capture is camera-only with no file-selection handlers or fallback paths; this keeps all guest capture behind live-camera readiness and operation-token race protection.
- Formalwear is matched independently to each primary guest’s visible clothing, never gender or other personal appearance; this avoids classification and preserves the guest-count contract.
- Camera preview is mirrored; canvas capture uses the complete unmirrored video frame and is enabled only after a live stream has a decoded frame, preventing empty captures.
