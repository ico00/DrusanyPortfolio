import type { Metadata } from "next";
import { Suspense } from "react";
import { getGallery } from "@/lib/getGallery";
import {
  getGalleryImageSharePath,
  pickGalleryShareImage,
} from "@/lib/galleryCategory";
import Header from "@/components/Header";
import { PORTFOLIO_CATEGORIES } from "@/data/portfolioCategories";
import CategoryGalleryPage from "@/components/CategoryGalleryPage";

function normalizeBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://drusany.com").replace(
    /\/+$/,
    "",
  );
}

export function generateStaticParams() {
  return PORTFOLIO_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const slug = category?.toLowerCase() ?? "";
  const cat = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);
  const label = cat?.label ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  const title = `${label} - Ivica Drusany`;
  const description =
    cat?.metaDescription ??
    `${label} photography portfolio by Ivica Drusany.`;

  const { images } = await getGallery();
  const featured = pickGalleryShareImage(images, slug);
  const sharePath = featured ? getGalleryImageSharePath(featured) : "";
  const baseUrl = normalizeBaseUrl();
  const canonicalPath = `/${slug}`;
  const pageUrl = `${baseUrl}${canonicalPath}`.replace(/\/+$/, "");
  const imageUrl = sharePath ? `${baseUrl}${sharePath}` : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            alt: featured?.alt?.trim() || featured?.title || label,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const { images } = await getGallery();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <main className="pt-0">
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          <CategoryGalleryPage images={images} categorySlug={category} />
        </Suspense>
      </main>
    </div>
  );
}
