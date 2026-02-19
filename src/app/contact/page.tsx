import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import AboutImage from "@/components/AboutImage";
import ContactForm from "@/components/ContactForm";
import ProseContent from "@/components/ProseContent";
import { getPages } from "@/lib/pages";

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  const { title, seo } = pages.contact;
  const metaTitle = seo?.metaTitle?.trim() || title;
  const description = seo?.metaDescription?.trim() || undefined;
  const keywords = seo?.keywords?.trim()
    ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;
  return {
    title: metaTitle,
    description,
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    alternates: { canonical: "/contact" },
    openGraph: {
      title: metaTitle,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description,
    },
  };
}

export default async function ContactPage() {
  const pages = await getPages();
  const { title, html, email, formspreeEndpoint } = pages.contact;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>

      <div className="flex flex-col pt-16 lg:flex-row">
        {/* Lijevo – statična slika (fixed na desktopu, uža ~40%) */}
        <aside className="fixed left-0 top-16 bottom-0 hidden w-2/5 lg:block">
          <div className="relative h-full w-full bg-zinc-900">
            <AboutImage src="/contact.jpg" alt="Contact" />
          </div>
        </aside>
        {/* Mobil: slika na vrhu */}
        <div className="relative aspect-[4/5] w-full bg-zinc-900 lg:hidden">
          <AboutImage src="/about-photo.jpg" alt="Contact" />
        </div>

        {/* Desno – scrollabilni sadržaj */}
        <main className="min-h-screen flex-1 overflow-y-auto lg:ml-[40%]">
          <div className="mx-auto max-w-2xl px-6 py-12 pb-24 md:py-16 md:pb-24 lg:py-20 lg:pb-24">
            <Link
              href="/"
              className="mb-16 inline-flex items-center gap-2 text-sm font-extralight tracking-[0.2em] text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="theme-heading-on-dark mb-12 font-light tracking-tight text-white">
              {title}
            </h1>
            <ProseContent
              html={html}
              className="prose prose-invert prose-lg max-w-none mb-12 [&_a]:text-white/80 [&_a]:underline [&_a:hover]:text-white"
            />
            <div id="contact-form">
              <ContactForm email={email} formspreeEndpoint={formspreeEndpoint} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
