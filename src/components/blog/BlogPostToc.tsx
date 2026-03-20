"use client";

import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";
import type { ProseTocItem } from "@/lib/processProseHtml";

export default function BlogPostToc({ items }: { items: ProseTocItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Sadržaj članka">
      <p className={`mb-3 text-sm ${BLOG_WIDGET_UI.title}`}>Sadržaj</p>
      <ul className="max-h-[min(50vh,20rem)] space-y-1 overflow-y-auto overscroll-contain text-sm">
        {items.map((item) => {
          const indentRem = Math.max(0, item.level - 1) * 0.75;
          return (
            <li key={item.id} style={{ marginLeft: `${indentRem}rem` }}>
              <a
                href={`#${item.id}`}
                className={`block rounded-lg px-3 py-2 text-left ${BLOG_WIDGET_UI.itemInactive} ${
                  item.level > 3 ? "text-xs text-zinc-500" : ""
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
