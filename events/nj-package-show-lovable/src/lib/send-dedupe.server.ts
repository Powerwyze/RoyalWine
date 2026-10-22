// In-memory delivery dedupe keyed by the complete payload hash.
// Concurrent duplicates await the same pending delivery; only confirmed success is remembered;
// failures are forgotten so a retry performs a fresh delivery.
const pending = new Map<string, Promise<boolean>>();
const delivered = new Map<string, number>();
const TTL = 24 * 60 * 60_000;

export async function payloadKey(email: string, name: string, imageBase64: string): Promise<string> {
  const data = new TextEncoder().encode(`v1\n${email.toLowerCase()}\n${name}\n${imageBase64}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return "rwm-" + Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function deliverOnce(key: string, send: () => Promise<boolean>): Promise<boolean> {
  const at = delivered.get(key);
  if (at && Date.now() - at < TTL) return true;
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const p = (async () => {
    try {
      const ok = await send();
      if (ok) {
        if (delivered.size > 5000) delivered.clear();
        delivered.set(key, Date.now());
      }
      return ok;
    } catch {
      return false;
    } finally {
      pending.delete(key);
    }
  })();
  pending.set(key, p);
  return p;
}

export function _resetDedupe() {
  pending.clear();
  delivered.clear();
}
