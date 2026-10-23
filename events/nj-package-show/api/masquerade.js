import { buildPrompt, getScene, parseGuestCount } from '../lib/masquerade-rules.js';
import { openaiFetch, isCreditLimit, hasOpenAIKey } from '../lib/openai-fetch.js';

const TEMPLATES = {
  "bartenura": "https://royal-masquerade-moments.lovable.app/__l5e/assets-v1/29a3a439-2768-4be4-a7da-e3b2b5bf9f6d/16650.jpg",
  "boondocks": "https://royal-masquerade-moments.lovable.app/__l5e/assets-v1/02c26bd0-5a38-4c83-9617-d9066d6268c5/16639.jpg",
  "padre-azul": "https://royal-masquerade-moments.lovable.app/__l5e/assets-v1/33867cd0-939b-4b79-9c51-6f94257d2d5e/16643.jpg",
  "don-ramon": "https://royal-masquerade-moments.lovable.app/__l5e/assets-v1/0665a386-d42b-49e7-9fdb-ded4a047eedf/16646.jpg",
  "lvov": "https://royal-masquerade-moments.lovable.app/__l5e/assets-v1/2a56a4db-7395-4319-acef-679352ee7f0b/16640.jpg"
};
const MAX_BYTES = 3 * 1024 * 1024;
const windows = new Map();
let active = 0;
function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function GET() {
  return json({ service: 'royal-wine-core-brands-masquerade', provider: 'openai',
    configured: hasOpenAIKey(), credentialLocation: 'vercel',
    scenes: Object.keys(TEMPLATES), contractVersion: 1 });
}
export async function POST(req) {
  if (!hasOpenAIKey()) return json({ error: 'Portrait service is not configured in Vercel.' }, 503);
  let form;
  try { form = await req.formData(); } catch { return json({ error: 'Invalid camera photo.' }, 400); }
  const sceneId = form.get('scene');
  const scene = typeof sceneId === 'string' ? getScene(sceneId) : undefined;
  const guestCount = parseGuestCount(form.get('guestCount'));
  if (!scene || !Object.hasOwn(TEMPLATES, sceneId) || form.getAll('scene').length !== 1)
    return json({ error: 'Choose a valid masquerade scene.' }, 400);
  if (guestCount === undefined || form.getAll('guestCount').length !== 1)
    return json({ error: 'Choose 1–3 guests.' }, 400);
  const guest = form.get('guest');
  if (!guest || typeof guest.arrayBuffer !== 'function' || form.getAll('guest').length !== 1)
    return json({ error: 'A camera photo is required.' }, 400);
  if (!guest.size || guest.size > MAX_BYTES || !/^image\/(jpeg|png|webp)$/.test(guest.type))
    return json({ error: 'Photo must be JPEG/PNG/WebP under 3 MB. Please retake.' }, 400);
  // Bounded, per-instance rate limiting; only validated requests use provider capacity.
  const now = Date.now();
  for (const [key, value] of windows) if (value.until <= now) windows.delete(key);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const window = windows.get(ip) || { until: now + 600000, count: 0 };
  if (window.count >= 12 || active >= 4) return json({ error: 'Portrait service is busy. Please wait a minute.' }, 429);
  window.count++; windows.set(ip, window);
  active++;
  try {
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(175000)]);
    // No caller-provided URL, prompt, model or template bytes are trusted.
    const reference = await fetch(TEMPLATES[sceneId], { signal, redirect: 'error' });
    if (!reference.ok || !/^image\/(jpeg|png|webp)\b/i.test(reference.headers.get('content-type') || ''))
      return json({ error: 'The approved scene reference is unavailable.' }, 503);
    const referenceBytes = Buffer.from(await reference.arrayBuffer());
    if (!referenceBytes.length || referenceBytes.length > MAX_BYTES)
      return json({ error: 'The approved scene reference is unavailable.' }, 503);
    const referenceMime = reference.headers.get('content-type').split(';')[0];
    const body = JSON.stringify({
      model: process.env.MASQUERADE_IMAGE_MODEL || 'gpt-image-2',
      images: [
        { image_url: 'data:' + referenceMime + ';base64,' + referenceBytes.toString('base64') },
        { image_url: 'data:' + guest.type + ';base64,' + Buffer.from(await guest.arrayBuffer()).toString('base64') },
      ],
      prompt: buildPrompt(scene, guestCount),
      size: 'auto',
      quality: process.env.MASQUERADE_IMAGE_QUALITY || 'medium',
      output_format: 'jpeg', n: 1,
    });
    const res = await openaiFetch('https://api.openai.com/v1/images/edits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('Masquerade OpenAI request failed', { status: res.status });
      if (isCreditLimit(res.status, data))
        return json({ error: 'The OpenAI API account used by Vercel has reached its credit or spending limit. Please ask staff.', code: 'OPENAI_QUOTA' }, 402);
      return json({ error: res.status === 429 ? 'The portrait provider is busy. Please wait a minute.' : 'The portrait could not be created. Please try again.' }, res.status === 429 ? 429 : 502);
    }
    const imageBase64 = data?.data?.[0]?.b64_json;
    if (!imageBase64) return json({ error: 'The portrait provider returned no image.' }, 502);
    return json({ imageBase64, mimeType: 'image/jpeg' });
  } catch (error) {
    console.error('Masquerade generation unavailable', { name: error?.name });
    return json({ error: 'The portrait service could not finish. Please try again.' }, 503);
  } finally { active--; }
}
