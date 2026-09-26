import { photoEmailConfig } from '../lib/photo-email-config.js';
import { Resend } from 'resend';
import { createHash } from 'node:crypto';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const EMAIL_TEXT = 'Your Royal Wine NJ Package Show portrait is attached. Thanks for connecting with us at the show!\n\nExplore Royal Wine: https://royalwine.com/\nBlack Irish: https://goblackirish.com/\nPowered by PowerWyze Smart Stations: https://powerwyze.com/\nhttps://www.instagram.com/powerwyze/';
const EMAIL_HTML = `<!doctype html><html lang="en"><body style="margin:0;background:#101c35;color:#20233b;font-family:Arial,sans-serif"><table role="presentation" width="100%" style="padding:30px 12px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:620px;background:white;border-radius:24px;overflow:hidden"><tr><td style="background:#101c35;padding:36px;color:white;text-align:center"><p style="color:#dac58e;letter-spacing:3px">ROYAL WINE</p><h1>Great connections.<br>A royal portrait.</h1><p style="color:#dac58e">Your NJ Package Show portrait</p></td></tr><tr><td style="padding:28px;text-align:center"><p>A NJ Package Show moment, made yours. Your portrait is attached for download.</p><img src="cid:royal-wine-nj-portrait" alt="Your Royal Wine New Jersey portrait" width="384" style="width:100%;max-width:384px;border-radius:16px"><p><a href="https://royalwine.com/" style="color:#244c9d">Explore Royal Wine</a></p><p style="font-size:12px">Powered by <a href="https://powerwyze.com/">PowerWyze Smart Stations</a> · <a href="https://www.instagram.com/powerwyze/">@powerwyze</a></p></td></tr></table></td></tr></table></body></html>`;

function cleanFilename(value, fallback) {
  const name = String(value || fallback).split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, '_');
  return name || fallback;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const config = photoEmailConfig();
    if (!config.configured) return res.status(503).json({ok:false,error:'Photo email setup is incomplete. Please ask the event operator.'});
    const resendApiKey = config.apiKey;

    const { email, filename, mimeType, imageBase64 } = req.body || {};
    if (!email || !EMAIL_PATTERN.test(String(email)) || !imageBase64) {
      res.status(400).send('Missing required fields.');
      return;
    }

    const finalMime = String(mimeType || 'image/jpeg').toLowerCase();
    if (!['image/jpeg','image/png','image/webp'].includes(finalMime)) {
      res.status(400).send('Only image attachments are supported.');
      return;
    }

    const cleanBase64 = String(imageBase64).replace(/^data:[^;]+;base64,/, '');
    const bytes = Buffer.from(cleanBase64, 'base64');
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
      res.status(400).send('Image attachment is empty or too large.');
      return;
    }

    const resend = new Resend(resendApiKey);
    const finalFilename = cleanFilename(filename, 'royal-wine-nj-portrait.jpg');
    const from = config.from;
    const replyTo = config.replyTo;
    // Scope idempotency to the complete provider payload. A template, sender or
    // attachment-name change is a different email; exact retries remain deduplicated.
    const message = {
      from,
      to: [String(email).trim()],
      ...(replyTo ? { replyTo } : {}),
      subject: 'Your Royal Wine New Jersey portrait',
      html: EMAIL_HTML,
      text: EMAIL_TEXT,
      attachments: [{
        filename: finalFilename,
        content: bytes.toString('base64'),
        contentId: 'royal-wine-nj-portrait',
      }],
    };
    const deliveryId = createHash('sha256').update(JSON.stringify(message)).digest('hex');
    const {data,error}=await resend.emails.send(message,{idempotencyKey:`royal-wine-photo-${deliveryId}`});

    if (error) {
      console.error('Photo email failed', {name:error.name});
      return res.status(502).json({ ok: false, error: 'Email delivery failed.' });
    }

    return res.status(200).json({ ok: true, id: data?.id || null });
  } catch (e) {
    console.error('Unexpected email delivery error', {name:e?.name});
    return res.status(500).json({ ok: false, error: 'Unexpected email delivery error.' });
  }
}
