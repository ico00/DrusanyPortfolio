"use client";

import { Calendar } from "lucide-react";
import { formatBlogDate } from "@/data/blogCategories";
import WidgetAccordion from "./WidgetAccordion";
import type { PlanItem } from "@/lib/plans";

interface PlansWidgetProps {
  title?: string;
  plans: PlanItem[];
}

export default function PlansWidget({
  title = "Planovi",
  plans,
}: PlansWidgetProps) {
  if (plans.length === 0) {
    return null;
  }

  return (
    <WidgetAccordion title={title} icon={<Calendar className="h-4 w-4 shrink-0" />}>
      <ul className="mt-4 space-y-3">
        {plans.map((plan, index) => (
          <li key={`${plan.date}-${plan.name}-${index}`}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-zinc-500">
                {formatBlogDate(plan.date)}
              </span>
              <span className="text-zinc-900">{plan.name}</span>
            </div>
          </li>
        ))}
      </ul>
    </WidgetAccordion>
  );
}
