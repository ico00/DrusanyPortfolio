"use client";

/**
 * FormattingToolbarController koji pozicionira toolbar na vrh bloka umjesto
 * kod kursora/selekcije. Koristi block start poziciju za konzistentan UX.
 *
 * BlockNoteov FormattingToolbarExtension prikazuje toolbar samo uz ne-praznu
 * selekciju; ovdje dodajemo i prikaz kad je samo kursor u tekstualnom bloku
 * (isti UX kao bivši FloatingBlockTypeBar, ali s formatting akcijama).
 */
import type { BlockNoteEditor } from "@blocknote/core";
import {
  blockHasType,
  defaultProps,
  DefaultProps,
} from "@blocknote/core";
import { FormattingToolbarExtension } from "@blocknote/core/extensions";
import { flip, offset, shift } from "@floating-ui/react";
import { TextSelection } from "prosemirror-state";
import { FC, useEffect, useMemo, useState } from "react";
import {
  FormattingToolbar,
  PositionPopover,
  useBlockNoteEditor,
  useEditorState,
  useExtension,
  useExtensionState,
} from "@blocknote/react";
import type { FloatingUIOptions } from "@blocknote/react";
import type { FormattingToolbarProps } from "@blocknote/react";

/** Blokovi bez inline formatiranja – toolbar nema smisla na samom kursoru. */
const COLLAPSED_TOOLBAR_DENY_BLOCK_TYPES = new Set([
  "codeBlock",
  "image",
  "youtubeEmbed",
  "beforeAfter",
  "file",
  "video",
  "audio",
]);

function collapsedSelectionAllowsFormattingToolbar(
  editor: BlockNoteEditor
): boolean {
  try {
    const sel = editor.prosemirrorState.selection;
    if (!(sel instanceof TextSelection) || !sel.empty) {
      return false;
    }
    const $from = sel.$from;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.spec.code) {
        return false;
      }
    }
    const { block } = editor.getTextCursorPosition();
    if (COLLAPSED_TOOLBAR_DENY_BLOCK_TYPES.has(block.type)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

const textAlignmentToPlacement = (
  textAlignment: DefaultProps["textAlignment"]
) => {
  switch (textAlignment) {
    case "left":
      return "top-start";
    case "center":
      return "top";
    case "right":
      return "top-end";
    default:
      return "top-start";
  }
};

export function BlockTopFormattingToolbarController(props: {
  formattingToolbar?: FC<FormattingToolbarProps>;
  floatingUIOptions?: FloatingUIOptions;
}) {
  const editor = useBlockNoteEditor();
  const formattingToolbar = useExtension(FormattingToolbarExtension, {
    editor,
  });
  const showFromExtension = useExtensionState(FormattingToolbarExtension, {
    editor,
  });

  const [hasFocus, setHasFocus] = useState(false);
  const [mouseDown, setMouseDown] = useState(false);

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

  // Kao BlockNote FormattingToolbar: ne prikazuj collapsed toolbar dok je tipka miša dolje (označavanje)
  useEffect(() => {
    const el = editor?.domElement;
    if (!el) return;
    const onDown = (e: PointerEvent) => {
      if (e.isPrimary) setMouseDown(true);
    };
    const onUp = (e: PointerEvent) => {
      if (e.isPrimary) setMouseDown(false);
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp, { capture: true });
    window.addEventListener("pointercancel", onUp, { capture: true });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp, { capture: true });
      window.removeEventListener("pointercancel", onUp, { capture: true });
    };
  }, [editor?.domElement]);

  const collapsedAllowed = useEditorState({
    editor,
    selector: ({ editor }) => collapsedSelectionAllowsFormattingToolbar(editor),
  });

  const toolbarOpen =
    showFromExtension ||
    (hasFocus && !mouseDown && collapsedAllowed);

  // Koristi block start umjesto selekcije – toolbar na vrhu bloka
  const position = useEditorState({
    editor,
    selector: ({ editor }) => {
      const extShow = formattingToolbar.store.state;
      const collapsedOk = collapsedSelectionAllowsFormattingToolbar(editor);
      if (!extShow && !collapsedOk) return undefined;
      try {
        const sel = editor.prosemirrorState.selection;
        const $from = (sel as { $from?: { start: () => number } }).$from;
        const blockStart =
          typeof $from?.start === "function" ? $from.start() : undefined;
        if (typeof blockStart === "number") {
          return { from: blockStart, to: blockStart };
        }
        return {
          from: editor.prosemirrorState.selection.from,
          to: editor.prosemirrorState.selection.to,
        };
      } catch {
        return undefined;
      }
    },
  });

  const placement = useEditorState({
    editor,
    selector: ({ editor }) => {
      const block = editor.getTextCursorPosition().block;
      if (
        !blockHasType(block, editor, block.type, {
          textAlignment: defaultProps.textAlignment,
        })
      ) {
        return "top-start";
      }
      return textAlignmentToPlacement(block.props.textAlignment);
    },
  });

  const floatingUIOptions = useMemo<FloatingUIOptions>(
    () => ({
      ...props.floatingUIOptions,
      useFloatingOptions: {
        open: toolbarOpen,
        onOpenChange: (open, _event, reason) => {
          formattingToolbar.store.setState(open);
          if (reason === "escape-key") {
            editor.focus();
          }
        },
        placement,
        middleware: [offset(10), shift(), flip()],
        ...props.floatingUIOptions?.useFloatingOptions,
      },
      elementProps: {
        style: { zIndex: 40 },
        ...props.floatingUIOptions?.elementProps,
      },
    }),
    [
      toolbarOpen,
      placement,
      props.floatingUIOptions,
      formattingToolbar.store,
      editor,
    ]
  );

  const Component = props.formattingToolbar || FormattingToolbar;

  return (
    <PositionPopover position={position} {...floatingUIOptions}>
      {toolbarOpen && <Component />}
    </PositionPopover>
  );
}
