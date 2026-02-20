"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  label?: string;
  placeholder?: string;
  id?: string;
  className?: string;
}

export default function FilterSelect({
  value,
  onChange,
  options,
  label,
  placeholder = "Select",
  id,
  className = "",
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

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
      {label && (
        <label className="mb-1.5 block text-xs text-zinc-500">{label}</label>
      )}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[38px] w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-left text-sm text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label ?? placeholder}
      >
        <span className="min-w-0 flex-1 truncate">
          {displayLabel}
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
            className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-64 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 py-1.5 shadow-xl shadow-black/30 ring-1 ring-zinc-800"
          >
            {options.map((opt) => {
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
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-zinc-700/80 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="shrink-0 text-xs text-zinc-500">✓</span>
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
