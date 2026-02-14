"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Music,
  Trophy,
  Cat,
  Home,
  MapPin,
  Coffee,
  Tag,
} from "lucide-react";

export const CATEGORIES = [
  { slug: "concerts", label: "Concerts", icon: Music },
  { slug: "sport", label: "Sport", icon: Trophy },
  { slug: "animals", label: "Animals", icon: Cat },
  { slug: "interiors", label: "Interiors", icon: Home },
  { slug: "zagreb", label: "Zagreb", icon: MapPin },
  { slug: "food-drink", label: "Food & Drink", icon: Coffee },
] as const;

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export default function CategorySelect({
  value,
  onChange,
  placeholder = "Select category",
  id,
  className = "",
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const valueNorm = value?.toLowerCase().trim() ?? "";
  const selected = CATEGORIES.find((c) => c.slug === valueNorm);
  const isCustom = valueNorm && !selected;

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
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-left text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={placeholder}
      >
        <span className="flex items-center gap-3">
          {selected ? (
            <>
              <selected.icon className="h-4 w-4 text-zinc-500" />
              <span>{selected.label}</span>
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
            className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-64 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 py-1.5 shadow-xl shadow-black/30 ring-1 ring-zinc-800"
          >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = valueNorm === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(cat.slug);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-zinc-700/80 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                <span>{cat.label}</span>
                {isSelected && (
                  <span className="ml-auto text-xs text-zinc-500">✓</span>
                )}
              </button>
            );
          })}
          {isCustom && (
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
                "Enter category name (e.g. portrait, street):",
                isCustom ? valueNorm : ""
              );
              if (custom?.trim()) {
                onChange(custom.trim().toLowerCase().replace(/\s+/g, "-"));
                setOpen(false);
              }
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Tag className="h-4 w-4 shrink-0" />
            <span>{isCustom ? "Change custom category" : "Other (custom)"}</span>
          </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
