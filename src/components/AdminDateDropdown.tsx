"use client";

import { useState, useRef, useEffect } from "react";

type DropdownOption = { value: number; label: string; disabled: boolean };

export function AdminDateDropdown({
  options = [],
  value,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
  "data-disabled": dataDisabled,
  components,
  classNames,
  ...rest
}: {
  options?: DropdownOption[];
  value?: number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "data-disabled"?: string;
  components: { Chevron: React.ComponentType<{ orientation?: string; size?: number; className?: string }> };
  classNames: Record<string, string>;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange">) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options?.find((o) => o.value === value);
  const Chevron = components.Chevron;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (opt: DropdownOption) => {
    if (opt.disabled) return;
    const syntheticEvent = {
      target: { value: String(opt.value) },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange?.(syntheticEvent);
    setOpen(false);
  };

  if (disabled || dataDisabled === "true") {
    return (
      <span
        data-disabled={dataDisabled}
        className={`inline-flex items-center gap-1 rounded-md bg-zinc-800/50 px-2 py-1 text-sm text-zinc-500 ${className ?? ""}`}
      >
        {selectedOption?.label ?? ""}
        <Chevron orientation="down" size={14} className="fill-zinc-500" />
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-md bg-zinc-700 px-2 py-1 text-sm text-zinc-100 transition-colors hover:bg-zinc-600 ${className ?? ""}`}
      >
        {selectedOption?.label ?? ""}
        <Chevron orientation="down" size={14} className="fill-zinc-300" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl"
        >
          {options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              disabled={opt.disabled}
              onClick={() => handleSelect(opt)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                opt.value === value
                  ? "bg-amber-500/20 text-amber-400"
                  : opt.disabled
                    ? "cursor-not-allowed text-zinc-600"
                    : "text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
