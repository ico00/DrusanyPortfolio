import { readFile, writeFile } from "fs/promises";
import path from "path";

export interface PageContent {
  title: string;
  html: string;
}

export interface AboutPageContent extends PageContent {
  quote?: string;
}

export interface ContactPageContent extends PageContent {
  email?: string;
  formspreeEndpoint?: string;
}

export interface PagesData {
  about: AboutPageContent;
  contact: ContactPageContent;
}

const DEFAULT_PAGES: PagesData = {
  about: {
    title: "About",
    html: "<p>Photographer focused on natural light and authentic moments.</p>",
    quote: undefined,
  },
  contact: {
    title: "Contact",
    html: "<p>For bookings and collaboration:</p>",
    email: "hello@example.com",
    formspreeEndpoint: undefined,
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

function normalizeContactPage(
  raw: Partial<ContactPageContent> | null | undefined,
  defaultPage: ContactPageContent
): ContactPageContent {
  const base = normalizePage(raw, defaultPage, "Contact") as ContactPageContent;
  return {
    ...base,
    email: typeof raw?.email === "string" && raw.email.trim() ? raw.email.trim() : defaultPage.email,
    formspreeEndpoint: typeof raw?.formspreeEndpoint === "string" && raw.formspreeEndpoint.trim() ? raw.formspreeEndpoint.trim() : undefined,
  };
}

function normalizeAboutPage(
  raw: Partial<AboutPageContent> | null | undefined,
  defaultPage: AboutPageContent
): AboutPageContent {
  const base = normalizePage(raw, defaultPage, "About") as AboutPageContent;
  return {
    ...base,
    quote: typeof raw?.quote === "string" && raw.quote.trim() ? raw.quote.trim() : undefined,
  };
}

export async function getPages(): Promise<PagesData> {
  try {
    const pagesPath = path.join(process.cwd(), "src", "data", "pages.json");
    const raw = await readFile(pagesPath, "utf-8");
    const data = JSON.parse(raw) as { about?: Partial<PageContent>; contact?: Partial<PageContent> };
    return {
      about: normalizeAboutPage(data.about, DEFAULT_PAGES.about),
      contact: normalizeContactPage(data.contact, DEFAULT_PAGES.contact),
    };
  } catch {
    return DEFAULT_PAGES;
  }
}

export async function savePages(data: PagesData): Promise<void> {
  const pagesPath = path.join(process.cwd(), "src", "data", "pages.json");
  await writeFile(pagesPath, JSON.stringify(data, null, 2), "utf-8");
}
