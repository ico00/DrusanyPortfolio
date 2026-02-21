"use client";

/**
 * BlockTypeSelect koji prikazuje stil bloka na temelju pozicije kursora,
 * ne samo selekcije. Kad je selection prazan (samo kursor), koristi blok
 * na poziciji kursora umjesto praznog niza.
 *
 * BlockNote useSelectedBlocks koristi: getSelection()?.blocks || [cursorBlock]
 * Problem: kad je collapsed selection, getSelection() vraća { blocks: [] } –
 * prazan niz je truthy, pa se nikad ne koristi cursor fallback.
 */
import {
  BlockSchema,
  editorHasBlockWithType,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";
import {
  blockTypeSelectItems,
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
} from "@blocknote/react";
import type { BlockTypeSelectItem } from "@blocknote/react";
import { useMemo } from "react";

export function BlockTypeSelectWithCursor(props: {
  items?: BlockTypeSelectItem[];
}) {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor<
    BlockSchema,
    InlineContentSchema,
    StyleSchema
  >();

  // Ispravljen selector: kad blocks.length === 0 (collapsed selection),
  // koristi blok na poziciji kursora
  const selectedBlocks = useEditorState({
    editor,
    selector: ({ editor }) => {
      const sel = editor.getSelection();
      const blocks = sel?.blocks;
      if (blocks && blocks.length > 0) return blocks;
      try {
        return [editor.getTextCursorPosition().block];
      } catch {
        return [];
      }
    },
  });

  const firstSelectedBlock = selectedBlocks[0];

  const filteredItems = useMemo(
    () =>
      (props.items || blockTypeSelectItems(editor.dictionary)).filter(
        (item) =>
          editorHasBlockWithType(
            editor,
            item.type,
            Object.fromEntries(
              Object.entries(item.props || {}).map(([propName, propValue]) => [
                propName,
                typeof propValue,
              ])
            ) as Record<string, "string" | "number" | "boolean">
          )
    ),
    [editor, props.items],
  );

  const selectItems = useMemo(() => {
    if (!firstSelectedBlock) return [];
    return filteredItems.map((item) => {
      const Icon = item.icon;
      const typesMatch = item.type === firstSelectedBlock.type;
      const propsMatch =
        Object.entries(item.props || {}).filter(
          ([propName, propValue]) =>
            propValue !== firstSelectedBlock.props[propName]
        ).length === 0;

      return {
        text: item.name,
        icon: <Icon size={16} />,
        onClick: () => {
          editor.focus();
          editor.transact(() => {
            for (const block of selectedBlocks) {
              editor.updateBlock(block, {
                type: item.type as any,
                props: item.props as any,
              });
            }
          });
        },
        isSelected: typesMatch && propsMatch,
      };
    });
  }, [
    editor,
    filteredItems,
    firstSelectedBlock,
    selectedBlocks,
  ]);

  const shouldShow = useMemo(
    () =>
      firstSelectedBlock &&
      selectItems.some((item) => item.isSelected) &&
      editor.isEditable,
    [firstSelectedBlock, selectItems, editor.isEditable]
  );

  if (!shouldShow || !editor.isEditable) {
    return null;
  }

  return (
    <Components.FormattingToolbar.Select
      className="bn-select"
      items={selectItems}
    />
  );
}
