"use client";

/**
 * Floating popup sa stilovima bloka koji se pojavljuje iznad trenutnog bloka
 * kad je kursor u editoru. Koristi PositionPopover za pozicioniranje.
 * Prikazuje se samo kad editor ima fokus – inače bi se pri učitavanju prikazivao
 * u zadnjem (trailing) bloku gdje ProseMirror postavlja kursor po defaultu.
 */
import { flip, offset, shift } from "@floating-ui/react";
import {
  PositionPopover,
  useBlockNoteEditor,
  useEditorState,
} from "@blocknote/react";
import { useMemo, useState, useEffect } from "react";
import { BlockTypeSelectWithCursor } from "./BlockTypeSelectWithCursor";

export function FloatingBlockTypeBar() {
  const editor = useBlockNoteEditor();
  const [hasFocus, setHasFocus] = useState(false);

  useEffect(() => {
    const el = editor?.domElement;
    if (!el) return;
    const onFocusIn = () => setHasFocus(true);
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node)) setHasFocus(false);
    };
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, [editor?.domElement]);

  // Pozicija kursora – prikaži samo kad je collapsed selection (samo kursor, bez označenog teksta)
  // Kad je selekcija, FormattingToolbar se već prikazuje
  // Koristimo block start za pozicioniranje na vrhu bloka umjesto kod kursora
  const rawPosition = useEditorState({
    editor,
    selector: ({ editor }) => {
      try {
        const sel = editor.prosemirrorState.selection;
        const { from, to } = sel;
        if (from !== to) return undefined; // FormattingToolbar se prikazuje za selekciju
        const $from = (sel as { $from?: { start: () => number } }).$from;
        const blockStart = typeof $from?.start === "function" ? $from.start() : undefined;
        if (typeof blockStart === "number") {
          return { from: blockStart, to: blockStart };
        }
        return { from, to };
      } catch {
        return undefined;
      }
    },
  });

  // PositionPopover treba editor.domElement?.firstElementChild – bez toga baca "isConnected" TypeError
  // Prikaži samo kad editor ima fokus – sprječava prikaz u zadnjem bloku pri učitavanju
  const position =
    hasFocus &&
    rawPosition &&
    editor?.domElement?.firstElementChild &&
    editor?.prosemirrorView
      ? rawPosition
      : undefined;

  const floatingUIOptions = useMemo(
    () => ({
      useFloatingOptions: {
        open: position !== undefined,
        placement: "top-start" as const,
        middleware: [offset(10), shift(), flip()],
      },
      elementProps: {
        style: { zIndex: 99999 },
        className:
          "bn-formatting-toolbar flex items-center gap-2 rounded-lg border border-amber-400 bg-zinc-800 px-3 py-2 shadow-lg",
      },
    }),
    [position],
  );

  return (
    <PositionPopover position={position} {...floatingUIOptions}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-300">Block style:</span>
        <BlockTypeSelectWithCursor />
      </div>
    </PositionPopover>
  );
}
