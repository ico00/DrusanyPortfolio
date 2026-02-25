"use client";

import {
  useBlockNoteEditor,
  useEditorState,
  useEditorSelectionBoundingBox,
} from "@blocknote/react";
import { useCallback, useEffect, useState } from "react";

const WIDTH_OPTIONS = [
  { value: "full", label: "Full" },
  { value: "split", label: "Split" },
  { value: "50", label: "50%" },
  { value: "25", label: "25%" },
] as const;

/** Floating toolbar za odabir širine slike (Full, 50%, 25%). Prikazuje se kad je odabran image block. */
export default function ImageSizeSelect() {
  const editor = useBlockNoteEditor();
  const [, setScrollTick] = useState(0);

  const block = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor?.isEditable || !editor?.domElement) return undefined;
      try {
        const selected = editor.getSelection()?.blocks ?? [
          editor.getTextCursorPosition().block,
        ];
        if (selected.length !== 1) return undefined;
        const b = selected[0];
        if (b.type !== "image") return undefined;
        return b;
      } catch {
        return undefined;
      }
    },
  });

  const isEditorReady = !!editor?.domElement;
  const selectionRect = useEditorSelectionBoundingBox(
    !!(block && editor && isEditorReady),
    editor ?? undefined
  );

  // Re-render na scroll/resize da toolbar prati sliku
  useEffect(() => {
    if (!block || !editor?.domElement) return;
    const container = editor.domElement.closest(".bn-container") ?? editor.domElement;
    const onUpdate = () => setScrollTick((t) => t + 1);
    container.addEventListener("scroll", onUpdate);
    window.addEventListener("scroll", onUpdate, true);
    window.addEventListener("resize", onUpdate);
    return () => {
      container.removeEventListener("scroll", onUpdate);
      window.removeEventListener("scroll", onUpdate, true);
      window.removeEventListener("resize", onUpdate);
    };
  }, [block, editor]);

  const setWidth = useCallback(
    (value: "full" | "split" | "50" | "25") => {
      if (!block || !editor) return;
      editor.updateBlock(block.id, { props: { displayWidth: value } });
    },
    [block, editor]
  );

  if (!block || !editor || !selectionRect) return null;

  const currentWidth =
    (block.props as { displayWidth?: string }).displayWidth ?? "full";

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 shadow-lg"
      style={{
        left: selectionRect.left + selectionRect.width / 2 - 80,
        top: selectionRect.top + selectionRect.height + 8,
      }}
    >
      <span className="text-xs text-zinc-400">Širina:</span>
      <div className="flex rounded border border-zinc-600 bg-zinc-700">
        {WIDTH_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setWidth(opt.value as "full" | "split" | "50" | "25")}
            className={`px-2 py-1 text-xs transition-colors ${
              currentWidth === opt.value
                ? "bg-amber-600 text-white"
                : "text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100"
            }`}
            title={`Širina slike: ${opt.label}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
