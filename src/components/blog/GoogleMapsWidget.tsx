"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";
import WidgetAccordion from "./WidgetAccordion";

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
    <WidgetAccordion title={title} icon={<MapPin className="h-4 w-4 shrink-0" />} defaultOpen={false}>
      {locations.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => setActiveId(loc.id)}
              className={`px-3 py-1.5 text-sm ${
                activeId === loc.id ? BLOG_WIDGET_UI.tabActive : BLOG_WIDGET_UI.tabInactive
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      <div className={`mt-4 ${BLOG_WIDGET_UI.iframeWrapper}`}>
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
    </WidgetAccordion>
  );
}
