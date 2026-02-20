"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Camera, Focus, Zap } from "lucide-react";
import type { GearItem } from "@/lib/gear";

const CATEGORY_ORDER = ["cameras", "lenses", "accessories"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  cameras: "Cameras",
  lenses: "Lenses",
  accessories: "Accessories",
};
const CATEGORY_ICONS: Record<string, typeof Camera> = {
  cameras: Camera,
  lenses: Focus,
  accessories: Zap,
};

function groupByCategory(items: GearItem[]): Map<string, GearItem[]> {
  const map = new Map<string, GearItem[]>();
  for (const item of items) {
    const cat = item.category ?? "other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return map;
}

interface GearSectionProps {
  items: GearItem[];
}

export default function GearSection({ items }: GearSectionProps) {
  const grouped = useMemo(() => groupByCategory(items), [items]);

  if (items.length === 0) return null;

  const categoriesToShow = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)),
    ...(grouped.has("other") ? ["other" as const] : []),
  ];

  return (
    <section className="mt-16 border-t border-zinc-800 pt-16">
      <h2 className="mb-2 font-serif text-2xl font-light tracking-tight text-white">
        Gear
      </h2>
      <p className="mb-12 text-zinc-400">
        I&apos;ll shoot you with:
      </p>

      <div className="space-y-14">
        {categoriesToShow.map((catKey) => {
          const catItems = grouped.get(catKey) ?? [];
          if (catItems.length === 0) return null;

          const label = CATEGORY_LABELS[catKey] ?? "Gear";
          const Icon = CATEGORY_ICONS[catKey];

          const isCameras = catKey === "cameras";
          const cols = isCameras ? 2 : 3;

          return (
            <motion.div
              key={catKey}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                {Icon && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-500">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                )}
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {label}
                </h3>
              </div>

              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                }}
              >
                {catItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.35,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="group"
                  >
                    <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/50 transition-all duration-300 group-hover:border-zinc-700 group-hover:bg-zinc-900">
                      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading="lazy"
                          decoding="async"
                          width={item.width}
                          height={item.height}
                          className="h-full w-full object-contain p-4 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.02]"
                          style={
                            item.width && item.height
                              ? { aspectRatio: `${item.width} / ${item.height}` }
                              : undefined
                          }
                        />
                      </div>
                      <div className="border-t border-zinc-800/80 px-4 py-3 transition-colors group-hover:border-zinc-700">
                        <p className="text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
