"use client";

import type { Block, BlockNoteEditor } from "@blocknote/core";
import {
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";
import { RiListOrdered, RiListUnordered } from "react-icons/ri";
import {
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
} from "@blocknote/react";

/** Blokovi u kojima pretvaranje u listu nema smisla ili ruši editor. */
const BLOCK_TYPES_NO_LIST = new Set([
  "image",
  "file",
  "video",
  "audio",
  "codeBlock",
  "youtubeEmbed",
  "beforeAfter",
  "columnList",
  "column",
]);

type BlogEditor = BlockNoteEditor<
  BlockSchema,
  InlineContentSchema,
  StyleSchema
>;
type BlogBlock = Block<BlockSchema, InlineContentSchema, StyleSchema>;

function getToolbarSelectedBlocks(editor: BlogEditor): BlogBlock[] {
  const sel = editor.getSelection();
  const blocks = sel?.blocks;
  if (blocks && blocks.length > 0) return blocks;
  try {
    return [editor.getTextCursorPosition().block];
  } catch {
    return [];
  }
}

function applyBlockListType(
  editor: BlogEditor,
  selectedBlocks: BlogBlock[],
  target: "bulletListItem" | "numberedListItem"
) {
  const convertible = selectedBlocks.filter((b) => !BLOCK_TYPES_NO_LIST.has(b.type));
  if (convertible.length === 0) return;

  editor.focus();
  editor.transact(() => {
    for (const block of convertible) {
      if (target === "bulletListItem" && block.type === "bulletListItem") {
        editor.updateBlock(block, { type: "paragraph", props: {} });
      } else if (target === "numberedListItem" && block.type === "numberedListItem") {
        editor.updateBlock(block, { type: "paragraph", props: {} });
      } else {
        editor.updateBlock(block, { type: target, props: {} });
      }
    }
  });
}

export function CustomListButtons() {
  const editor = useBlockNoteEditor<
    BlockSchema,
    InlineContentSchema,
    StyleSchema
  >();
  const Components = useComponentsContext();

  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) {
        return {
          canUseLists: false,
          isBulletActive: false,
          isOrderedActive: false,
        };
      }
      const selected = getToolbarSelectedBlocks(editor);
      const first = selected[0];
      const convertible = selected.filter((b) => !BLOCK_TYPES_NO_LIST.has(b.type));
      return {
        canUseLists: convertible.length > 0,
        isBulletActive: first?.type === "bulletListItem",
        isOrderedActive: first?.type === "numberedListItem",
      };
    },
  });

  if (!Components || !state) return null;

  return (
    <>
      <Components.FormattingToolbar.Button
        label="Bullet list"
        mainTooltip="Bullet list"
        isSelected={state.isBulletActive}
        isDisabled={!state.canUseLists}
        onClick={() =>
          applyBlockListType(editor, getToolbarSelectedBlocks(editor), "bulletListItem")
        }
        icon={
          <RiListUnordered className="bn-button-icon" aria-hidden size={18} />
        }
      />
      <Components.FormattingToolbar.Button
        label="Numbered list"
        mainTooltip="Numbered list"
        isSelected={state.isOrderedActive}
        isDisabled={!state.canUseLists}
        onClick={() =>
          applyBlockListType(editor, getToolbarSelectedBlocks(editor), "numberedListItem")
        }
        icon={
          <RiListOrdered className="bn-button-icon" aria-hidden size={18} />
        }
      />
    </>
  );
}
