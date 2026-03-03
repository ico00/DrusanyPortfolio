import React, { Suspense } from "react";
import SearchWidget from "./SearchWidget";
import CategoriesWidget from "./CategoriesWidget";
import GoogleMapsWidget from "./GoogleMapsWidget";
import FeaturedPostsWidget from "./FeaturedPostsWidget";
import PlansWidget from "./PlansWidget";
import {
  getBlogWidgets,
  type BlogWidgetConfig,
  type SearchWidgetConfig,
  type CategoriesWidgetConfig,
  type MapsWidgetConfig,
  type FeaturedPostsWidgetConfig,
  type PlansWidgetConfig,
} from "@/lib/blogWidgets";
import { getPlans } from "@/lib/plans";
import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";
import type { BlogPost } from "@/lib/blog";

interface BlogSidebarProps {
  posts: BlogPost[];
  /** Na mobilu prikaži search u sidebaru (blog post); inače je skriven jer je na vrhu (blog lista) */
  searchOnMobile?: boolean;
}

export default async function BlogSidebar({ posts, searchOnMobile = false }: BlogSidebarProps) {
  const { widgets } = await getBlogWidgets();
  const enabled = widgets.filter((w) => w.enabled);

  if (enabled.length === 0) {
    return null;
  }

  const sections: React.ReactNode[] = [];
  for (const widget of enabled) {
    const content = await WidgetRenderer({ widget, posts });
    if (content !== null) {
      const isSearch = widget.type === "search";
      const searchMobileClass = isSearch && !searchOnMobile ? "hidden lg:block" : "";
      sections.push(
        <section
          key={widget.id}
          className={`border-t border-zinc-200 first:border-t-0 ${isSearch ? `${searchMobileClass} px-0 py-5` : "p-5"}`}
        >
          {content}
        </section>
      );
    }
  }

  if (sections.length === 0) {
    return null;
  }

  return <div className={BLOG_WIDGET_UI.panel}>{sections}</div>;
}

async function WidgetRenderer({
  widget,
  posts,
}: {
  widget: BlogWidgetConfig;
  posts: BlogPost[];
}): Promise<React.ReactNode> {
  switch (widget.type) {
    case "search":
      return (
        <Suspense fallback={<div className="h-12 animate-pulse rounded border-b border-zinc-200" />}>
          <SearchWidget variant="minimal" />
        </Suspense>
      );
    case "categories":
      return (
        <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-zinc-100" />}>
          <CategoriesWidget
            title={(widget as CategoriesWidgetConfig).title}
            posts={posts}
          />
        </Suspense>
      );
    case "maps": {
      const maps = widget as MapsWidgetConfig;
      return (
        <GoogleMapsWidget
          title={maps.title}
          locations={maps.locations}
        />
      );
    }
    case "featured-posts": {
      const fp = widget as FeaturedPostsWidgetConfig;
      return (
        <FeaturedPostsWidget
          title={fp.title}
          posts={posts}
        />
      );
    }
    case "plans": {
      const pw = widget as PlansWidgetConfig;
      const plans = await getPlans();
      return (
        <PlansWidget
          title={pw.title}
          plans={plans}
        />
      );
    }
    default:
      return null;
  }
}
