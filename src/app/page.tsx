import { Suspense } from "react";
import { getGallery } from "@/lib/getGallery";
import Header from "@/components/Header";
import HomeContent from "@/components/HomeContent";

export default async function HomePage() {
  const { images } = await getGallery();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <main className="pt-0">
        <Suspense fallback={<div className="min-h-screen" />}>
          <HomeContent images={images} />
        </Suspense>
      </main>
    </div>
  );
}
