import path from "path";
import { getPages, savePages } from "@/lib/pages";
import { withLock } from "@/lib/jsonLock";
import { checkRateLimit } from "@/lib/rateLimit";

const PAGES_PATH = path.join(process.cwd(), "src", "data", "pages.json");

export const dynamic = "force-static";

export async function GET() {
  try {
    const pages = await getPages();
    return Response.json(pages);
  } catch (error) {
    console.error("Pages fetch error:", error);
    return Response.json(
      { error: "Failed to fetch pages" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Only available in development mode" },
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await request.json()) as {
      about?: { title?: string; html?: string; quote?: string; seo?: { metaTitle?: string; metaDescription?: string; keywords?: string } };
      contact?: { title?: string; html?: string; email?: string; formspreeEndpoint?: string; seo?: { metaTitle?: string; metaDescription?: string; keywords?: string } };
    };
    const pages = await withLock(PAGES_PATH, async () => {
      const p = await getPages();
      if (body.about) {
      p.about = {
        title: body.about.title?.trim() ?? p.about.title,
        html: body.about.html ?? p.about.html,
        quote: body.about.quote !== undefined ? (body.about.quote?.trim() || undefined) : p.about.quote,
        seo: body.about.seo
          ? {
              metaTitle: body.about.seo.metaTitle?.trim() ?? p.about.seo?.metaTitle ?? "",
              metaDescription: body.about.seo.metaDescription?.trim() ?? p.about.seo?.metaDescription ?? "",
              keywords: body.about.seo.keywords?.trim() ?? p.about.seo?.keywords ?? "",
            }
          : p.about.seo ?? { metaTitle: "", metaDescription: "", keywords: "" },
      };
    }
    if (body.contact) {
        p.contact = {
          title: body.contact.title?.trim() ?? p.contact.title,
          html: body.contact.html ?? p.contact.html,
          email: body.contact.email !== undefined ? (body.contact.email?.trim() || undefined) : p.contact.email,
          formspreeEndpoint: body.contact.formspreeEndpoint !== undefined ? (body.contact.formspreeEndpoint?.trim() || undefined) : p.contact.formspreeEndpoint,
          seo: body.contact.seo
            ? {
                metaTitle: body.contact.seo.metaTitle?.trim() ?? p.contact.seo?.metaTitle ?? "",
                metaDescription: body.contact.seo.metaDescription?.trim() ?? p.contact.seo?.metaDescription ?? "",
                keywords: body.contact.seo.keywords?.trim() ?? p.contact.seo?.keywords ?? "",
              }
            : p.contact.seo ?? { metaTitle: "", metaDescription: "", keywords: "" },
        };
      }
      await savePages(p);
      return p;
    });
    return Response.json(pages);
  } catch (error) {
    console.error("Pages save error:", error);
    return Response.json(
      { error: "Failed to save pages" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
