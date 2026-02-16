export interface BlogCategoryItem {
  slug: string;
  label: string;
  subcategories?: { slug: string; label: string }[];
}

export const BLOG_CATEGORIES: BlogCategoryItem[] = [
  { slug: "fotografija", label: "Fotografija" },
  { slug: "vesti", label: "Vesti" },
  { slug: "putovanja", label: "Putovanja" },
  {
    slug: "sport",
    label: "Sport",
    subcategories: [
      { slug: "nogomet", label: "Nogomet" },
      { slug: "rukomet", label: "Rukomet" },
      { slug: "kosarka", label: "Košarka" },
    ],
  },
  { slug: "tehnologija", label: "Tehnologija" },
  { slug: "osobno", label: "Osobno" },
  { slug: "savjeti", label: "Savjeti" },
];

/** Flattened list of all selectable slugs (parent + sub) for dropdown */
export interface BlogCategoryOption {
  slug: string;
  label: string;
  fullLabel: string;
  isSub: boolean;
}

export function getBlogCategoryOptions(): BlogCategoryOption[] {
  const options: BlogCategoryOption[] = [];
  for (const cat of BLOG_CATEGORIES) {
    if (cat.subcategories && cat.subcategories.length > 0) {
      options.push({
        slug: cat.slug,
        label: cat.label,
        fullLabel: cat.label,
        isSub: false,
      });
      for (const sub of cat.subcategories) {
        options.push({
          slug: sub.slug,
          label: sub.label,
          fullLabel: `${cat.label} › ${sub.label}`,
          isSub: true,
        });
      }
    } else {
      options.push({
        slug: cat.slug,
        label: cat.label,
        fullLabel: cat.label,
        isSub: false,
      });
    }
  }
  return options;
}

/** Legacy slugs (sport-nogomet) → new flat slug (nogomet) for backward compat */
const LEGACY_SLUG_MAP: Record<string, string> = {
  "sport-nogomet": "nogomet",
  "sport-rukomet": "rukomet",
  "sport-kosarka": "kosarka",
};

/** Subcategory slug → parent slug (za prikaz roditelja + podkategorije odvojeno) */
const SUB_TO_PARENT: Record<string, string> = {
  nogomet: "sport",
  rukomet: "sport",
  kosarka: "sport",
};

/** Get display label for a stored slug (e.g. "nogomet" → "Sport › Nogomet") */
export function getBlogCategoryLabel(slug: string): string {
  if (!slug?.trim()) return "";
  const normalized = LEGACY_SLUG_MAP[slug.toLowerCase().trim()] ?? slug.toLowerCase().trim();
  const options = getBlogCategoryOptions();
  const opt = options.find((o) => o.slug === normalized);
  return opt?.fullLabel ?? slug;
}

/** Kratki label za pill (Sport, Rukomet – bez roditelja) */
export function getShortCategoryLabel(slug: string): string {
  if (!slug?.trim()) return "";
  const normalized = LEGACY_SLUG_MAP[slug.toLowerCase().trim()] ?? slug.toLowerCase().trim();
  const options = getBlogCategoryOptions();
  const opt = options.find((o) => o.slug === normalized);
  return opt?.label ?? slug;
}

/**
 * Kategorije za prikaz – subkategorije se proširuju s roditeljem.
 * Npr. post s "rukomet" → ["sport", "rukomet"] (dva odvojena pilla)
 */
export function getDisplayCategories(post: {
  category?: string;
  categories?: string[];
}): string[] {
  const cats = getPostCategories(post);
  const expanded = new Set<string>();
  for (const slug of cats) {
    const parent = SUB_TO_PARENT[slug];
    if (parent) {
      expanded.add(parent);
      expanded.add(slug);
    } else {
      expanded.add(slug);
    }
  }
  return Array.from(expanded).sort();
}

/** Get labels for multiple slugs */
export function getBlogCategoryLabels(slugs: string[]): string[] {
  return slugs.map((s) => getBlogCategoryLabel(s)).filter(Boolean);
}

/** Normalize post to always have categories array (backward compat with category) */
export function getPostCategories(post: {
  category?: string;
  categories?: string[];
}): string[] {
  let raw: string[] = [];
  if (Array.isArray(post.categories) && post.categories.length > 0) {
    raw = post.categories;
  } else if (post.category?.trim()) {
    raw = [post.category.trim()];
  }
  return raw.map((s) => LEGACY_SLUG_MAP[s.toLowerCase().trim()] ?? s.toLowerCase().trim());
}

/** Subcategories of a parent (za filtriranje: Sport uključuje Rukomet, Nogomet, Košarka) */
const PARENT_TO_SUBS: Record<string, string[]> = {
  sport: ["nogomet", "rukomet", "kosarka"],
};

/** Format date as dd. mm. yyyy. (input: YYYY-MM-DD) */
export function formatBlogDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}. ${m}. ${y}.`;
}

/** Check if post has a given category (for filtering) */
export function postHasCategory(post: {
  category?: string;
  categories?: string[];
}, filterSlug: string): boolean {
  const slug = filterSlug.toLowerCase().trim();
  const cats = getPostCategories(post);
  if (cats.includes(slug)) return true;
  const subs = PARENT_TO_SUBS[slug];
  if (subs) return subs.some((s) => cats.includes(s));
  return false;
}
