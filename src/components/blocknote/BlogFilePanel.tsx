"use client";

/**
 * File Panel s dodatnim tabom "Media" – odabir postojećih slika iz biblioteke.
 * Upload | Media | Embed
 */
import {
  BlockSchema,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";
import { useState } from "react";
import {
  ComponentProps,
  EmbedTab,
  UploadTab,
  useComponentsContext,
  useBlockNoteEditor,
  useDictionary,
} from "@blocknote/react";
import { MediaLibraryTab } from "./MediaLibraryTab";

type PanelProps = ComponentProps["FilePanel"]["Root"];

export const BlogFilePanel = <
  B extends BlockSchema = DefaultBlockSchema,
  I extends InlineContentSchema = DefaultInlineContentSchema,
  S extends StyleSchema = DefaultStyleSchema,
>(
  props: { blockId: string }
) => {
  const Components = useComponentsContext()!;
  const dict = useDictionary();
  const editor = useBlockNoteEditor<B, I, S>();

  const [loading, setLoading] = useState<boolean>(false);

  const tabs: PanelProps["tabs"] = [
    ...(editor.uploadFile !== undefined
      ? [
          {
            name: dict.file_panel.upload.title,
            tabPanel: (
              <UploadTab blockId={props.blockId} setLoading={setLoading} />
            ),
          },
        ]
      : []),
    {
      name: "Media",
      tabPanel: <MediaLibraryTab blockId={props.blockId} />,
    },
    {
      name: dict.file_panel.embed.title,
      tabPanel: <EmbedTab blockId={props.blockId} />,
    },
  ];

  const [openTab, setOpenTab] = useState<string>(tabs[0].name);

  return (
    <Components.FilePanel.Root
      className="bn-panel"
      defaultOpenTab={openTab}
      openTab={openTab}
      setOpenTab={setOpenTab}
      tabs={tabs}
      loading={loading}
    />
  );
};
