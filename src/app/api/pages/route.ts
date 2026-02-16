import { getPages, savePages } from "@/lib/pages";

export const dynamic = "force-static";

export async function GET() {
  try {
    const pages = await getPages();
    return Response.json(pages);
  } catch (error) {
    console.error("Pages fetch error:", error);
    return Response.json(
      { about: { title: "About", html: "" }, contact: { title: "Contact", html: "" } },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Only available in development mode" },
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await request.json()) as {
      about?: { title?: string; html?: string; quote?: string };
      contact?: { title?: string; html?: string; email?: string; formspreeEndpoint?: string };
    };
    const pages = await getPages();
    if (body.about) {
      pages.about = {
        title: body.about.title?.trim() ?? pages.about.title,
        html: body.about.html ?? pages.about.html,
        quote: body.about.quote !== undefined ? (body.about.quote?.trim() || undefined) : pages.about.quote,
      };
    }
    if (body.contact) {
      pages.contact = {
        title: body.contact.title?.trim() ?? pages.contact.title,
        html: body.contact.html ?? pages.contact.html,
        email: body.contact.email !== undefined ? (body.contact.email?.trim() || undefined) : pages.contact.email,
        formspreeEndpoint: body.contact.formspreeEndpoint !== undefined ? (body.contact.formspreeEndpoint?.trim() || undefined) : pages.contact.formspreeEndpoint,
      };
    }
    await savePages(pages);
    return Response.json(pages);
  } catch (error) {
    console.error("Pages save error:", error);
    return Response.json(
      { error: "Failed to save pages" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
