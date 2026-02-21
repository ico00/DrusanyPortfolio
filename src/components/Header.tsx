"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Menu, X, Search } from "lucide-react";

export function DrusanyLogo({ className, fill }: { className?: string; fill?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 405.21 161.61"
      preserveAspectRatio="xMinYMid meet"
      className={className}
      fill={fill ?? "currentColor"}
    >
      <path d="M38.14,27.51l-.67,2.32h2.44l.67-2.32h-2.44Z" />
      <path d="M99,150.38l.26.26v-.19l-.26-.07ZM38.14,27.51l-.67,2.32h2.44l.67-2.32h-2.44Z" />
      <path d="M101.9,153.7l.21-.21,32.44-32.46-18.18-18.18,20.32-70.52L44.41,5.75l-6.27,21.76h2.44l5.43-18.88,87.8,25.29-19.3,67.06-12.93-12.93V27.51h-61l-.67,2.32h59.35v55.89l-7.06-7.06-32.46,32.44,39.27,39.27.26.07v.19l-.26-.26L12.36,125.41,39.91,29.83h-2.44L9.49,127.02l84.62,24.36H7.88V29.83h29.58l.67-2.32H5.56v126.19h96.02M99.26,147.34l-36.23-36.23,29.17-29.17,7.06,7.06v58.33ZM101.58,145.9v-54.57l12.19,12.19-12.19,42.38ZM131.28,121.02l-28.28,28.28,12.66-43.91,15.63,15.63Z" />
      <path d="M142.21,151.31v-40.43h10.73c7.01,0,12.65,1.58,16.93,4.74,4.81,3.57,7.22,8.73,7.22,15.47,0,7.62-3.33,13.35-9.98,17.18-3.52,2.03-8.24,3.04-14.17,3.04h-10.73ZM151.74,142.64h2.12c3.96,0,7.13-.91,9.51-2.73,2.64-2.03,3.96-4.96,3.96-8.81s-1.32-6.79-3.96-8.84c-2.38-1.84-5.55-2.76-9.51-2.76h-2.12v23.14Z" />
      <path d="M180.09,151.31v-40.43h10.4c5.76,0,9.96.95,12.6,2.84,3.16,2.27,4.74,5.28,4.74,9.03,0,5.22-2.51,8.95-7.52,11.18l12.33,17.38h-11.03l-10.79-15.86h-1.36s0,15.86,0,15.86h-9.37ZM191.05,118.25h-1.59v11.21h2.03c5,0,7.5-1.91,7.5-5.72,0-2.18-.83-3.69-2.48-4.55-1.21-.63-3.03-.95-5.47-.95Z" />
      <path d="M223.63,110.89v22.22c0,7.12,2.64,10.68,7.92,10.68s7.89-3.23,7.89-9.7v-23.2h8.62v23.2c0,5.63-1.4,10.08-4.21,13.33-2.98,3.48-7.22,5.22-12.74,5.22s-9.84-1.71-12.8-5.13c-2.81-3.23-4.21-7.69-4.21-13.35v-23.25h9.54Z" />
      <path d="M252.3,139.88c4.5,2.75,8.31,4.13,11.43,4.13,1.43,0,2.66-.29,3.68-.86,1.24-.72,1.87-1.74,1.87-3.06,0-1.65-1.81-3.51-5.42-5.56-.33-.21-.77-.47-1.33-.8l-2.73-1.54c-5.22-2.94-7.83-6.78-7.83-11.54,0-3.49,1.36-6.27,4.07-8.34,2.45-1.86,5.49-2.79,9.12-2.79,2.84,0,8.3,1.01,12.27,2.38v9.48c-4.09-2.57-9.47-4.17-12.05-4.17-2.92,0-4.38,1.09-4.38,3.26,0,1.41.93,2.63,2.79,3.65l4.74,2.62c3.29,1.82,5.63,3.47,7.03,4.94,2.01,2.16,3.01,4.74,3.01,7.75,0,4.15-1.44,7.42-4.32,9.82-2.69,2.25-6.16,3.37-10.4,3.37-3.03,0-6.61-.65-10.73-1.95l-.81-10.79Z" />
      <path d="M299.77,127.61l8.25,17.82.98,2.29,1.57,3.6h10.1l-20.17-41.68h-.59l-20.63,41.68h9.71l1.6-3.6" />
      <path d="M323.68,151.31v-41.74h.92l25.18,23.59v-22.28h8.89v41.96h-.84s-25.25-23.57-25.25-23.57v22.04h-8.89Z" />
      <path d="M375.73,151.31v-19.18l-14.44-21.25h11.63l8.47,12.8,9.32-12.8h10.24l-15.62,20.9v19.53h-9.59Z" />
      <path d="M142.21,102.1v-31.47h3.73v31.47h-3.73Z" />
      <path d="M163.8,102.1l-13.82-31.47h3.99l9.98,23.11,10.28-23.11h3.7" />
      <path d="M233.62,70.63l13.82,31.47h-3.99l-9.98-23.11-10.28,23.11h-3.7" />
      <path d="M181.9,102.1v-31.47h3.73v31.47h-3.73Z" />
      <path d="M216.6,100.06c-3.02,2.04-6.39,3.06-10.13,3.06-3.32,0-6.36-.84-9.12-2.52-2.77-1.68-4.83-3.91-6.19-6.71-1.12-2.3-1.69-4.81-1.69-7.53,0-4.72,1.57-8.68,4.72-11.87,3.24-3.28,7.38-4.93,12.43-4.93,3.52,0,6.83.99,9.94,2.98l-.42,3.9c-3.03-2.33-6.19-3.49-9.47-3.49-3.97,0-7.19,1.34-9.64,4.02-2.31,2.53-3.47,5.66-3.47,9.4s1.14,6.81,3.42,9.31c2.42,2.65,5.61,3.97,9.55,3.97,3.55,0,7.02-1.33,10.41-3.99l-.33,4.41Z" />
      <path d="M99,150.38l.26.26v-.19l-.26-.07Z" />
    </svg>
  );
}

