"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";

const SEARCH_DEBOUNCE_MS = 300;

export default function SearchWidget() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const urlQuery = searchParams.get("q") ?? "";
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const applySearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value);
    else params.delete("q");
    const query = params.toString();
    const basePath = pathname.startsWith("/blog") ? "/blog" : pathname;
    router.replace(query ? `${basePath}?${query}` : basePath, {
      scroll: false,
    });
  };

  const handleChange = (value: string) => {
    setLocalQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      applySearch(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <div className={BLOG_WIDGET_UI.inputWrapper}>
      <Search className="ml-3 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} />
      <input
        type="search"
        value={localQuery}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Pretraži članke..."
        className="w-full min-w-0 bg-transparent py-2.5 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        aria-label="Pretraži blog"
      />
    </div>
  );
}
