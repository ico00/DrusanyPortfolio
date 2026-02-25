import sanitizeHtml from "sanitize-html";

/**
 * Whitelist za BlockNote output (About, Contact, Blog).
 * Dozvoljava samo sigurne tagove i atribute za rich text.
 */
const PROSE_ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "a",
  "img",
  "br",
  "span",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "figure",
  "figcaption",
  "div",
];

const PROSE_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "target", "rel", "title"],
  img: ["src", "alt", "title", "width", "data-text-alignment", "data-display-width", "data-preview-width", "data-prose-split", "data-name", "data-url"],
  span: ["class"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  figure: ["class"],
  div: ["class", "style"],
};

/**
 * Sanitizira HTML sadržaj iz BlockNote editora (About, Contact, Blog).
 * Uklanja potencijalno maliciozan sadržaj (script, onerror, javascript: itd.).
 */
export function sanitizeProseHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  return sanitizeHtml(html, {
    allowedTags: PROSE_ALLOWED_TAGS,
    allowedAttributes: PROSE_ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "/"],
    allowedSchemesByTag: {
      img: ["http", "https", "data", "/"],
    },
    transformTags: {
      a: (_tagName, attribs) => {
        const href = attribs.href ?? "";
        const isExternal =
          href.startsWith("http://") || href.startsWith("https://");
        const out: Record<string, string> = {
          href,
          ...(attribs.target && { target: attribs.target }),
          ...(attribs.rel && { rel: attribs.rel }),
          ...(attribs.title && { title: attribs.title }),
        };
        if (isExternal && !out.rel) {
          out.rel = "noopener noreferrer";
        }
        return { tagName: "a", attribs: out };
      },
      img: (_tagName, attribs) => {
        const out: Record<string, string> = { src: attribs.src ?? "" };
        if (attribs.alt) out.alt = attribs.alt;
        if (attribs.title) out.title = attribs.title;
        if (attribs.width) out.width = attribs.width;
        if (attribs["data-text-alignment"])
          out["data-text-alignment"] = attribs["data-text-alignment"];
        if (attribs["data-display-width"])
          out["data-display-width"] = attribs["data-display-width"];
        if (attribs["data-preview-width"])
          out["data-preview-width"] = attribs["data-preview-width"];
        if (attribs["data-name"])
          out["data-name"] = attribs["data-name"];
        if (attribs["data-url"])
          out["data-url"] = attribs["data-url"];
        return { tagName: "img", attribs: out };
      },
    },
  });
}
