"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Palette, Save, ChevronDown, ChevronRight, Type } from "lucide-react";
import { FONT_OPTIONS, FONT_PREVIEW_MAP } from "@/data/themeFonts";
import type { ThemeConfig, ThemeElement, ThemeFontFamily } from "@/lib/theme";

const BLOG_HEADINGS_KEYS = [
  "headingH1",
  "headingH2",
  "headingH3",
  "headingH4",
  "headingH5",
  "headingH6",
  "blogPostTitle",
  "blogListCardTitle",
  "widgetTitle",
] as const;

const BLOG_BODY_KEYS = ["body", "quote", "code", "caption"] as const;

const ELEMENT_LABELS: Record<string, string> = {
  title: "Hero title",
  heading: "Headings (h1–h6)",
  headingOnDark: "Heading on dark background (About, Contact)",
  pageTitle: "Page title (light background)",
  blogPostTitle: "Blog post title",
  blogListCardTitle: "Blog list card title (below featured image)",
  blogListCardMetadata: "Blog list card metadata (author, date, category)",
  widgetTitle: "Blog sidebar widget title",
  body: "Body text",
  quote: "Quote (blockquote)",
  code: "Code block (pre/code)",
  nav: "Navigation",
  caption: "Caption / metadata",
};

const PREVIEW_TEXT: Record<string, string> = {
  title: "Hero title",
  heading: "Page title",
  headingOnDark: "Page title",
  pageTitle: "Blog",
  blogPostTitle: "Blog post title",
  blogListCardTitle: "Sport Metadata Generator",
  blogListCardMetadata: "Text and photos: Ivica Drusany · Published: 10.01.2026 · Category: Info",
  widgetTitle: "Categories",
  body: "This is sample body text displayed on the page.",
  quote: "This is sample quote text in blockquote style.",
  code: "const x = 42;",
  nav: "Home Portfolio About",
  caption: "Published: 18 February 2025.",
};

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
type HeadingLevelKey = `headingH${typeof HEADING_LEVELS[number]}`;

const FONT_WEIGHT_OPTIONS = [
  { value: "100", label: "100 (Thin)" },
  { value: "200", label: "200 (Extra Light)" },
  { value: "300", label: "300 (Light)" },
  { value: "400", label: "400 (Normal)" },
  { value: "500", label: "500 (Medium)" },
  { value: "600", label: "600 (Semi Bold)" },
  { value: "700", label: "700 (Bold)" },
  { value: "800", label: "800 (Extra Bold)" },
  { value: "900", label: "900 (Black)" },
] as const;

const FONT_STYLE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "italic", label: "Italic" },
] as const;

