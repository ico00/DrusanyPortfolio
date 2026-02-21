"use client";

/**
 * Floating popup sa stilovima bloka koji se pojavljuje iznad trenutnog bloka
 * kad je kursor u editoru. Koristi PositionPopover za pozicioniranje.
 */
import { flip, offset, shift } from "@floating-ui/react";
import {
  PositionPopover,
  useBlockNoteEditor,
  useEditorState,
} from "@blocknote/react";
import { useMemo } from "react";
import { BlockTypeSelectWithCursor } from "./BlockTypeSelectWithCursor";

export function FloatingBlockTypeBar() {
  const editor = useBlockNoteEditor();

  // Pozicija kursora – prikaži samo kad je collapsed selection (samo kursor, bez označenog teksta)
  // Kad je selekcija, FormattingToolbar se već prikazuje
  const rawPosition = useEditorState({
    editor,
    selector: ({ editor }) => {
      try {
        const sel = editor.prosemirrorState.selection;
        const { from, to } = sel;
        if (from === to) return { from, to };
        return undefined;
      } catch {
        return undefined;
      }
    },
  });

  // PositionPopover treba editor.domElement?.firstElementChild – bez toga baca "isConnected" TypeError
  const position =
    rawPosition &&
    editor?.domElement?.firstElementChild &&
    editor?.prosemirrorView
      ? rawPosition
      : undefined;

  const floatingUIOptions = useMemo(
    () => ({
      useFloatingOptions: {
        open: position !== undefined,
        placement: "top" as const,
        middleware: [offset(10), shift(), flip()],
      },
      elementProps: {
        style: { zIndex: 99999 },
        className:
          "bn-formatting-toolbar flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 shadow-lg",
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
