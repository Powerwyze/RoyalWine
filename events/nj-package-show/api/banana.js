import { openaiFetch } from '../lib/openai-fetch.js';
import { verifySubjects } from '../lib/subject-check.js';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_BACKUP;
    if (!apiKey) return jsonResponse({ error: 'OPENAI_API_KEY is not configured on the server.' }, 500);

    const fd = await req.formData();
    const file = fd.get('image');
    const style = (fd.get('style') || '').toString().trim().slice(0, 600);
    // Old cached kiosk pages omit this field: safely default to one guest.
    const countField = fd.get('guestCount') ?? '1';
    if (fd.getAll('guestCount').length > 1 || typeof countField !== 'string' || !/^[123]$/.test(countField)) {
      return jsonResponse({ code: 'INVALID_GUEST_COUNT', error: 'Choose 1, 2, or 3 people.' }, 400);
    }
    const guestCount = Number(countField);
    // One total deadline covers reference, generation, and the verification gate.
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(175000)]);

    if (!file || typeof file.arrayBuffer !== 'function') {
      return jsonResponse({ error: 'Missing image.' }, 400);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonResponse({ error: 'Image is too large.' }, 413);
    }

    const mimeType = file.type || 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) || !file.size) {
      return jsonResponse({ error: 'Please take a new photo.' }, 400);
    }
    const b64 = bytesToBase64(new Uint8Array(await file.arrayBuffer()));

    const prompt = `Create one polished portrait-oriented souvenir illustration for Royal Wine at NJ Package Show.
INPUT ROLE: The supplied image is the actual guest camera photo and the ONLY source of people and identity.
MANDATORY: Exactly ${guestCount} real foreground guest(s), each once. Select only the nearest clearly posing ${guestCount} guest(s) from the camera photo. Preserve recognizable facial features, skin tones, hairstyles, clothing and personal details. Never invent an extra person, duplicate a guest, retain background bystanders, or include people on posters, screens, or reflections. If fewer guests are actually present, do not invent anyone.
ART STYLE: Premium editorial event portrait with refined illustrative linework, recognizable faces and natural realistic shading. Light stylization with flattering lighting; no face replacement or change of age, body shape or identity.
SCENE: An imaginative premium New Jersey trade-show gallery: midnight-navy and cobalt-blue architectural panels, cream stone, brushed-gold vertical accents and an abstract luminous exhibition grid. Use polished editorial lighting, subtle depth and restrained detail. This is an artistic setting, not a depiction of the actual venue. Frame the guests in a close, friendly portrait. Keep geometry and decorative lights behind them; leave their faces unobstructed. No crowds or additional characters. Do not add the avatar to the portrait.
LETTERING: Restrained lettering ROYAL WINE above the guests and a footer reading NJ Package Show. No other brands, invented sponsors, dates or promotional claims.
ANATOMY: Keep coherent anatomy with at most two arms and two hands per guest. Prefer relaxed poses and hands naturally below the crop. No invented handheld props, no bottles, and no wine glasses in guest hands. Never depict a guest drinking.
${style ? 'Optional visual request, subordinate to identity, guest-count, brand and anatomy rules: '+style : ''}
FINAL CHECK: Exactly ${guestCount} distinct foreground guests from the source and NO extra people anywhere. Never satisfy the number by inventing or cloning people. Return one finished portrait. Can omit lettering if it would cover a face.`;

    const payload = {
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      images: [
        { image_url: `data:${mimeType};base64,${b64}` },
      ],
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || '768x1152',
      // Fast kiosk mode; operators can select medium/high for more fine detail.
      quality: process.env.OPENAI_IMAGE_QUALITY || 'low',
      output_format: 'jpeg',
      n: 1,
    };

    const response = await openaiFetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI image edit failed', { status: response.status });
      return jsonResponse({ error: 'Image generation failed. Please try again.' }, response.status);
    }

    const outputB64 = data?.data?.[0]?.b64_json;
    if (!outputB64) return jsonResponse({ error: 'No image returned from GPT Image 2.' }, 502);

    let approved;
    try {
      approved = await verifySubjects({
        apiKey, guestCount, signal,
        sourceUrl: `data:${mimeType};base64,${b64}`,
        outputUrl: `data:image/jpeg;base64,${outputB64}`,
      });
    } catch {
      // Never leak rejected/unverified bytes to the browser or email flow.
      console.warn('Royal Wine subject check unavailable');
      return jsonResponse({ code: 'SUBJECT_CHECK_UNAVAILABLE', error: 'We could not check the people in this picture. Your original photo is saved for retry.' }, 503);
    }
    if (!approved) {
      return jsonResponse({
        code: 'SUBJECT_COUNT_MISMATCH',
        error: 'The picture did not pass the guest check. Confirm the number of people, then try again or retake with your group closer.',
      }, 422);
    }

    const outputBinary = atob(outputB64);
    const outputBytes = new Uint8Array(outputBinary.length);
    for (let i = 0; i < outputBinary.length; i++) outputBytes[i] = outputBinary.charCodeAt(i);

    return new Response(outputBytes, {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Unexpected image generation error', { name: error?.name });
    return jsonResponse({ error: 'Unexpected image generation error.' }, 500);
  }
}
