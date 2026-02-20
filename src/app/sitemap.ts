import type { MetadataRoute } from "next";
import { getBlog, getPublishedPosts } from "@/lib/blog";
import { getTotalPages, sortPostsByDate } from "@/lib/pagination";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://drusany.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const { posts } = await getBlog();
  const published = getPublishedPosts(posts);
  const sorted = sortPostsByDate(published);
  const totalPages = getTotalPages(sorted.length);

  const blogListPages: MetadataRoute.Sitemap = [];
  for (let page = 2; page <= totalPages; page++) {
    blogListPages.push({
      url: `${siteUrl}/blog/page/${page}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    });
  }

  const blogPostPages: MetadataRoute.Sitemap = sorted.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date + (post.time ? `T${post.time}:00` : "T12:00:00")) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...blogListPages, ...blogPostPages];
}
