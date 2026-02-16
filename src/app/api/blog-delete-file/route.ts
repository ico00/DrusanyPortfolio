import { unlink } from "fs/promises";
import path from "path";

/** Briše datoteku iz blog galerije (public/uploads/blog/...) */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Samo u development modu" },
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { url } = (await request.json()) as { url?: string };

    if (!url || typeof url !== "string") {
      return Response.json(
        { error: "url je obavezan" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalized = url.trim();
    if (!normalized.startsWith("/uploads/blog/")) {
      return Response.json(
        { error: "Samo blog uploads mogu se brisati" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fullPath = path.join(process.cwd(), "public", normalized.slice(1));
    try {
      await unlink(fullPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn("Blog delete file:", fullPath, err);
        return Response.json(
          { error: "Brisanje nije uspjelo" },
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Blog delete file error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Brisanje nije uspjelo",
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
