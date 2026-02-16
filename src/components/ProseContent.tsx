"use client";

import { useEffect, useRef } from "react";

const QUOTE_CHAR = "\u201C"; // Lijevi tipografski navodnik (zaobljen)

export default function ProseContent({
  html,
  className,
  id,
}: {
  html: string;
  className?: string;
  id?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const blockquotes = el.querySelectorAll("blockquote");
    blockquotes.forEach((bq) => {
      if (bq.querySelector(".quote-decor")) return;
      const span = document.createElement("span");
      span.className = "quote-decor";
      span.setAttribute("aria-hidden", "true");
      span.textContent = QUOTE_CHAR;
      bq.insertBefore(span, bq.firstChild);
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
