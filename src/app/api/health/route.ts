import { readFile, access } from "fs/promises";
import path from "path";
import { getBlog } from "@/lib/blog";

export const dynamic = "force-static";

interface CheckResult {
  ok: boolean;
  message?: string;
}

async function checkJsonFile(
  filePath: string,
  validator: (data: unknown) => boolean
): Promise<CheckResult> {
  try {
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    if (!validator(data)) {
      return { ok: false, message: `Invalid structure: ${filePath}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: `${path.basename(filePath)}: ${err instanceof Error ? err.message : "read/parse failed"}`,
    };
  }
}

async function checkDirExists(dirPath: string): Promise<CheckResult> {
  try {
    await access(dirPath);
    return { ok: true };
  } catch {
    return { ok: false, message: `Directory missing: ${path.basename(dirPath)}` };
  }
}

export async function GET() {
  const dataDir = path.join(process.cwd(), "src", "data");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const blogContentDir = path.join(dataDir, "blog");

  const checks: Record<string, CheckResult> = {};

  // JSON datoteke
  checks.gallery = await checkJsonFile(path.join(dataDir, "gallery.json"), (d) =>
    Array.isArray((d as { images?: unknown }).images)
  );
  checks.blog = await checkJsonFile(path.join(dataDir, "blog.json"), (d) =>
    Array.isArray((d as { posts?: unknown }).posts)
  );
  checks.pages = await checkJsonFile(path.join(dataDir, "pages.json"), (d) => {
    const p = d as { about?: unknown; contact?: unknown };
    return p != null && typeof p.about === "object" && typeof p.contact === "object";
  });
  checks.theme = await checkJsonFile(path.join(dataDir, "theme.json"), (d) =>
    d != null && typeof d === "object"
  );

  // public/uploads
  checks.uploads = await checkDirExists(uploadsDir);

  // Blog HTML datoteke za svaki post
  let blogBodyChecks: CheckResult = { ok: true };
  try {
    const { posts } = await getBlog();
    const missing: string[] = [];
    for (const post of posts) {
      if (!post.slug) continue;
      const htmlPath = path.join(blogContentDir, `${post.slug}.html`);
      try {
        await access(htmlPath);
      } catch {
        missing.push(post.slug);
      }
    }
    if (missing.length > 0) {
      blogBodyChecks = {
        ok: false,
        message: `Missing blog body: ${missing.join(", ")}`,
      };
    }
  } catch (err) {
    blogBodyChecks = {
      ok: false,
      message: err instanceof Error ? err.message : "Blog body check failed",
    };
  }
  checks.blogBodies = blogBodyChecks;

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 200 : 503;

  return Response.json(
    {
      status: allOk ? "ok" : "degraded",
      checks: Object.fromEntries(
        Object.entries(checks).map(([k, v]) => [
          k,
          v.ok ? "ok" : { ok: false, message: v.message },
        ])
      ),
    },
    { status, headers: { "Content-Type": "application/json" } }
  );
}
