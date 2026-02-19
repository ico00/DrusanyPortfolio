/**
 * Rate limiting za admin API rute.
 * Za budući produkcijski admin – štiti od DoS i brute-force napada.
 *
 * Trenutno koristi in-memory store (dovoljno za dev i single-instance).
 * Za produkciju s više instanci, zamijeniti s Redis (npr. @upstash/ratelimit).
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000; // 1 min
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200; // 200 req/min (bulk upload 100+ slika)

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

/** Izvlači identifikator klijenta (IP) iz request headera */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() ?? realIp ?? "unknown";
}

/**
 * Provjerava rate limit. Ako je prekoračen, vraća Response s 429.
 * Inače vraća null – nastavi s obradom.
 */
export function checkRateLimit(request: Request): Response | null {
  const key = getClientIdentifier(request);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return Response.json(
      { error: "Previše zahtjeva. Pokušajte ponovno kasnije." },
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
