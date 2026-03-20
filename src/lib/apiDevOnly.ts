/**
 * Admin API rute dostupne samo u developmentu.
 * Vraća 403 Response ako nije dev; inače null (nastavi handler).
 */
export function requireDevApiResponse(): Response | null {
  if (process.env.NODE_ENV === "development") return null;
  return Response.json(
    { error: "Only available in development mode" },
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}
