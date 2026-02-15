import { readFile, writeFile } from "fs/promises";
import path from "path";

export interface PageContent {
  title: string;
  html: string;
}

export interface PagesData {
  about: PageContent;
  contact: PageContent;
}

const DEFAULT_PAGES: PagesData = {
  about: {
    title: "About",
    html: "<p>Photographer focused on natural light and authentic moments.</p>",
  },
  contact: {
    title: "Contact",
    html: "<p>For bookings and collaboration:</p><p><a href=\"mailto:hello@example.com\">hello@example.com</a></p>",
  },
};

/** Izvuci naslov iz prvog <h1> u HTML-u i ukloni ga iz sadržaja */
function extractTitleFromHtml(html: string): { title: string; html: string } {
  const h1Match = html.match(/^<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const title = h1Match[1].replace(/<[^>]+>/g, "").trim() || "Untitled";
    const rest = html.slice(h1Match[0].length).trim();
    return { title, html: rest || "<p></p>" };
  }
  return { title: "", html };
}

function normalizePage(
  raw: Partial<PageContent> | null | undefined,
  defaultPage: PageContent,
  fallbackTitle: string
): PageContent {
  if (!raw?.html) return defaultPage;
  let title = raw.title?.trim() ?? "";
  let html = raw.html;
  if (!title) {
    const extracted = extractTitleFromHtml(html);
    title = extracted.title || fallbackTitle;
    html = extracted.html;
  }
  return { title, html };
}

export async function getPages(): Promise<PagesData> {
  try {
    const pagesPath = path.join(process.cwd(), "src", "data", "pages.json");
    const raw = await readFile(pagesPath, "utf-8");
    const data = JSON.parse(raw) as { about?: Partial<PageContent>; contact?: Partial<PageContent> };
    return {
      about: normalizePage(data.about, DEFAULT_PAGES.about, "About"),
      contact: normalizePage(data.contact, DEFAULT_PAGES.contact, "Contact"),
    };
  } catch {
    return DEFAULT_PAGES;
  }
}

export async function savePages(data: PagesData): Promise<void> {
  const pagesPath = path.join(process.cwd(), "src", "data", "pages.json");
  await writeFile(pagesPath, JSON.stringify(data, null, 2), "utf-8");
}
