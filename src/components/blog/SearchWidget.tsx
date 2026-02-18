"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchWidget() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = searchParams.get("q") ?? "";

  return (
    <aside className="rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 rounded-md border border-zinc-200/60 bg-zinc-50/50 focus-within:border-zinc-300 focus-within:bg-white focus-within:ring-1 focus-within:ring-zinc-300">
        <Search className="ml-3 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            const params = new URLSearchParams(searchParams.toString());
            if (value.trim()) params.set("q", value);
            else params.delete("q");
            const query = params.toString();
            const basePath = pathname.startsWith("/blog") ? "/blog" : pathname;
            router.replace(query ? `${basePath}?${query}` : basePath, {
              scroll: false,
            });
          }}
          placeholder="Pretraži članke..."
          className="w-full min-w-0 bg-transparent py-2.5 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          aria-label="Pretraži blog"
        />
      </div>
    </aside>
  );
}
