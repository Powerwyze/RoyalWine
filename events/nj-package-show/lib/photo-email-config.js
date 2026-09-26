const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
export function photoEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.RESEND_FROM_EMAIL?.trim() || '';
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || '';
  const configured = !!apiKey && from === 'wyzer@powerwyze.com' && emailPattern.test(replyTo);
  return {apiKey, from, replyTo, configured};
}
