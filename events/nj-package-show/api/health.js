import {hasOpenAIKey} from '../lib/openai-fetch.js';
import {photoEmailConfig} from '../lib/photo-email-config.js';
export function GET(){
 const email=photoEmailConfig();
 return Response.json({app:"royal-wine-nj-package-kiosk",packetId:"DEMO-009",voiceConfigured:hasOpenAIKey(),imageConfigured:hasOpenAIKey(),backupConfigured:!!process.env.OPENAI_BACKUP?.trim(),emailConfigured:email.configured,emailProvider:'resend',senderConfigured:email.from==='wyzer@powerwyze.com',replyToConfigured:!!email.replyTo,hostEnabled:process.env.ENABLE_FACE_HOST==='true'},{headers:{'Cache-Control':'no-store'}});
}
