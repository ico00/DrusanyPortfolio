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
];

const PROSE_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "target", "rel", "title"],
  img: ["src", "alt", "title", "width", "height", "data-text-alignment"],
  span: ["class"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
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
  });
}
