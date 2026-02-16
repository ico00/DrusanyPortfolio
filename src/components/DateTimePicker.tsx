"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar } from "lucide-react";
import { AdminDateDropdown } from "./AdminDateDropdown";
import "react-day-picker/style.css";

function parseDateTime(value: string): { date: Date; hour: number; minute: number } {
  if (!value || value.length < 16) {
    const now = new Date();
    return { date: now, hour: now.getHours(), minute: now.getMinutes() };
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return { date: now, hour: now.getHours(), minute: now.getMinutes() };
  }
  return { date: d, hour: d.getHours(), minute: d.getMinutes() };
}

function toDateTimeLocal(date: Date, hour: number, minute: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

function formatDisplay(value: string): string {
  if (!value || value.length < 16) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DateTimePicker({
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
  const { date, hour, minute } = parseDateTime(value);
  const [tempDate, setTempDate] = useState<Date | undefined>(date);
  const [tempHour, setTempHour] = useState(hour);
  const [tempMinute, setTempMinute] = useState(minute);

  useEffect(() => {
    const { date: d, hour: h, minute: m } = parseDateTime(value);
    setTempDate(d);
    setTempHour(h);
    setTempMinute(m);
  }, [value]);

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
    setTempDate(d ?? new Date());
  };

  const handleApply = () => {
    const d = tempDate ?? new Date();
    onChange(toDateTimeLocal(d, tempHour, tempMinute));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-left text-zinc-100 transition-colors hover:border-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      >
        <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
        <span className={value ? "" : "text-zinc-500"}>
          {value ? formatDisplay(value) : "Select date and time"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
          <div className="rdp-admin-dark">
            <DayPicker
              mode="single"
              selected={tempDate}
              onSelect={handleSelect}
              defaultMonth={tempDate}
              captionLayout="dropdown"
              reverseYears
              startMonth={new Date(new Date().getFullYear() - 50, 0)}
              endMonth={new Date(new Date().getFullYear() + 5, 11)}
              components={{ Dropdown: AdminDateDropdown }}
              classNames={{
                root: "rdp-root",
                months: "flex flex-col gap-4",
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
          <div className="mt-4 flex items-center gap-4 border-t border-zinc-700 pt-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={23}
                value={tempHour}
                onChange={(e) => setTempHour(Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-14 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-zinc-100"
              />
              <span className="text-zinc-500">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={tempMinute}
                onChange={(e) => setTempMinute(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-14 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-zinc-100"
              />
            </div>
            <button
              type="button"
              onClick={handleApply}
              className="ml-auto rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
