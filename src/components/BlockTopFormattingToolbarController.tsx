"use client";

/**
 * FormattingToolbarController koji pozicionira toolbar na vrh bloka umjesto
 * kod kursora/selekcije. Koristi block start poziciju za konzistentan UX.
 */
import {
  blockHasType,
  defaultProps,
  DefaultProps,
} from "@blocknote/core";
import { FormattingToolbarExtension } from "@blocknote/core/extensions";
import { flip, offset, shift } from "@floating-ui/react";
import { FC, useMemo } from "react";
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
  const show = useExtensionState(FormattingToolbarExtension, {
    editor,
  });

  // Koristi block start umjesto selekcije – toolbar na vrhu bloka
  const position = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!formattingToolbar.store.state) return undefined;
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
        open: show,
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
    [show, placement, props.floatingUIOptions, formattingToolbar.store, editor]
  );

  const Component = props.formattingToolbar || FormattingToolbar;

  return (
    <PositionPopover position={position} {...floatingUIOptions}>
      {show && <Component />}
    </PositionPopover>
  );
}
