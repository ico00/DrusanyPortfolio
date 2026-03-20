import { parseHTML } from "linkedom";
import { slugify } from "@/lib/slug";

const QUOTE_CHAR = "\u201C";

export type ProseTocItem = {
  id: string;
  level: number;
  text: string;
};

/** Stabilan fragment u URL-u; slugify može početi znamenkom */
const SAFE_ID = /^[a-zA-Z][\w.-]*$/;

function normalizeHeadingId(raw: string): string {
  let id = raw.trim().slice(0, 80);
  if (!id || !SAFE_ID.test(id)) {
    id = slugify(raw).slice(0, 72) || "section";
  }
  if (/^\d/.test(id)) id = `h-${id}`;
  if (!SAFE_ID.test(id)) id = `h-${slugify(raw).slice(0, 60) || "section"}`;
  return id;
}

function assignHeadingIdsAndToc(doc: Document): ProseTocItem[] {
  const used = new Set<string>();
  const toc: ProseTocItem[] = [];
  const nodes = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

  nodes.forEach((el) => {
    const text = el.textContent?.trim() ?? "";
    if (!text) return;
    const tag = el.tagName.toLowerCase();
    const level = parseInt(tag.slice(1), 10);
    if (level < 1 || level > 6 || Number.isNaN(level)) return;

    const existing = el.getAttribute("id")?.trim() ?? "";
    let id = existing ? normalizeHeadingId(existing) : normalizeHeadingId(text);
    let unique = id;
    let n = 2;
    while (used.has(unique)) {
      unique = `${id}-${n++}`;
    }
    used.add(unique);
    el.setAttribute("id", unique);
    toc.push({ id: unique, level, text });
  });

  return toc;
}

/**
 * Ista obrada kao ProseContent: TOC iz h1–h6, YouTube wrap, blockquote, slike + lightbox URL-ovi.
 * Koristi linkedom na serveru i klijentu – identičan output.
 */
export function processProseHtml(html: string): {
  processedHtml: string;
  imageUrls: string[];
  tocItems: ProseTocItem[];
} {
  const { document: doc } = parseHTML(
    `<!DOCTYPE html><html><body>${html}</body></html>`
  );
  const imageUrls: string[] = [];

  const tocItems = assignHeadingIdsAndToc(doc);

  doc.querySelectorAll("iframe[src*='youtube.com/embed']").forEach((iframe) => {
    if (iframe.closest(".prose-youtube-wrapper")) return;
    const wrapper = doc.createElement("figure");
    wrapper.className = "prose-youtube-wrapper";
    const inner = doc.createElement("div");
    inner.className = "relative w-full";
    inner.setAttribute(
      "style",
      "aspect-ratio: 16/9; padding: 0; box-sizing: border-box"
    );
    iframe.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%");
    iframe.parentNode?.insertBefore(wrapper, iframe);
    wrapper.appendChild(inner);
    inner.appendChild(iframe);
  });

  doc.querySelectorAll("blockquote").forEach((bq) => {
    if (bq.querySelector(".quote-decor")) return;
    const span = doc.createElement("span");
    span.className = "quote-decor";
    span.setAttribute("aria-hidden", "true");
    span.textContent = QUOTE_CHAR;
    bq.insertBefore(span, bq.firstChild);
  });

  const imgs = Array.from(doc.querySelectorAll("img"));
  imgs.forEach((img) => {
    if (img.closest(".prose-img-wrapper")) return;
    const src = img.getAttribute("src");
    if (src) imageUrls.push(src);

    const parent = img.parentNode;
    if (!parent) return;

    const displayWidth = img.getAttribute("data-display-width");
    const previewWidth =
      img.getAttribute("data-preview-width") || img.getAttribute("width");
    const hasCustomWidth =
      (displayWidth && displayWidth !== "full") ||
      (previewWidth && parseInt(previewWidth, 10) > 0);

    const wrapper = doc.createElement("button");
    wrapper.type = "button";
    wrapper.className = hasCustomWidth
      ? "prose-img-wrapper cursor-pointer group relative block overflow-hidden rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white"
      : "prose-img-wrapper cursor-pointer group relative block w-full overflow-hidden rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white";
    wrapper.setAttribute("data-cursor-hover", "");
    wrapper.setAttribute("data-cursor-aperture", "");
    if (src) wrapper.setAttribute("data-index", String(imageUrls.length - 1));
    const alignment = img.getAttribute("data-text-alignment");
    wrapper.setAttribute("data-text-alignment", alignment || "center");

    if (displayWidth && displayWidth !== "full") {
      wrapper.setAttribute("data-display-width", displayWidth);
      wrapper.setAttribute(
        "style",
        `width: ${displayWidth}%; max-width: ${displayWidth}%`
      );
    } else if (previewWidth) {
      const px = parseInt(previewWidth, 10);
      if (!isNaN(px) && px > 0) {
        wrapper.setAttribute("style", `max-width: ${px}px`);
      }
    }

    const insertParent = parent.nodeName === "P" ? parent.parentNode : parent;
    if (!insertParent) return;
    const insertBefore = parent.nodeName === "P" ? parent : img;
    insertParent.insertBefore(wrapper, insertBefore);
    wrapper.appendChild(img);
    img.setAttribute("data-cursor-aperture", "");

    if (!hasCustomWidth) {
      const fileWrapper = wrapper.closest(".bn-file-block-content-wrapper") as
        | (Element & { style?: CSSStyleDeclaration })
        | null;
      if (fileWrapper?.style) {
        fileWrapper.style.width = "100%";
        fileWrapper.style.maxWidth = "100%";
      }
    }
  });

  const bodyHtml = doc.body?.innerHTML ?? html;
  return { processedHtml: bodyHtml, imageUrls, tocItems };
}
