import { createFileRoute } from "@tanstack/react-router";
import { buildPrompt, getScene, isValidWardrobes } from "@/lib/kiosk";
import { clientKey, rateLimited } from "@/lib/rate-limit.server";
import blackIrishRef from "@/assets/black-irish-masquerade.jpg.asset.json";
import mexxoRef from "@/assets/mexxo-masquerade.jpg.asset.json";
import mariahRef from "@/assets/mariah-carey-masquerade.jpg.asset.json";

// Server-approved reference per scene; the browser cannot substitute images.
const REFERENCE_URL: Record<string, string> = {
  "black-irish": blackIrishRef.url,
  mexxo: mexxoRef.url,
  mariah: mariahRef.url,
};

const MODEL = "openai/gpt-image-2.5-sunburst";
const MAX_BYTES = 8 * 1024 * 1024;

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (rateLimited("gen:" + clientKey(request), 12, 10 * 60_000))
          return err(429, "Too many portraits in a short time. Please wait a minute.");
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return err(500, "Portrait service is not configured.");
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return err(400, "Invalid upload.");
        }
        const scene = getScene(String(form.get("scene") ?? ""));
        let wardrobes: unknown;
        try {
          wardrobes = JSON.parse(String(form.get("wardrobes") ?? ""));
        } catch {
          wardrobes = null;
        }
        const guest = form.get("guest");
        if (!scene) return err(400, "Unknown scene.");
        if (!isValidWardrobes(wardrobes)) return err(400, "Choose 1–3 guests with wardrobe.");
        if (!(guest instanceof File)) return err(400, "A photo is required.");
        if (guest.size === 0 || guest.size > MAX_BYTES || !/^image\/(jpeg|png|webp)$/.test(guest.type))
          return err(400, "Photo must be JPEG/PNG/WebP under 8 MB.");
        const refRes = await fetch(new URL(REFERENCE_URL[scene.id]!, request.url)).catch(() => null);
        if (!refRes?.ok) return err(503, "Scene image unavailable. Please try again.");
        const reference = new File([await refRes.arrayBuffer()], "reference.jpg", { type: "image/jpeg" });

        const upstream = new FormData();
        upstream.set("model", MODEL);
        upstream.set("prompt", buildPrompt(scene, wardrobes));
        upstream.append("image[]", guest, "guest.jpg");
        upstream.append("image[]", reference, "reference.jpg");
        upstream.set("size", "1024x1536");
        upstream.set("output_format", "jpeg");

        // One bounded retry for transient failures only (429/5xx).
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/images/edits", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
            body: upstream,
            signal: request.signal,
          });
          if (res.ok) {
            const json = (await res.json()) as { data?: { b64_json?: string }[] };
            const b64 = json.data?.[0]?.b64_json;
            if (!b64) return err(502, "The portrait model returned no image. Please try again.");
            return Response.json({ imageBase64: b64, mimeType: "image/jpeg" });
          }
          const text = await res.text().catch(() => "");
          console.error("image edit failed", { status: res.status });
          const retryable = res.status === 429 || res.status >= 500;
          if (retryable && attempt === 0) {
            await new Promise((r) => setTimeout(r, 2500 + Math.random() * 1500));
            continue;
          }
          let msg = "The portrait could not be created. Please try again.";
          try {
            const j = JSON.parse(text);
            msg = j.error?.message || j.message || msg;
          } catch {}
          if (res.status === 402) msg = "AI credits are exhausted for this kiosk. Please ask staff.";
          return err(res.status, msg);
        }
        return err(503, "Service busy. Please try again.");
      },
    },
  },
});
