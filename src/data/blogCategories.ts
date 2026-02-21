export interface BlogCategoryItem {
  slug: string;
  label: string;
  subcategories?: { slug: string; label: string }[];
}

export const BLOG_CATEGORIES: BlogCategoryItem[] = [
  { slug: "info", label: "Info" },
  { slug: "putovanja", label: "Putovanja" },
  {
    slug: "sport",
    label: "Sport",
    subcategories: [
      { slug: "nogomet", label: "Nogomet" },
      { slug: "rukomet", label: "Rukomet" },
      { slug: "kosarka", label: "Košarka" },
      { slug: "atletika", label: "Atletika" },
      { slug: "automobilizam", label: "Automobilizam" },
    ],
  },
  { slug: "koncerti", label: "Koncerti" },
  { slug: "auti", label: "Auti" },
  { slug: "kucnecarolije", label: "Kućne čarolije" },
  { slug: "macro", label: "Macro" },

  { slug: "avioni", label: "Avioni" },
  { slug: "savjeti", label: "Savjeti" },
  {
    slug: "gradovi",
    label: "Gradovi",
    subcategories: [
      { slug: "zagrebancije", label: "Zagrebancije" },
      { slug: "amsterdam", label: "Amsterdam" },
      { slug: "london", label: "London" },
      { slug: "edinburgh", label: "Edinburgh" },
      { slug: "barcelona", label: "Barcelona" },
      { slug: "budimpesta", label: "Budimpešta" },
    ],
  },
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

/** Subcategory slug → parent slug (za prikaz roditelja + podkategorije odvojeno) – derivirano iz BLOG_CATEGORIES */
const SUB_TO_PARENT: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const cat of BLOG_CATEGORIES) {
    for (const sub of cat.subcategories ?? []) {
      m[sub.slug] = cat.slug;
    }
  }
  return m;
})();

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

/** Subcategories of a parent (za filtriranje) – derivirano iz BLOG_CATEGORIES */
export function getParentToSubs(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const cat of BLOG_CATEGORIES) {
    if (cat.subcategories?.length) {
      map[cat.slug] = cat.subcategories.map((s) => s.slug);
    }
  }
  return map;
}

const PARENT_TO_SUBS: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {};
  for (const cat of BLOG_CATEGORIES) {
    if (cat.subcategories?.length) {
      m[cat.slug] = cat.subcategories.map((s) => s.slug);
    }
  }
  return m;
})();

/** Format date as dd. mm. yyyy. (input: YYYY-MM-DD) */
export function formatBlogDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}. ${m}. ${y}.`;
}

/**
 * Podaci za stacked bar chart – glavne kategorije na X-osi, podkategorije kao segmenti.
 * Vraća { data, segmentKeys, segmentLabels } za Recharts.
 */
export function getBlogCategoryStackedChartData(
  posts: { category?: string; categories?: string[]; thumbnail?: string; gallery?: unknown[] }[],
  getImageCount: (post: { thumbnail?: string; gallery?: unknown[] }) => number
): {
  data: Record<string, string | number>[];
  segmentKeys: string[];
  segmentLabels: Record<string, string>;
} {
  const segmentKeys: string[] = [];
  const segmentLabels: Record<string, string> = {};
  const rows: Record<string, Record<string, string | number>> = {};

  for (const cat of BLOG_CATEGORIES) {
    const row: Record<string, string | number> = { name: cat.label };
    rows[cat.slug] = row;

    if (cat.subcategories?.length) {
      row[cat.slug] = 0;
      if (!segmentKeys.includes(cat.slug)) {
        segmentKeys.push(cat.slug);
        segmentLabels[cat.slug] = cat.label;
      }
      for (const sub of cat.subcategories) {
        if (!segmentKeys.includes(sub.slug)) {
          segmentKeys.push(sub.slug);
          segmentLabels[sub.slug] = sub.label;
        }
        row[sub.slug] = 0;
      }
    } else {
      if (!segmentKeys.includes(cat.slug)) {
        segmentKeys.push(cat.slug);
        segmentLabels[cat.slug] = cat.label;
      }
      row[cat.slug] = 0;
    }
  }

  for (const post of posts) {
    const imgCount = getImageCount(post);
    if (imgCount <= 0) continue;

    const cats = getPostCategories(post);
    const processedParents = new Set<string>();

    for (const slug of cats) {
      const parent = SUB_TO_PARENT[slug];
      if (parent) {
        if (processedParents.has(parent)) continue;
        processedParents.add(parent);
        if (rows[parent]) rows[parent][slug] = (Number(rows[parent][slug]) || 0) + imgCount;
      } else {
        const cat = BLOG_CATEGORIES.find((c) => c.slug === slug);
        if (cat?.subcategories?.length) {
          if (processedParents.has(slug)) continue;
          processedParents.add(slug);
          const subInCats = cat.subcategories.find((s) => cats.includes(s.slug));
          const segment = subInCats ? subInCats.slug : slug;
          if (rows[slug]) rows[slug][segment] = (Number(rows[slug][segment]) || 0) + imgCount;
        } else if (rows[slug]) {
          rows[slug][slug] = (Number(rows[slug][slug]) || 0) + imgCount;
        }
      }
    }
  }

  type RowWithTotal = Record<string, string | number> & { _total: number };
  const data = Object.entries(rows)
    .map(([_, row]): RowWithTotal | null => {
      const total = Object.entries(row)
        .filter(([k]) => k !== "name")
        .reduce((s, [, v]) => s + (Number(v) || 0), 0);
      if (total === 0) return null;
      return { ...row, _total: total };
    })
    .filter((r): r is RowWithTotal => r !== null)
    .sort((a, b) => b._total - a._total)
    .map(({ _total: _t, ...r }) => r as Record<string, string | number>);

  const usedKeys = new Set<string>();
  for (const row of data) {
    for (const key of segmentKeys) {
      if (Number(row[key]) > 0) usedKeys.add(key);
    }
  }
  const activeSegmentKeys = segmentKeys.filter((k) => usedKeys.has(k));

  return { data, segmentKeys: activeSegmentKeys, segmentLabels };
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
