"use client";

import { usePathname } from "next/navigation";

const COPYRIGHT_START = 2026;

function getCopyrightYear(): string {
  const current = new Date().getFullYear();
  return current === COPYRIGHT_START
    ? `${COPYRIGHT_START}`
    : `${COPYRIGHT_START}-${current}`;
}

export default function Footer() {
  const pathname = usePathname();
  const isBlog = pathname?.startsWith("/blog");
  const rightsText = isBlog ? "Sva prava pridržana" : "All rights reserved";

  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950 py-6">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs text-zinc-500">
          © {getCopyrightYear()} Ivica Drusany. {rightsText}
        </p>
      </div>
    </footer>
  );
}
