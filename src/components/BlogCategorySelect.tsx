"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Camera,
  Newspaper,
  MapPin,
  Trophy,
  Laptop,
  User,
  Lightbulb,
  Tag,
} from "lucide-react";
import { getBlogCategoryOptions } from "@/data/blogCategories";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  fotografija: Camera,
  vesti: Newspaper,
  putovanja: MapPin,
  sport: Trophy,
  nogomet: Trophy,
  rukomet: Trophy,
  kosarka: Trophy,
  tehnologija: Laptop,
  osobno: User,
  savjeti: Lightbulb,
};

function getIcon(slug: string) {
  return ICON_MAP[slug] ?? Tag;
}

interface BlogCategorySelectProps {
  /** Single: one slug. Multiple: array of slugs */
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  /** Enable multiple category selection */
  multiple?: boolean;
}

export default function BlogCategorySelect({
  value,
  onChange,
  placeholder = "Odaberi kategoriju",
  id,
  className = "",
  multiple = false,
}: BlogCategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = getBlogCategoryOptions();
  const values = multiple
    ? (Array.isArray(value) ? value : value ? [value] : []).map((v) =>
        v?.toLowerCase().trim()
      ).filter(Boolean) as string[]
    : [];
  const valueNorm = !multiple && (typeof value === "string" ? value : value?.[0])
    ? String(value).toLowerCase().trim()
    : "";
  const selected = options.find((c) => c.slug === valueNorm);
  const selectedMultiple = options.filter((c) => values.includes(c.slug));
  const customValues = values.filter((v) => !options.some((o) => o.slug === v));
  const isCustom = !multiple && valueNorm && !selected;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-h-[42px] items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-left text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={placeholder}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {multiple ? (
            selectedMultiple.length > 0 || customValues.length > 0 ? (
              <>
                {selectedMultiple.map((s) => {
                  const Icon = getIcon(s.slug);
                  return (
                    <span
                      key={s.slug}
                      className="inline-flex items-center gap-1.5 rounded bg-zinc-700/80 px-2 py-0.5 text-xs"
                    >
                      <Icon className="h-3 w-3 text-zinc-500" />
                      {s.fullLabel}
                    </span>
                  );
                })}
                {customValues.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1.5 rounded bg-zinc-700/80 px-2 py-0.5 text-xs"
                  >
                    <Tag className="h-3 w-3 text-zinc-500" />
                    {v}
                  </span>
                ))}
              </>
            ) : (
              <span className="text-zinc-500">{placeholder}</span>
            )
          ) : selected ? (
            <>
              {(() => {
                const Icon = getIcon(selected.slug);
                return <Icon className="h-4 w-4 text-zinc-500" />;
              })()}
              <span>{selected.fullLabel}</span>
            </>
          ) : isCustom ? (
            <>
              <Tag className="h-4 w-4 text-zinc-500" />
              <span>{valueNorm}</span>
            </>
          ) : (
            <span className="text-zinc-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
            className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-64 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 py-1.5 shadow-xl shadow-black/30 ring-1 ring-zinc-800"
          >
            {options.map((opt) => {
              const Icon = getIcon(opt.slug);
              const isSelected = multiple
                ? values.includes(opt.slug)
                : valueNorm === opt.slug;
              return (
                <button
                  key={opt.slug}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (multiple) {
                      const next = isSelected
                        ? values.filter((v) => v !== opt.slug)
                        : [...values, opt.slug];
                      onChange(next);
                    } else {
                      onChange(opt.slug);
                      setOpen(false);
                    }
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    opt.isSub ? "pl-8" : ""
                  } ${
                    isSelected
                      ? "bg-zinc-700/80 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span>{opt.fullLabel}</span>
                  {isSelected && (
                    <span className="ml-auto text-xs text-zinc-500">✓</span>
                  )}
                </button>
              );
            })}
            {isCustom && !multiple && (
              <button
                type="button"
                role="option"
                aria-selected={true}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-2.5 text-left text-sm text-zinc-400"
              >
                <Tag className="h-4 w-4 shrink-0" />
                <span className="truncate">{valueNorm}</span>
                <span className="ml-auto text-xs text-zinc-500">✓</span>
              </button>
            )}
            <div className="my-1 border-t border-zinc-800" />
            <button
              type="button"
              role="option"
              onClick={() => {
                const custom = prompt(
                  "Unesi naziv kategorije (npr. recenzije, izložbe):",
                  !multiple && isCustom ? valueNorm : ""
                );
                if (custom?.trim()) {
                  const slug = custom
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[čć]/g, "c")
                    .replace(/[š]/g, "s")
                    .replace(/[ž]/g, "z")
                    .replace(/[đ]/g, "dj");
                  if (multiple) {
                    const next = values.includes(slug) ? values : [...values, slug];
                    onChange(next);
                  } else {
                    onChange(slug);
                    setOpen(false);
                  }
                }
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              <Tag className="h-4 w-4 shrink-0" />
              <span>
                {!multiple && isCustom
                  ? "Promijeni prilagođenu kategoriju"
                  : "Ostalo (prilagođeno)"}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
