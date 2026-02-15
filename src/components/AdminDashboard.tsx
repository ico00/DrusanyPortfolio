"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ImageIcon, FileText, BookOpen, Loader2, Layout } from "lucide-react";
import { CATEGORIES } from "./CategorySelect";

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

const CHART_COLORS = [
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f43f5e", // rose-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
];

const CARD_ACCENTS = [
  { bg: "bg-amber-500/20", icon: "text-amber-400", border: "border-amber-500/30" },
  { bg: "bg-emerald-500/20", icon: "text-emerald-400", border: "border-emerald-500/30" },
  { bg: "bg-blue-500/20", icon: "text-blue-400", border: "border-blue-500/30" },
  { bg: "bg-violet-500/20", icon: "text-violet-400", border: "border-violet-500/30" },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalImages: 0,
    imagesByCategory: [] as { name: string; count: number; slug: string }[],
    pagesCount: 2,
    blogPostsCount: 0,
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [galleryRes, pagesRes, blogRes] = await Promise.all([
        fetch("/api/gallery"),
        fetch("/api/pages"),
        fetch("/api/blog"),
      ]);

      const galleryData = galleryRes.ok ? await galleryRes.json() : { images: [] };
      const blogData = blogRes.ok ? await blogRes.json() : { posts: [] };

      const images = galleryData.images ?? [];
      const posts = blogData.posts ?? [];

      const byCategory: Record<string, number> = {};
      const knownSlugs = new Set(CATEGORIES.map((c) => c.slug));
      for (const img of images) {
        const cat = normalizeCategory(img.category || "other");
        byCategory[cat] = (byCategory[cat] ?? 0) + 1;
      }

      let otherCount = 0;
      for (const [cat, count] of Object.entries(byCategory)) {
        if (!knownSlugs.has(cat as (typeof CATEGORIES)[number]["slug"])) otherCount += count;
      }

      const imagesByCategory = [
        ...CATEGORIES.map((c) => ({
          name: c.label,
          slug: c.slug,
          count: byCategory[c.slug] ?? 0,
        })),
        ...(otherCount > 0 ? [{ name: "Other", slug: "other", count: otherCount }] : []),
      ];

      setStats({
        totalImages: images.length,
        imagesByCategory,
        pagesCount: 2,
        blogPostsCount: posts.length,
      });
    } catch {
      setStats({
        totalImages: 0,
        imagesByCategory: [],
        pagesCount: 2,
        blogPostsCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const pieData = stats.imagesByCategory
    .filter((d) => d.count > 0)
    .map((d, i) => ({
      name: d.name,
      value: d.count,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-xl border bg-zinc-900/50 p-6 ${CARD_ACCENTS[0].border}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-3 ${CARD_ACCENTS[0].bg}`}>
              <ImageIcon className={`h-6 w-6 ${CARD_ACCENTS[0].icon}`} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total images</p>
              <p className="text-2xl font-semibold text-zinc-100">{stats.totalImages}</p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl border bg-zinc-900/50 p-6 ${CARD_ACCENTS[1].border}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-3 ${CARD_ACCENTS[1].bg}`}>
              <Layout className={`h-6 w-6 ${CARD_ACCENTS[1].icon}`} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Categories</p>
              <p className="text-2xl font-semibold text-zinc-100">
                {stats.imagesByCategory.filter((c) => c.count > 0).length}
              </p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl border bg-zinc-900/50 p-6 ${CARD_ACCENTS[2].border}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-3 ${CARD_ACCENTS[2].bg}`}>
              <FileText className={`h-6 w-6 ${CARD_ACCENTS[2].icon}`} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Static pages</p>
              <p className="text-2xl font-semibold text-zinc-100">{stats.pagesCount}</p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl border bg-zinc-900/50 p-6 ${CARD_ACCENTS[3].border}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-3 ${CARD_ACCENTS[3].bg}`}>
              <BookOpen className={`h-6 w-6 ${CARD_ACCENTS[3].icon}`} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Blog posts</p>
              <p className="text-2xl font-semibold text-zinc-100">{stats.blogPostsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-6 text-lg font-semibold text-zinc-200">
            Images by category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.imagesByCategory}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#52525b" }}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#52525b" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#27272a",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#e4e4e7" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.imagesByCategory.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-6 text-lg font-semibold text-zinc-200">
            Category distribution
          </h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#27272a",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) => (
                      <span className="text-zinc-400">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">
                No images yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
