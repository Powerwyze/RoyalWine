import { createFileRoute } from "@tanstack/react-router";
import { getScene, parseGuestCount } from "@/lib/kiosk";
import { buildImageEditRequest } from "@/lib/image-edit";
import { clientKey, rateLimited } from "@/lib/rate-limit.server";
import { getSceneReferences } from "@/lib/scene-references";

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
          return err(400, "Invalid camera photo.");
        }
        const scene = getScene(String(form.get("scene") ?? ""));
        const guestCount = parseGuestCount(form.get("guestCount"));
        // Legacy wardrobes fields are intentionally ignored: visible clothing alone controls styling.
        const guest = form.get("guest");
        if (!scene) return err(400, "Unknown scene.");
        if (guestCount === undefined) return err(400, "Choose 1–3 guests.");
        if (!(guest instanceof File)) return err(400, "A photo is required.");
        if (guest.size === 0 || guest.size > MAX_BYTES || !/^image\/(jpeg|png|webp)$/.test(guest.type))
          return err(400, "Photo must be JPEG/PNG/WebP under 8 MB.");
        const { template, brand } = getSceneReferences(scene.id);
        const readReference = async (asset: typeof template) => {
          const res = await fetch(new URL(asset.url, request.url), { signal: request.signal });
          if (!res.ok) throw new Error("Scene image unavailable.");
          return new File([await res.arrayBuffer()], asset.original_filename, { type: asset.content_type });
        };
        let reference: File;
        let brandReference: File | undefined;
        try {
          [reference, brandReference] = await Promise.all([readReference(template), brand ? readReference(brand) : undefined]);
        } catch {
          return err(503, "Scene image unavailable. Please try again.");
        }
        const encode = async (file: File) => `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
        const upstream = buildImageEditRequest(scene, guestCount, await encode(reference), await encode(guest), brandReference ? await encode(brandReference) : undefined);

        // One bounded retry for transient failures only (429/5xx).
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
            body: JSON.stringify(upstream),
            signal: request.signal,
          });
          if (res.ok) {
            const json = (await res.json()) as { data?: { b64_json?: string }[] };
            const b64 = json.data?.[0]?.b64_json;
            if (!b64) return err(502, "The portrait model returned no image. Please try again.");
            return Response.json({ imageBase64: b64, mimeType: "image/png" });
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
