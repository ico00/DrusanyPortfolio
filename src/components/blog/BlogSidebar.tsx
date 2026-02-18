import { Suspense } from "react";
import SearchWidget from "./SearchWidget";
import CategoriesWidget from "./CategoriesWidget";
import InstagramWidget from "./InstagramWidget";
import GoogleMapsWidget from "./GoogleMapsWidget";
import {
  getBlogWidgets,
  type BlogWidgetConfig,
  type SearchWidgetConfig,
  type CategoriesWidgetConfig,
  type InstagramWidgetConfig,
  type MapsWidgetConfig,
} from "@/lib/blogWidgets";
import { fetchInstagramFeed } from "@/lib/instagram";
import { getBlog } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";

interface BlogSidebarProps {
  posts: BlogPost[];
}

export default async function BlogSidebar({ posts }: BlogSidebarProps) {
  const { widgets } = await getBlogWidgets();
  const enabled = widgets.filter((w) => w.enabled);

  if (enabled.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {await Promise.all(
        enabled.map(async (widget) => (
          <WidgetRenderer key={widget.id} widget={widget} posts={posts} />
        ))
      )}
    </div>
  );
}

async function WidgetRenderer({
  widget,
  posts,
}: {
  widget: BlogWidgetConfig;
  posts: BlogPost[];
}) {
  switch (widget.type) {
    case "search":
      return (
        <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-zinc-100" />}>
          <SearchWidget title={(widget as SearchWidgetConfig).title} />
        </Suspense>
      );
    case "categories":
      return (
        <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-zinc-100" />}>
          <CategoriesWidget
            title={(widget as CategoriesWidgetConfig).title}
            posts={posts}
          />
        </Suspense>
      );
    case "instagram": {
      const ig = widget as InstagramWidgetConfig;
      const images =
        ig.images.length > 0 ? ig.images : await fetchInstagramFeed();
      return (
        <InstagramWidget
          title={ig.title}
          username={ig.username}
          profileUrl={ig.profileUrl}
          images={images}
        />
      );
    }
    case "maps": {
      const maps = widget as MapsWidgetConfig;
      return (
        <GoogleMapsWidget
          title={maps.title}
          locations={maps.locations}
        />
      );
    }
    default:
      return null;
  }
}
