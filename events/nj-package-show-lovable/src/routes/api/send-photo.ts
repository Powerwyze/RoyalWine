import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { cleanName, isValidEmail, isValidName } from "@/lib/kiosk";
import { clientKey, rateLimited } from "@/lib/rate-limit.server";
import { deliverOnce, payloadKey } from "@/lib/send-dedupe.server";

const DELIVERY_URL = "https://royal-wine-nj-package-kiosk.vercel.app/api/send-photo";
const MAX_B64 = 4_000_000; // ~3 MB JPEG, under the delivery service body limit

const schema = z.object({
  email: z.string().trim().max(254),
  name: z.string().max(200),
  imageBase64: z.string().min(100).max(MAX_B64).regex(/^[A-Za-z0-9+/=]+$/),
});

export const Route = createFileRoute("/api/send-photo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (rateLimited("mail:" + clientKey(request), 10, 10 * 60_000))
          return Response.json({ error: "Too many emails. Please wait a minute." }, { status: 429 });
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Please check your details." }, { status: 400 });
        const { imageBase64 } = parsed.data;
        const email = parsed.data.email.trim();
        const name = cleanName(parsed.data.name);
        if (!isValidEmail(email)) return Response.json({ error: "Please check the email address." }, { status: 400 });
        if (!isValidName(name)) return Response.json({ error: "Please enter your name (2–120 characters)." }, { status: 400 });
        if (!imageBase64.startsWith("/9j/")) return Response.json({ error: "Portrait must be a JPEG." }, { status: 400 });

        const key = await payloadKey(email, name, imageBase64);
        const result = await deliverOnce(key, async () => {
          try {
            const res = await fetch(DELIVERY_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Idempotency-Key": key },
              body: JSON.stringify({
                email,
                name,
                contactVersion: 1,
                filename: "royal-wine-masquerade.jpg",
                mimeType: "image/jpeg",
                imageBase64,
              }),
            });
            const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
            if (res.ok && json?.ok === true) return true;
            console.error("photo delivery failed", { status: res.status }); // no bodies or PII
            return false;
          } catch {
            console.error("photo delivery unreachable");
            return false;
          }
        });
        return result
          ? Response.json({ ok: true })
          : Response.json({ error: "Email could not be sent. Please try again." }, { status: 502 });
      },
    },
  },
});
