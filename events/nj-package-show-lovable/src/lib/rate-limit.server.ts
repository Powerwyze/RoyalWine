// Best-effort per-isolate rate limiter (memory only; no guest data stored).
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return true;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return false;
}
export function clientKey(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "local";
}
