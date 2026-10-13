/**
 * Portfolio kategorije – jedan izvor za slug + label (sitemap, static params, Header, HeroSlider).
 * Ikone za admin: `@/data/portfolioCategoryIcons` → PORTFOLIO_CATEGORIES_WITH_ICONS.
 */

export const PORTFOLIO_CATEGORIES = [
  {
    slug: "concerts",
    label: "Concerts",
    metaDescription:
      "If the music is good, the photo has to feel like it. Ivica Drusany - capturing the energy in the first three songs.",
  },
  {
    slug: "sport",
    label: "Sport",
    metaDescription:
      "Blood, sweat, and tears in a fraction of a second. Ivica Drusany - no faking it, just the raw effort as it happened on the sports field.",
  },
  {
    slug: "animals",
    label: "Animals",
    metaDescription:
      "From the fierce and the grand to the small and the funny. Ivica Drusany - captured moments of magnificent beings and their unique characters.",
  },
  {
    slug: "interiors",
    label: "Interiors",
    metaDescription:
      "Showing your space in its best light. Ivica Drusany - simple, clean interior photography focused on the natural feel of the room.",
  },
  {
    slug: "zagreb",
    label: "Zagreb",
    metaDescription:
      "Zagreb, my city through my lens. Street scenes, architecture, and those small, everyday moments that make Zagreb what it is.",
  },
  {
    slug: "food-drink",
    label: "Food & Drink",
    metaDescription:
      "If the food is delicious, the photo should be too.",
  },
  {
    slug: "iphoneography",
    label: "iPhoneography",
    metaDescription:
      "It is in your pocket or in your purse. There is no excuse not to take a good photo. Ivica Drusany - everyday moments captured on the go, edited on the phone.",
  },
] as const;

export const PORTFOLIO_CATEGORY_SLUGS = PORTFOLIO_CATEGORIES.map((c) => c.slug);