function ThemeFontSelect({
  value,
  onChange,
}: {
  value: ThemeFontFamily;
  onChange: (v: ThemeFontFamily) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = FONT_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-left text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select font"
      >
        <span className="flex items-center gap-3">
          <Type className="h-4 w-4 text-zinc-500" />
          <span>{selected?.label ?? "Select font"}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            className="absolute left-0 right-0 top-full z-[100] mt-1.5 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 py-1.5 shadow-xl shadow-black/30 ring-1 ring-zinc-800"
          >
            {FONT_OPTIONS.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-zinc-700/80 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <Type className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="ml-auto text-xs text-zinc-500">✓</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function isLightColor(color: string): boolean {
  if (color.startsWith("#")) {
    const hex = color.slice(1).replace(/^#/, "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgba) {
    const luminance =
      (0.299 * +rgba[1] + 0.587 * +rgba[2] + 0.114 * +rgba[3]) / 255;
    return luminance > 0.5;
  }
  return false;
}

function ElementCard({
  label,
  previewText,
  element,
  onUpdate,
}: {
  label: string;
  previewText: string;
  element: ThemeElement;
  onUpdate: (u: Partial<ThemeElement>) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-200">{label}</h3>
      <div
        className="mb-4 rounded-lg border border-zinc-700 p-3"
        style={{
          fontFamily:
            FONT_PREVIEW_MAP[element.fontFamily] ??
            "var(--font-geist-sans), sans-serif",
          fontSize: element.fontSize,
          fontWeight: element.fontWeight ?? "400",
          fontStyle: element.fontStyle ?? "normal",
          color: element.color,
          backgroundColor: isLightColor(element.color)
            ? "#27272a"
            : "#f4f4f5",
        }}
      >
        {previewText}
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-zinc-500">Font</label>
          <ThemeFontSelect
            value={element.fontFamily}
            onChange={(v) => onUpdate({ fontFamily: v })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-zinc-500">Size</label>
          <input
            type="text"
            value={element.fontSize}
            onChange={(e) => onUpdate({ fontSize: e.target.value })}
            placeholder="e.g. 1rem, clamp(2rem, 5vw, 4rem)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Weight</label>
            <select
              value={element.fontWeight ?? "400"}
              onChange={(e) => onUpdate({ fontWeight: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {FONT_WEIGHT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Style</label>
            <select
              value={element.fontStyle ?? "normal"}
              onChange={(e) => onUpdate({ fontStyle: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {FONT_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-zinc-500">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={
                element.color.startsWith("#") ? element.color : "#71717a"
              }
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800/50 p-1"
            />
            <input
              type="text"
              value={element.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              placeholder="#71717a or rgba(...)"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800/50"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
        )}
        {title}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-700 p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ThemeAdmin() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedHeadingLevel, setSelectedHeadingLevel] = useState<
    1 | 2 | 3 | 4 | 5 | 6
  >(1);

  const fetchTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/theme");
      if (res.ok) {
        const data = (await res.json()) as ThemeConfig;
        setTheme(data);
      } else {
        setTheme(null);
      }
    } catch (err) {
      console.error("Theme fetch error:", err);
      setTheme(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const updateElement = (
    key: keyof ThemeConfig | string,
    updates: Partial<ThemeElement>
  ) => {
    if (!theme) return;
    const el = theme[key as keyof ThemeConfig];
    if (!el || typeof el !== "object" || !("fontFamily" in el)) return;
    setTheme({
      ...theme,
      [key]: { ...el, ...updates },
    });
  };

  const updateGroup = (
    keys: readonly string[],
    updates: Partial<ThemeElement>
  ) => {
    if (!theme) return;
    const next = { ...theme };
    for (const key of keys) {
      const el = next[key as keyof ThemeConfig];
      if (el && typeof el === "object" && "fontFamily" in el) {
        (next as Record<string, ThemeElement>)[key] = {
          ...el,
          ...updates,
        };
      }
    }
    setTheme(next);
  };

  const handleSave = async () => {
    if (!theme) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Theme save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading theme settings…
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="rounded-lg border border-amber-800/50 bg-amber-900/20 p-4 text-amber-200">
        <p className="font-medium">Theme API is not available</p>
        <p className="mt-1 text-sm text-amber-200/80">
          Theme editing only works in development mode (
          <code>npm run dev</code>). For production, edit{" "}
          <code>src/data/theme.json</code> manually and run{" "}
          <code>npm run build</code>.
        </p>
      </div>
    );
  }

  const blogHeadingsSource = theme.headingH1 ?? theme.blogPostTitle;
  const blogBodySource = theme.body ?? theme.quote;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-200">
          <Palette className="h-5 w-5 text-amber-400" />
          Customize Theme
        </h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <p className="text-sm text-zinc-400">
        Changes apply after saving. For static export run{" "}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5">npm run build</code>
        .
      </p>

      <div className="space-y-3">
        <AccordionSection title="Blog Headings (group)" defaultOpen={false}>
          <p className="mb-4 text-xs text-zinc-500">
            Change font, size and color for all blog headings at once.
          </p>
          {blogHeadingsSource && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ElementCard
                label="Apply to all: headings (h1–h6), blog post title, blog list card title, widget title"
                previewText="Heading preview"
                element={blogHeadingsSource}
                onUpdate={(u) => updateGroup(BLOG_HEADINGS_KEYS as unknown as string[], u)}
              />
            </div>
          )}
        </AccordionSection>

        <AccordionSection title="Blog Body (group)" defaultOpen={false}>
          <p className="mb-4 text-xs text-zinc-500">
            Change font, size and color for body text, quotes and code at once.
          </p>
          {blogBodySource && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ElementCard
                label="Apply to all: body, quote, code, caption"
                previewText="Body text preview"
                element={blogBodySource}
                onUpdate={(u) => updateGroup(BLOG_BODY_KEYS as unknown as string[], u)}
              />
            </div>
          )}
        </AccordionSection>

        <AccordionSection title="Page titles" defaultOpen={false}>
          <p className="mb-4 text-xs text-zinc-500">
            Glavni naslov stranice – Page title za svijetlu pozadinu (Blog), Heading on dark za tamnu (About, Contact).
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(["pageTitle", "headingOnDark"] as const)
              .filter(
                (k) =>
                  theme[k] &&
                  typeof theme[k] === "object" &&
                  "fontFamily" in (theme[k] as object)
              )
              .map((key) => (
                <ElementCard
                  key={key}
                  label={ELEMENT_LABELS[key]}
                  previewText={PREVIEW_TEXT[key]}
                  element={theme[key] as ThemeElement}
                  onUpdate={(u) => updateElement(key, u)}
                />
              ))}
          </div>
        </AccordionSection>

        <AccordionSection title="Hero & Navigation" defaultOpen={false}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(["title", "nav", "caption"] as const)
              .filter(
                (k) =>
                  theme[k] &&
                  typeof theme[k] === "object" &&
                  "fontFamily" in (theme[k] as object)
              )
              .map((key) => (
                <ElementCard
                  key={key}
                  label={ELEMENT_LABELS[key]}
                  previewText={PREVIEW_TEXT[key]}
                  element={theme[key] as ThemeElement}
                  onUpdate={(u) => updateElement(key, u)}
                />
              ))}
          </div>
        </AccordionSection>

        <AccordionSection title="Headings (individual)" defaultOpen={false}>
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(["blogPostTitle", "blogListCardTitle", "blogListCardMetadata"] as const)
                .filter(
                  (k) =>
                    theme[k] &&
                    typeof theme[k] === "object" &&
                    "fontFamily" in (theme[k] as object)
                )
                .map((key) => (
                  <ElementCard
                    key={key}
                    label={ELEMENT_LABELS[key]}
                    previewText={PREVIEW_TEXT[key]}
                    element={theme[key] as ThemeElement}
                    onUpdate={(u) => updateElement(key, u)}
                  />
                ))}
            </div>
            {theme.headingH1 && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                <h3 className="mb-4 text-sm font-medium text-zinc-200">
                  {ELEMENT_LABELS.heading}
                </h3>
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs text-zinc-500">
                    Edit level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HEADING_LEVELS.map((level) => {
                      const headingKey = `headingH${level}` as HeadingLevelKey;
                      const el = theme[headingKey];
                      if (!el) return null;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSelectedHeadingLevel(level)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            selectedHeadingLevel === level
                              ? "bg-amber-500/30 text-amber-400 ring-1 ring-amber-500/50"
                              : "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          h{level}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {(() => {
                  const headingKey =
                    `headingH${selectedHeadingLevel}` as HeadingLevelKey;
                  const el = theme[headingKey];
                  if (!el) return null;
                  return (
                    <ElementCard
                      label={`Heading level ${selectedHeadingLevel}`}
                      previewText={`Heading level ${selectedHeadingLevel}`}
                      element={el}
                      onUpdate={(u) => updateElement(headingKey, u)}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        </AccordionSection>

        <AccordionSection title="Body & Text (individual)" defaultOpen={false}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(["body", "quote", "code"] as const)
              .filter(
                (k) =>
                  theme[k] &&
                  typeof theme[k] === "object" &&
                  "fontFamily" in (theme[k] as object)
              )
              .map((key) => (
                <ElementCard
                  key={key}
                  label={ELEMENT_LABELS[key]}
                  previewText={PREVIEW_TEXT[key]}
                  element={theme[key] as ThemeElement}
                  onUpdate={(u) => updateElement(key, u)}
                />
              ))}
          </div>
        </AccordionSection>

        <AccordionSection title="Other" defaultOpen={false}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {theme.widgetTitle && (
              <ElementCard
                label={ELEMENT_LABELS.widgetTitle}
                previewText={PREVIEW_TEXT.widgetTitle}
                element={theme.widgetTitle}
                onUpdate={(u) => updateElement("widgetTitle", u)}
              />
            )}
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
