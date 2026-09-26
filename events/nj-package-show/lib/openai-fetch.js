// Retry only an explicit credit/quota rejection, never an uncertain paid request.
const quotaCodes = new Set([
  'insufficient_quota', 'credit_balance_exhausted', 'billing_hard_limit_reached',
  'organization_spend_limit_exceeded', 'project_spend_limit_exceeded',
  'organization_usage_limit_exceeded',
]);
export function isCreditLimit(status, data) {
  if (![400, 402, 429].includes(status)) return false;
  const error = data?.error || {};
  return quotaCodes.has(error.code) ||
    ((!error.code || error.code === 'insufficient_quota') && error.type === 'insufficient_quota');
}
export function hasOpenAIKey() {
  return !!(process.env.OPENAI_API_KEY?.trim() || process.env.OPENAI_BACKUP?.trim());
}
export async function openaiFetch(url, options = {}, credentials = {}) {
  const target = new URL(url);
  if (target.origin !== 'https://api.openai.com') throw new Error('Invalid OpenAI endpoint');
  const headers = new Headers(options.headers);
  const supplied = headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const primary = (credentials.primaryKey ?? supplied ?? process.env.OPENAI_API_KEY ?? '').trim();
  const backup = (credentials.backupKey ?? process.env.OPENAI_BACKUP ?? '').trim();
  const first = primary || backup;
  if (!first) throw new Error('OpenAI is not configured');
  const fetcher = credentials.fetcher || globalThis.fetch;
  const attempt = key => {
    options.signal?.throwIfAborted();
    const authorized = new Headers(headers);
    authorized.set('Authorization', 'Bearer ' + key);
    return fetcher(url, {...options, headers: authorized, redirect: 'error'});
  };
  const response = await attempt(first);
  if (response.ok || !backup || backup === first ||
      (options.body != null && typeof options.body !== 'string')) return response;
  if (![400, 402, 429].includes(response.status)) return response;
  const problem = await response.clone().json().catch(() => null);
  if (!isCreditLimit(response.status, problem)) return response;
  // The rejected call did not run. Reuse exactly the same payload and deadline once.
  return attempt(backup);
}
