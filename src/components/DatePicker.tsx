"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar } from "lucide-react";
import { AdminDateDropdown } from "./AdminDateDropdown";
import { ADMIN_UI } from "@/data/adminUI";
import "react-day-picker/style.css";

function formatDisplay(value: string): string {
  if (!value || value.length < 10) return "";
  const d = new Date(value + "T12:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DatePicker({
  value,
  onChange,
  id,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? new Date(value + "T12:00:00") : undefined;
  const isValid = selectedDate && !isNaN(selectedDate.getTime());

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

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${day}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={ADMIN_UI.datePicker.triggerClass}
      >
        <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
        <span className={value ? "" : "text-zinc-500"}>
          {value ? formatDisplay(value) : ADMIN_UI.datePicker.placeholder}
        </span>
      </button>

      {open && (
        <div className={ADMIN_UI.datePicker.dropdownClass}>
          <div className={ADMIN_UI.datePicker.wrapperClass}>
            <DayPicker
              mode="single"
              selected={isValid ? selectedDate : undefined}
              onSelect={handleSelect}
              defaultMonth={isValid ? selectedDate : new Date()}
              captionLayout="dropdown"
              reverseYears
              startMonth={new Date(new Date().getFullYear() - 50, 0)}
              endMonth={new Date(new Date().getFullYear() + 5, 11)}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-day-picker Dropdown type mismatch
              components={{ Dropdown: AdminDateDropdown as any }}
              classNames={{
                root: "rdp-root",
                months: "flex flex-col",
                month: "flex flex-col gap-2",
                month_caption: "flex items-center justify-between px-1 mb-2",
                caption_label: "text-sm font-medium text-zinc-200",
                nav: "flex items-center gap-1",
                button_previous: "flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                button_next: "flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                weekdays: "flex",
                weekday: "w-10 text-center text-xs font-medium text-zinc-500",
                week: "flex",
                day: "h-10 w-10 p-0 text-center text-sm",
                day_button: "h-10 w-10 rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50",
                selected: "!bg-amber-500 !text-zinc-900 hover:!bg-amber-500 hover:!text-zinc-900",
                today: "font-semibold text-amber-400",
                outside: "text-zinc-600",
                disabled: "text-zinc-600 opacity-50",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
