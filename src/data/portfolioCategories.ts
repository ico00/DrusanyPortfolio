/**
 * Portfolio kategorije – jedan izvor za slug + label (sitemap, static params, Header, HeroSlider).
 * Ikone za admin: `@/data/portfolioCategoryIcons` → PORTFOLIO_CATEGORIES_WITH_ICONS.
 */

export const PORTFOLIO_CATEGORIES = [
  { slug: "concerts", label: "Concerts" },
  { slug: "sport", label: "Sport" },
  { slug: "animals", label: "Animals" },
  { slug: "interiors", label: "Interiors" },
  { slug: "zagreb", label: "Zagreb" },
  { slug: "food-drink", label: "Food & Drink" },
] as const;

export const PORTFOLIO_CATEGORY_SLUGS = PORTFOLIO_CATEGORIES.map((c) => c.slug);
