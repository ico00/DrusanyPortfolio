"use client";

import { BlockTypeSelect } from "@blocknote/react";

/**
 * Statična traka koja prikazuje trenutni stil bloka na temelju pozicije kursora.
 * Korisnik ne mora označavati tekst – dovoljno je pozicionirati kursor u red.
 */
export function StaticBlockTypeBar() {
  return (
    <div
      className="bn-static-block-type-bar flex shrink-0 items-center gap-2 border-b border-zinc-700 bg-zinc-800/95 px-3 py-2"
      style={{ order: -1 }}
    >
      <span className="text-xs text-zinc-400">Stil bloka:</span>
      <BlockTypeSelect />
    </div>
  );
}