const PORTFOLIO_CATEGORIES = [
  { label: "Concerts", slug: "concerts" },
  { label: "Sport", slug: "sport" },
  { label: "Animals", slug: "animals" },
  { label: "Interiors", slug: "interiors" },
  { label: "Zagreb", slug: "zagreb" },
  { label: "Food & Drink", slug: "food-drink" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category");
  const isBlogPage = pathname === "/blog" || pathname.startsWith("/blog/");
  const isHeroMode = !category && !isBlogPage;

  const isHome = pathname === "/" && !category;
  const isPortfolio = pathname === "/" && !!category;
  const isAbout = pathname === "/about";
  const isBlog = pathname === "/blog";
  const isContact = pathname === "/contact";

  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const urlQuery = searchParams.get("q") ?? "";
  const [localSearchQuery, setLocalSearchQuery] = useState(urlQuery);
  const portfolioSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    return () => {
      if (portfolioSearchDebounceRef.current) clearTimeout(portfolioSearchDebounceRef.current);
    };
  }, []);

  const applyPortfolioSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) params.set("q", q);
    else params.delete("q");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}#gallery` : pathname, { scroll: false });
  };

  const handlePortfolioSearchChange = (q: string) => {
    setLocalSearchQuery(q);
    if (portfolioSearchDebounceRef.current) clearTimeout(portfolioSearchDebounceRef.current);
    portfolioSearchDebounceRef.current = setTimeout(() => {
      portfolioSearchDebounceRef.current = null;
      applyPortfolioSearch(q);
    }, 200);
  };

  const textClass = isHeroMode
    ? "text-white/90 hover:text-white"
    : "text-zinc-600 hover:text-zinc-900";
  const navLinkClass = (active: boolean) =>
    `inline-block pb-1 text-sm font-normal tracking-widest transition-[color,border-color] duration-200 ${textClass} ${
      active
        ? isHeroMode
          ? "border-b border-white"
          : "border-b border-zinc-900"
        : isHeroMode
          ? "border-b border-transparent hover:border-white"
          : "border-b border-transparent hover:border-zinc-900"
    }`;
  const dropdownBg = isHeroMode
    ? "border-white/20 bg-zinc-950/95"
    : "border-zinc-200/60 bg-white/95";
  const dropdownItemClass = isHeroMode
    ? "text-white/80 hover:bg-white/10 hover:text-white"
    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900";
  const mobileBg = isHeroMode
    ? "border-white/20 bg-zinc-950/95"
    : "border-zinc-200/40 bg-white/95";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerBg =
    !isHeroMode
      ? "border-b border-zinc-200/60 bg-white/95 backdrop-blur-xl"
      : scrolled
        ? "border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl"
        : "border-b border-transparent bg-transparent";

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 w-full transition-all duration-300 ${headerBg}`}>
      <div className="relative flex h-16 w-full max-w-7xl items-center justify-between pl-4 pr-8 md:pl-4 md:pr-12 lg:pl-6 lg:pr-16">
        <Link
          href="/"
          className="flex shrink-0 items-center transition-opacity hover:opacity-80"
          aria-label="Drusany"
        >
          <DrusanyLogo
            className="block h-9 w-auto"
            fill={isHeroMode ? "#ffffff" : "#18181b"}
          />
        </Link>

        <nav
          className="theme-nav hidden flex-1 items-center justify-end gap-12 md:flex md:gap-14 lg:gap-16"
        >
          <Link href="/" className={navLinkClass(isHome)}>
            Home
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1 pb-1 text-sm font-normal tracking-widest transition-[color,border-color] duration-200 ${textClass} ${
                isPortfolio
                  ? isHeroMode
                    ? "border-b border-white"
                    : "border-b border-zinc-900"
                  : isHeroMode
                    ? "border-b border-transparent hover:border-white"
                    : "border-b border-transparent hover:border-zinc-900"
              }`}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              Portfolio
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full pt-2">
                <div className={`min-w-[180px] rounded-lg border py-2 shadow-lg backdrop-blur-xl ${dropdownBg}`}>
                  {PORTFOLIO_CATEGORIES.map((cat) => {
                    const isActive = isPortfolio && category?.toLowerCase() === cat.slug;
                    return (
                      <Link
                        key={cat.slug}
                        href={`/?category=${cat.slug}#gallery`}
                        className={`block border-l-2 px-4 py-2 text-sm font-normal tracking-wider transition-colors ${dropdownItemClass} ${
                          isActive
                            ? isHeroMode
                              ? "border-white"
                              : "border-zinc-900"
                            : isHeroMode
                              ? "border-transparent hover:border-white"
                              : "border-transparent hover:border-zinc-900"
                        }`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        {cat.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Link href="/about" className={navLinkClass(isAbout)}>
            About
          </Link>

          <Link href="/blog" className={navLinkClass(isBlog)}>
            Blog
          </Link>

          <Link href="/contact" className={navLinkClass(isContact)}>
            Contact
          </Link>

          {isPortfolio && (
            <div
              className="ml-6 flex flex-row-reverse items-center gap-2 overflow-hidden"
              onMouseEnter={() => setSearchExpanded(true)}
              onMouseLeave={() => !localSearchQuery && setSearchExpanded(false)}
            >
              <Search className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={2} />
              <span
                className={`inline-flex overflow-hidden border-b border-zinc-300 transition-[width] duration-200 ${
                  localSearchQuery || searchExpanded ? "w-28" : "w-0"
                }`}
              >
                <input
                  type="search"
                  value={localSearchQuery}
                  onChange={(e) => handlePortfolioSearchChange(e.target.value)}
                  placeholder="Search..."
                  className="w-28 min-w-28 bg-transparent py-0.5 pl-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  aria-label="Search images"
                />
              </span>
            </div>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className={`flex p-2 md:hidden ${isHeroMode ? "text-white" : "text-zinc-900"}`}
          aria-label="Meni"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className={`theme-nav border-t px-8 py-6 backdrop-blur-xl md:hidden ${mobileBg}`}>
          <div className={`flex flex-col gap-4 ${isHeroMode ? "text-white/90" : "text-zinc-600"}`}>
            {isPortfolio && (
              <label className="flex items-center gap-2 border-b border-zinc-300 pb-4">
                <Search className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={2} />
                <input
                  type="search"
                  value={localSearchQuery}
                  onChange={(e) => handlePortfolioSearchChange(e.target.value)}
                  placeholder="Search..."
                  className={`flex-1 bg-transparent text-sm outline-none placeholder:opacity-60 ${
                    isHeroMode ? "text-white placeholder-white/50" : "text-zinc-900 placeholder-zinc-400"
                  }`}
                  aria-label="Search images"
                />
              </label>
            )}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`block py-1 pl-3 text-sm font-normal tracking-widest transition-colors border-l-2 ${
                isHeroMode ? "hover:text-white" : "hover:text-zinc-900"
              } ${isHome ? (isHeroMode ? "border-white" : "border-zinc-900") : isHeroMode ? "border-transparent hover:border-white" : "border-transparent hover:border-zinc-900"}`}
            >
              Home
            </Link>
            <div className="flex flex-col gap-2">
              <span className={`text-sm font-normal tracking-widest ${isHeroMode ? "text-white/60" : "text-zinc-400"}`}>Portfolio</span>
              {PORTFOLIO_CATEGORIES.map((cat) => {
                const isActive = isPortfolio && category?.toLowerCase() === cat.slug;
                return (
                  <Link
                    key={cat.slug}
                    href={`/?category=${cat.slug}#gallery`}
                    onClick={() => setMobileOpen(false)}
                    className={`block py-1 pl-6 text-sm font-normal tracking-wider transition-colors border-l-2 ${
                      isHeroMode ? "hover:text-white" : "hover:text-zinc-900"
                    } ${isActive ? (isHeroMode ? "border-white" : "border-zinc-900") : isHeroMode ? "border-transparent hover:border-white" : "border-transparent hover:border-zinc-900"}`}
                  >
                    {cat.label}
                  </Link>
                );
              })}
            </div>
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className={`block py-1 pl-3 text-sm font-normal tracking-widest transition-colors border-l-2 ${
                isHeroMode ? "hover:text-white" : "hover:text-zinc-900"
              } ${isAbout ? (isHeroMode ? "border-white" : "border-zinc-900") : isHeroMode ? "border-transparent hover:border-white" : "border-transparent hover:border-zinc-900"}`}
            >
              About
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileOpen(false)}
              className={`block py-1 pl-3 text-sm font-normal tracking-widest transition-colors border-l-2 ${
                isHeroMode ? "hover:text-white" : "hover:text-zinc-900"
              } ${isBlog ? (isHeroMode ? "border-white" : "border-zinc-900") : isHeroMode ? "border-transparent hover:border-white" : "border-transparent hover:border-zinc-900"}`}
            >
              Blog
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className={`block py-1 pl-3 text-sm font-normal tracking-widest transition-colors border-l-2 ${
                isHeroMode ? "hover:text-white" : "hover:text-zinc-900"
              } ${isContact ? (isHeroMode ? "border-white" : "border-zinc-900") : isHeroMode ? "border-transparent hover:border-white" : "border-transparent hover:border-zinc-900"}`}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
