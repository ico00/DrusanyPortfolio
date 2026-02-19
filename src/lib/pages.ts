import { readFile, writeFile } from "fs/promises";
import path from "path";
import { sanitizeProseHtml } from "./sanitize";

export interface SeoContent {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

export interface PageContent {
  title: string;
  html: string;
  seo?: SeoContent;
}

export interface AboutPageContent extends PageContent {
  quote?: string;
}

export interface ContactPageContent extends PageContent {
  email?: string;
  formspreeEndpoint?: string;
}

/** Glavna blog stranica (/blog) – samo naslov i SEO, bez HTML sadržaja */
export interface BlogPageContent {
  title: string;
  seo?: SeoContent;
}

/** Početna stranica (/) – samo naslov i SEO */
export interface HomePageContent {
  title: string;
  seo?: SeoContent;
}

export interface PagesData {
  about: AboutPageContent;
  contact: ContactPageContent;
  blog?: BlogPageContent;
  home?: HomePageContent;
}

const DEFAULT_PAGES: PagesData = {
  about: {
    title: "About",
    html: "<p>Photographer focused on natural light and authentic moments.</p>",
    quote: undefined,
    seo: { metaTitle: "", metaDescription: "", keywords: "" },
  },
  contact: {
    title: "Contact",
    html: "<p>For bookings and collaboration:</p>",
    email: "hello@example.com",
    formspreeEndpoint: undefined,
    seo: { metaTitle: "", metaDescription: "", keywords: "" },
  },
  blog: {
    title: "Blog",
    seo: { metaTitle: "", metaDescription: "", keywords: "" },
  },
  home: {
    title: "Drusany | Photography",
    seo: { metaTitle: "", metaDescription: "", keywords: "" },
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
  const seo: SeoContent = {
    metaTitle: raw?.seo?.metaTitle?.trim() || "",
    metaDescription: raw?.seo?.metaDescription?.trim() || "",
    keywords: raw?.seo?.keywords?.trim() || "",
  };
  return { title, html: sanitizeProseHtml(html), seo };
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

function normalizeBlogPage(
  raw: Partial<BlogPageContent> | null | undefined,
  defaultPage: BlogPageContent
): BlogPageContent {
  const title = raw?.title?.trim() ?? defaultPage.title;
  const seo: SeoContent = {
    metaTitle: raw?.seo?.metaTitle?.trim() ?? "",
    metaDescription: raw?.seo?.metaDescription?.trim() ?? "",
    keywords: raw?.seo?.keywords?.trim() ?? "",
  };
  return { title, seo };
}

function normalizeHomePage(
  raw: Partial<HomePageContent> | null | undefined,
  defaultPage: HomePageContent
): HomePageContent {
  const title = raw?.title?.trim() ?? defaultPage.title;
  const seo: SeoContent = {
    metaTitle: raw?.seo?.metaTitle?.trim() ?? "",
    metaDescription: raw?.seo?.metaDescription?.trim() ?? "",
    keywords: raw?.seo?.keywords?.trim() ?? "",
  };
  return { title, seo };
}

export async function getPages(): Promise<PagesData> {
  try {
    const pagesPath = path.join(process.cwd(), "src", "data", "pages.json");
    const raw = await readFile(pagesPath, "utf-8");
    const data = JSON.parse(raw) as {
      about?: Partial<PageContent>;
      contact?: Partial<PageContent>;
      blog?: Partial<BlogPageContent>;
      home?: Partial<HomePageContent>;
    };
    return {
      about: normalizeAboutPage(data.about, DEFAULT_PAGES.about),
      contact: normalizeContactPage(data.contact, DEFAULT_PAGES.contact),
      blog: normalizeBlogPage(data.blog, DEFAULT_PAGES.blog!),
      home: normalizeHomePage(data.home, DEFAULT_PAGES.home!),
    };
  } catch {
    return DEFAULT_PAGES;
  }
}

export async function savePages(data: PagesData): Promise<void> {
  const pagesPath = path.join(process.cwd(), "src", "data", "pages.json");
  await writeFile(pagesPath, JSON.stringify(data, null, 2), "utf-8");
}
