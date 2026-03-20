"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  MapPin,
  Save,
} from "lucide-react";
import type { BlogWidgetConfig, MapsWidgetConfig } from "@/lib/blogWidgets";
import type { PlanItem } from "@/lib/plans";
import { ADMIN_UI } from "@/data/adminUI";

const W = ADMIN_UI.adminWidgets;

const TYPE_LABELS: Record<BlogWidgetConfig["type"], string> = {
  search: "Search",
  categories: "Categories",
  maps: "Maps",
  "featured-posts": "Featured posts",
  plans: "Plans",
};

function newLocationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function SortableWidgetRow({
  widget,
  mapsOpen,
  onToggleMaps,
  plansOpen,
  onTogglePlans,
  plans,
  updatePlan,
  addPlanRow,
  removePlanRow,
  onSavePlans,
  savingPlans,
  plansJustSaved,
  plansError,
  patchWidget,
}: {
  widget: BlogWidgetConfig;
  mapsOpen: boolean;
  onToggleMaps: () => void;
  plansOpen: boolean;
  onTogglePlans: () => void;
  plans: PlanItem[];
  updatePlan: (index: number, field: "date" | "name", value: string) => void;
  addPlanRow: () => void;
  removePlanRow: (index: number) => void;
  onSavePlans: () => void;
  savingPlans: boolean;
  plansJustSaved: boolean;
  plansError: string | null;
  patchWidget: (id: string, updater: (w: BlogWidgetConfig) => BlogWidgetConfig) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  const maps = widget.type === "maps" ? (widget as MapsWidgetConfig) : null;
  const isPlans = widget.type === "plans";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-zinc-700 bg-zinc-800/40"
    >
      {/* Grid: fiksni stupci do Title – isti lijevi rub inputa u svim redovima; zadnji stupac akcije */}
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[2.25rem_10.5rem_minmax(10.5rem,12.5rem)_minmax(0,1fr)_auto] md:items-end md:gap-x-3 md:gap-y-2">
        <button
          type="button"
          className="touch-none justify-self-start rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 md:justify-self-stretch md:self-end"
          aria-label={W.drag}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="inline-flex min-h-[2.25rem] items-center justify-center self-center rounded-md bg-zinc-700 px-2 py-1 text-center text-xs font-medium leading-tight text-zinc-300 md:w-full md:justify-self-stretch md:self-end">
          {TYPE_LABELS[widget.type]}
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400 md:min-w-0 md:self-end">
          <input
            type="checkbox"
            checked={widget.enabled}
            onChange={(e) =>
              patchWidget(widget.id, (w) => ({ ...w, enabled: e.target.checked }))
            }
            className="shrink-0 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
          />
          <span className="leading-snug">{W.shown}</span>
        </label>
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-zinc-500">{W.titleLabel}</label>
          <input
            type="text"
            value={widget.title}
            onChange={(e) =>
              patchWidget(widget.id, (w) => ({ ...w, title: e.target.value }))
            }
            className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        {maps ? (
          <button
            type="button"
            onClick={onToggleMaps}
            className="flex items-center gap-1 justify-self-start rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 md:justify-self-end"
          >
            <MapPin className="h-4 w-4 shrink-0 text-amber-400/90" />
            {mapsOpen ? W.collapseMaps : W.expandMaps}
            {mapsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : isPlans ? (
          <button
            type="button"
            onClick={onTogglePlans}
            className="flex items-center gap-1 justify-self-start rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 md:justify-self-end"
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-amber-400/90" />
            {plansOpen ? W.collapsePlans : W.expandPlans}
            {plansOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
      {maps && mapsOpen && (
        <div className="space-y-3 border-t border-zinc-700 px-4 pb-4 pt-3">
          <p className="text-xs font-medium text-zinc-500">{W.mapSection}</p>
          {maps.locations.map((loc, idx) => (
            <div
              key={loc.id}
              className="flex flex-col gap-2 rounded-md border border-zinc-700/80 bg-zinc-900/50 p-3 sm:flex-row sm:flex-wrap sm:items-end"
            >
              <div className="min-w-[8rem] flex-1">
                <label className="mb-1 block text-xs text-zinc-500">{W.locationName}</label>
                <input
                  type="text"
                  value={loc.name}
                  onChange={(e) =>
                    patchWidget(widget.id, (w) => {
                      if (w.type !== "maps") return w;
                      const locations = w.locations.map((l, i) =>
                        i === idx ? { ...l, name: e.target.value } : l
                      );
                      return { ...w, locations };
                    })
                  }
                  className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
                />
              </div>
              <div className="min-w-[min(100%,16rem)] flex-[2]">
                <label className="mb-1 block text-xs text-zinc-500">{W.embedUrl}</label>
                <input
                  type="url"
                  value={loc.embedUrl}
                  onChange={(e) =>
                    patchWidget(widget.id, (w) => {
                      if (w.type !== "maps") return w;
                      const locations = w.locations.map((l, i) =>
                        i === idx ? { ...l, embedUrl: e.target.value } : l
                      );
                      return { ...w, locations };
                    })
                  }
                  className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 font-mono text-xs text-zinc-100"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  patchWidget(widget.id, (w) => {
                    if (w.type !== "maps") return w;
                    return {
                      ...w,
                      locations: w.locations.filter((_, i) => i !== idx),
                    };
                  })
                }
                className="rounded border border-red-800/60 px-2 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
              >
                {W.removeLocation}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchWidget(widget.id, (w) => {
                if (w.type !== "maps") return w;
                return {
                  ...w,
                  locations: [
                    ...w.locations,
                    { id: newLocationId(), name: "", embedUrl: "" },
                  ],
                };
              })
            }
            className="text-sm text-amber-400/90 hover:text-amber-300"
          >
            + {W.addLocation}
          </button>
        </div>
      )}
      {isPlans && plansOpen && (
        <div className="space-y-3 border-t border-zinc-700 px-4 pb-4 pt-3">
          {plansError && (
            <div className="rounded border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
              {plansError}
            </div>
          )}
          <p className="text-xs font-medium text-zinc-500">{W.plansSection}</p>
          {plans.length === 0 ? (
            <p className="text-sm text-zinc-500">No events yet. Add one below.</p>
          ) : (
            <ul className="space-y-2">
              {plans.map((plan, idx) => (
                <li
                  key={`${plan.date}-${idx}`}
                  className="flex flex-col gap-2 rounded-md border border-zinc-700/80 bg-zinc-900/50 p-3 sm:flex-row sm:flex-wrap sm:items-end"
                >
                  <div className="w-full min-w-[10rem] sm:w-auto">
                    <label className="mb-1 block text-xs text-zinc-500">{W.planDate}</label>
                    <input
                      type="date"
                      value={plan.date}
                      onChange={(e) => updatePlan(idx, "date", e.target.value)}
                      className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </div>
                  <div className="min-w-[min(100%,12rem)] flex-1">
                    <label className="mb-1 block text-xs text-zinc-500">{W.planName}</label>
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => updatePlan(idx, "name", e.target.value)}
                      className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
                      placeholder="e.g. Concert name"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlanRow(idx)}
                    className="rounded border border-red-800/60 px-2 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
                  >
                    {W.removeLocation}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addPlanRow}
              className="text-sm text-amber-400/90 hover:text-amber-300"
            >
              + {W.addPlan}
            </button>
            <button
              type="button"
              onClick={onSavePlans}
              disabled={savingPlans}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              {savingPlans ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : plansJustSaved ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingPlans ? W.savingPlans : plansJustSaved ? W.plansSaved : W.savePlans}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlogWidgetsAdmin() {
  const [widgets, setWidgets] = useState<BlogWidgetConfig[] | null>(null);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapsOpenById, setMapsOpenById] = useState<Record<string, boolean>>({});
  const [plansOpenById, setPlansOpenById] = useState<Record<string, boolean>>({});
  const [savingPlans, setSavingPlans] = useState(false);
  const [plansJustSaved, setPlansJustSaved] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, pRes] = await Promise.all([
        fetch("/api/blog-widgets", { cache: "no-store" }),
        fetch("/api/plans", { cache: "no-store" }),
      ]);
      if (!wRes.ok) {
        setWidgets(null);
        setError(W.loadError);
        setPlans([]);
        return;
      }
      const wData = (await wRes.json()) as { widgets?: BlogWidgetConfig[] };
      const list = Array.isArray(wData.widgets) ? wData.widgets : [];
      setWidgets(JSON.parse(JSON.stringify(list)) as BlogWidgetConfig[]);

      if (pRes.ok) {
        const pData = (await pRes.json()) as { plans?: PlanItem[] };
        setPlans(
          Array.isArray(pData.plans)
            ? pData.plans.map((p) => ({ date: p.date, name: p.name }))
            : []
        );
      } else {
        setPlans([]);
      }
    } catch {
      setWidgets(null);
      setError(W.loadError);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updatePlan = useCallback((index: number, field: "date" | "name", value: string) => {
    setPlans((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }, []);

  const addPlanRow = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setPlans((prev) => [...prev, { date: today, name: "" }]);
  }, []);

  const removePlanRow = useCallback((index: number) => {
    setPlans((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSavePlans = useCallback(async () => {
    setSavingPlans(true);
    setPlansJustSaved(false);
    setPlansError(null);
    try {
      const res = await fetch("/api/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans }),
      });
      if (res.ok) {
        const data = (await res.json()) as { plans?: PlanItem[] };
        const next = Array.isArray(data.plans) ? data.plans : plans;
        setPlans(next.map((p) => ({ date: p.date, name: p.name })));
        setPlansJustSaved(true);
        setTimeout(() => setPlansJustSaved(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        setPlansError((err as { error?: string }).error ?? W.savePlansError);
      }
    } catch {
      setPlansError(W.savePlansError);
    } finally {
      setSavingPlans(false);
    }
  }, [plans]);

  const patchWidget = useCallback(
    (id: string, updater: (w: BlogWidgetConfig) => BlogWidgetConfig) => {
      setWidgets((ws) => (ws ? ws.map((w) => (w.id === id ? updater(w) : w)) : ws));
    },
    []
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !widgets) return;
    setWidgets((items) => {
      if (!items) return items;
      const oldIndex = items.findIndex((w) => w.id === active.id);
      const newIndex = items.findIndex((w) => w.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleSave = async () => {
    if (!widgets) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/blog-widgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets }),
      });
      if (res.ok) {
        const data = (await res.json()) as { widgets?: BlogWidgetConfig[] };
        const list = Array.isArray(data.widgets) ? data.widgets : widgets;
        setWidgets(JSON.parse(JSON.stringify(list)) as BlogWidgetConfig[]);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        setError((err as { error?: string }).error ?? W.saveError);
      }
    } catch {
      setError(W.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!widgets) {
    return (
      <div className="rounded-lg border border-amber-800/50 bg-amber-900/20 p-4 text-amber-200">
        <p className="font-medium">{W.unavailableTitle}</p>
        <p className="mt-1 text-sm text-amber-200/80">{W.unavailableBody}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-200">{W.title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{W.description}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {widgets.map((w) => (
              <SortableWidgetRow
                key={w.id}
                widget={w}
                mapsOpen={!!mapsOpenById[w.id]}
                onToggleMaps={() =>
                  setMapsOpenById((m) => ({ ...m, [w.id]: !m[w.id] }))
                }
                plansOpen={!!plansOpenById[w.id]}
                onTogglePlans={() =>
                  setPlansOpenById((m) => ({ ...m, [w.id]: !m[w.id] }))
                }
                plans={plans}
                updatePlan={updatePlan}
                addPlanRow={addPlanRow}
                removePlanRow={removePlanRow}
                onSavePlans={handleSavePlans}
                savingPlans={savingPlans}
                plansJustSaved={plansJustSaved}
                plansError={plansError}
                patchWidget={patchWidget}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? W.saving : saved ? W.saved : W.save}
        </button>
      </div>
    </div>
  );
}
