# QA report — Royal Wine Masquerade kiosk (correction pass, 2026-10-22)

No guest images, likenesses or personal data are stored in this repo. Test photos lived only in sandbox /tmp.

## Real AI generation (Lovable AI image edits, server-bound scene references)
| Test | Fixture | Result |
|---|---|---|
| Black Irish, 1 guest, Tuxedo | authorized private fixture (has background bystanders) | PASS: exactly 1 person, likeness kept, black tuxedo, green/gold set, bystanders excluded. Mask was worn over eyes, so the prompt now asks for a held mask beside the face (not re-run). |
| With Mariah Carey, 1 guest, Tuxedo | authorized private fixture | PASS: exactly 2 people, Mariah left, guest replaces reference right person, tuxedo |
| Black Irish, 3 guests, Tuxedo/Gown/Tuxedo | synthetic 3-person | PASS: exactly 3 people, clothing matches per position |
| Earlier pass: Mariah 2 guests; MEXXO 1 guest | synthetic | PASS |
| Browser-supplied reference is ignored; missing photo -> 400 | — | PASS |

## Automated unit tests (vitest)
Scenes = 3; count + Mariah logic; per-guest wardrobe binding; foreground-only prompt; name 2–120; payload-hash keys with long emails; concurrent duplicate shares success; concurrent duplicate shares failure then retry re-sends; confirmed success not re-sent. All pass.

## Browser regressions (Playwright, AI + email delivery MOCKED)
PASS: no avatar/Blue/Bartenura text; 3 cards; 3-guest wardrobe controls unclipped at 1080px, all ≥48px; Start over during countdown returns home with no capture and no camera; late getUserMedia after Back is stopped; generation failure shows message + Try again works; 1-char name blocks Review; 190+ char email sent untruncated; queued "Send when ready" sends exactly once only after the portrait exists; Try another look disabled while sending; new portrait not auto-sent; Finish clears session; phone 390x844 Create/Upload visible without scrolling, no horizontal overflow, cards side by side.

## Email delivery
No real email sent. Upstream contract checked only with an invalid payload (returns 400 "Missing required fields", cannot send). Real delivery is pending a user-approved recipient test.

## Final production verification (published https://royal-wine-masquerade.lovable.app, 2026-10-22 ~19:56 UTC)
- Home page: HTTP 200, title "Royal Wine Masquerade — Photo Kiosk". No deployment failure observed.
- Public brand assets (logo, Black Irish, MEXXO, Mariah cards): all HTTP 200 image/jpeg.
- Published /api/generate, Black Irish, 1 primary guest, Tuxedo, authorized private fixture (with background bystanders): HTTP 200 in 34.7 s (single request, no retry). Output inspected: PASS — exactly one recognizable guest, black tuxedo with bow tie, cream/emerald/gold Black Irish set, no background people, mask held on a stick beside the face (eyes uncovered). Fixture and output kept in sandbox /tmp only.
- No emails sent.
