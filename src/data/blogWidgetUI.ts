/**
 * Centralizirani stilovi za blog sidebar widgete
 *
 * Dizajn: jedinstveni panel – bijela pozadina, tamna slova.
 * Koristi BLOG_WIDGET_UI u SearchWidget, CategoriesWidget, FeaturedPostsWidget, PlansWidget, GoogleMapsWidget.
 *
 * Povezani fajlovi:
 * - src/components/blog/BlogSidebar.tsx
 * - src/components/blog/SearchWidget.tsx
 * - src/components/blog/CategoriesWidget.tsx
 * - src/components/blog/FeaturedPostsWidget.tsx
 * - src/components/blog/PlansWidget.tsx
 * - src/components/blog/GoogleMapsWidget.tsx
 */

export const BLOG_WIDGET_UI = {
  /** Jedinstveni panel – bijela pozadina */
  panel:
    "rounded-2xl bg-white shadow-md shadow-zinc-200/40 overflow-hidden",

  /** Naslov sekcije – koristi theme-widget-title */
  title: "theme-widget-title font-normal tracking-tight",

  /** Input za pretragu */
  inputWrapper:
    "flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 transition-colors duration-200 focus-within:border-zinc-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-zinc-200/80 focus-within:ring-offset-2 focus-within:ring-offset-white",

  /** Link/item – aktivna stavka */
  itemActive:
    "rounded-lg bg-zinc-100 font-medium text-zinc-900 ring-1 ring-zinc-200/60",

  /** Link/item – neaktivna stavka */
  itemInactive:
    "rounded-lg text-zinc-600 transition-colors duration-150 hover:bg-zinc-50 hover:text-zinc-900",

  /** Tab (mapa) – aktivni */
  tabActive: "rounded-lg bg-zinc-900 font-medium text-white",

  /** Tab (mapa) – neaktivni */
  tabInactive:
    "rounded-lg bg-zinc-100 text-zinc-600 transition-colors duration-150 hover:bg-zinc-200 hover:text-zinc-900",

  /** Okvir za iframe (mapa) */
  iframeWrapper:
    "overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/30",

  /** Thumbnail placeholder */
  thumbnailPlaceholder:
    "flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400",

  /** Thumbnail container */
  thumbnailImage:
    "h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100",
} as const;
