/** Portfolio kategorije – koristi se za generateStaticParams, sitemap, Header, itd. */

export const PORTFOLIO_CATEGORIES = [
  { slug: "concerts", label: "Concerts" },
  { slug: "sport", label: "Sport" },
  { slug: "animals", label: "Animals" },
  { slug: "interiors", label: "Interiors" },
  { slug: "zagreb", label: "Zagreb" },
  { slug: "food-drink", label: "Food & Drink" },
] as const;

export const PORTFOLIO_CATEGORY_SLUGS = PORTFOLIO_CATEGORIES.map((c) => c.slug);
