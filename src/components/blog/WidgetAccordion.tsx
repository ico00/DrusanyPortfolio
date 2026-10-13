"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";

interface WidgetAccordionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Zajednički collapse/expand mehanizam za sidebar widgete (isti obrazac kao CategoriesWidget). */
export default function WidgetAccordion({ title, icon, defaultOpen = true, children }: WidgetAccordionProps) {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={`widget-title-bar flex w-full items-center justify-between gap-2 text-left transition-colors bg-zinc-900 hover:bg-zinc-800 -mx-2 -mt-2 p-2 px-3 ${BLOG_WIDGET_UI.title}`}
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`w-full -ml-2 grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <div className="bg-zinc-50 p-3">{children}</div>
        </div>
      </div>
    </>
  );
}
