"use client";

import { useState } from "react";

interface MapLocation {
  id: string;
  name: string;
  embedUrl: string;
}

interface GoogleMapsWidgetProps {
  title?: string;
  locations: MapLocation[];
}

export default function GoogleMapsWidget({
  title = "Lokacije",
  locations,
}: GoogleMapsWidgetProps) {
  const [activeId, setActiveId] = useState<string | null>(
    locations.length > 0 ? locations[0].id : null
  );

  if (locations.length === 0) {
    return null;
  }

  const activeLocation = locations.find((l) => l.id === activeId) ?? locations[0];

  return (
    <aside className="rounded-lg border border-zinc-200/60 bg-white p-5">
      <h3 className="font-serif text-lg font-normal tracking-tight text-zinc-900">{title}</h3>

      {locations.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => setActiveId(loc.id)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                activeId === loc.id
                  ? "bg-zinc-900 font-medium text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200/60">
        <div className="aspect-[4/3] w-full">
          <iframe
            src={activeLocation.embedUrl}
            title={activeLocation.name}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full"
          />
        </div>
      </div>
    </aside>
  );
}
