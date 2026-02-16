"use client";

import { useState, useEffect } from "react";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "press", label: "Press" },
  { id: "gear", label: "Gear" },
] as const;

export default function AboutNav() {
  const [activeId, setActiveId] = useState<string>("about");

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    main.scrollTo(0, 0);
    window.scrollTo(0, 0);

    const updateActive = () => {
      const triggerY = window.innerHeight * 0.25;
      let active: (typeof SECTIONS)[number]["id"] = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerY && triggerY <= rect.bottom) {
          active = id;
          break;
        }
        if (rect.top <= triggerY) active = id;
      }
      setActiveId(active);
    };

    updateActive();
    main.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("scroll", updateActive, { passive: true });
    return () => {
      main.removeEventListener("scroll", updateActive);
      window.removeEventListener("scroll", updateActive);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur-sm lg:left-auto lg:right-0 lg:w-[60%]"
      aria-label="Sekcije stranice"
      style={{ WebkitTransform: "translate3d(0,0,0)" }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-8">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={`text-xs font-extralight tracking-[0.2em] transition-colors hover:text-white ${
              activeId === id
                ? "border-b border-white text-white"
                : "border-b border-transparent text-white/60"
            }`}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
