"use client";

import { formatBlogDate } from "@/data/blogCategories";
import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";
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
    <>
      <h3 className={BLOG_WIDGET_UI.title}>{title}</h3>
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
    </>
  );
}
