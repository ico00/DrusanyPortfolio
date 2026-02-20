"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Palette, Save, ChevronDown, Type } from "lucide-react";
import { FONT_OPTIONS, FONT_PREVIEW_MAP } from "@/data/themeFonts";
import type { ThemeConfig, ThemeElement, ThemeFontFamily } from "@/lib/theme";

const ELEMENT_LABELS: Record<keyof ThemeConfig, string> = {
  title: "Hero naslov",
  heading: "Naslovi (h1–h6)",
  headingOnDark: "Naslov na tamnoj pozadini (About, Contact)",
  body: "Body tekst",
  quote: "Citat (blockquote)",
  nav: "Navigacija",
  caption: "Caption / metadata",
};

const PREVIEW_TEXT: Record<keyof ThemeConfig, string> = {
  title: "Hero naslov",
  heading: "Naslov stranice",
  headingOnDark: "Naslov stranice",
  body: "Ovo je primjer body teksta koji se prikazuje na stranici.",
  quote: "Ovo je primjer citata u blockquote stilu.",
  nav: "Home Portfolio About",
  caption: "Datum objave: 18. veljače 2025.",
};

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

export default function ThemeAdmin() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const updateElement = (key: keyof ThemeConfig, updates: Partial<ThemeElement>) => {
    if (!theme) return;
    setTheme({
      ...theme,
      [key]: { ...theme[key], ...updates },
    });
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
          Theme editing only works in development mode (<code>npm run dev</code>).
          For production, edit <code>src/data/theme.json</code> manually and run{" "}
          <code>npm run build</code>.
        </p>
      </div>
    );
  }

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
        <code className="rounded bg-zinc-800 px-1.5 py-0.5">npm run build</code>.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(theme) as (keyof ThemeConfig)[]).map((key) => (
          <div
            key={key}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4"
          >
            <h3 className="mb-4 text-sm font-medium text-zinc-200">
              {ELEMENT_LABELS[key]}
            </h3>
            <div
              className="mb-4 rounded-lg border border-zinc-700 p-3"
              style={{
                fontFamily:
                  FONT_PREVIEW_MAP[theme[key].fontFamily] ??
                  "var(--font-geist-sans), sans-serif",
                fontSize: theme[key].fontSize,
                color: theme[key].color,
                backgroundColor: isLightColor(theme[key].color)
                  ? "#27272a"
                  : "#f4f4f5",
              }}
            >
              {PREVIEW_TEXT[key]}
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  Font
                </label>
                <ThemeFontSelect
                  value={theme[key].fontFamily}
                  onChange={(v) => updateElement(key, { fontFamily: v })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  Veličina
                </label>
                <input
                  type="text"
                  value={theme[key].fontSize}
                  onChange={(e) =>
                    updateElement(key, { fontSize: e.target.value })}
                  placeholder="npr. 1rem, clamp(2rem, 5vw, 4rem)"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  Boja
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={
                      theme[key].color.startsWith("#")
                        ? theme[key].color
                        : "#71717a"
                    }
                    onChange={(e) =>
                      updateElement(key, { color: e.target.value })}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800/50 p-1"
                  />
                  <input
                    type="text"
                    value={theme[key].color}
                    onChange={(e) =>
                      updateElement(key, { color: e.target.value })}
                    placeholder="#71717a ili rgba(...)"
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
