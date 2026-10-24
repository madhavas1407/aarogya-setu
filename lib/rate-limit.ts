import "server-only";

type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var aarogyaRateLimits: Map<string, Bucket> | undefined;
}

const buckets = (globalThis.aarogyaRateLimits ??= new Map<string, Bucket>());

/**
 * Fixed-window limiter kept in this server instance's memory. It protects billable Google
 * Places calls from casual abuse; a multi-instance deployment needs a shared store instead.
 */
export function rateLimit(request: Request, scope: string, limit: number, windowMs = 60_000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = forwarded || request.headers.get("x-real-ip") || "local";
  const key = `${scope}:${client}`;
  const now = Date.now();

  if (buckets.size > 10_000) {
    for (const [storedKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(storedKey);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}
