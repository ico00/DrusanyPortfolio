import type { Metadata } from "next";
import { Suspense } from "react";
import { getGallery } from "@/lib/getGallery";
import Header from "@/components/Header";
import { PORTFOLIO_CATEGORIES } from "@/data/portfolioCategories";
import CategoryGalleryPage from "@/components/CategoryGalleryPage";

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

  return {
    title: { absolute: title },
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
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
