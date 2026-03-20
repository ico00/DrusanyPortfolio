"use client";

import { useMemo, type ReactNode } from "react";
import ProseContent from "@/components/ProseContent";
import BlogPostToc from "@/components/blog/BlogPostToc";
import { processProseHtml } from "@/lib/processProseHtml";

type Props = {
  header: ReactNode;
  thumbnail: ReactNode;
  authorMobile: ReactNode;
  proseHtml: string;
  gallery: ReactNode;
  sidebar: ReactNode;
};

/**
 * Jedan parse proze (TOC + ProseContent) i raspored: TOC iznad teksta na mobilu, u sticky sidebaru na lg+.
 */
export default function BlogPostLayoutClient({
  header,
  thumbnail,
  authorMobile,
  proseHtml,
  gallery,
  sidebar,
}: Props) {
  const processed = useMemo(() => processProseHtml(proseHtml), [proseHtml]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
        <article className="min-w-0 flex-1" data-blog-reading-article>
          {header}
          {thumbnail}
          {authorMobile}
          <div className="overflow-x-hidden bg-white py-12 md:py-16 -mx-6 w-[calc(100%+3rem)] px-6 md:mx-0 md:w-full">
            {processed.tocItems.length > 0 && (
              <div className="mb-8 border-b border-zinc-200 pb-5 lg:hidden">
                <BlogPostToc items={processed.tocItems} />
              </div>
            )}
            <ProseContent
              processed={{
                processedHtml: processed.processedHtml,
                imageUrls: processed.imageUrls,
              }}
              className="blog-post-prose prose prose-lg prose-zinc max-w-none prose-headings:font-serif"
            />
            {gallery}
          </div>
        </article>
        <aside className="w-full shrink-0 lg:w-80">
          <div className="sticky top-24">
            {processed.tocItems.length > 0 && (
              <div className="mb-8 hidden border-b border-zinc-200 pb-5 lg:block">
                <BlogPostToc items={processed.tocItems} />
              </div>
            )}
            {sidebar}
          </div>
        </aside>
      </div>
    </div>
  );
}
