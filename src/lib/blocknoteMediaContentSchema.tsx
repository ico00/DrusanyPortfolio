/**
 * BlockNote blok "Media + Content" – pola slika, pola tekst.
 * Lijevo: Media area (Upload / Media Library), desno: uredivi tekst.
 */
import { useState } from "react";
import { FilePanelExtension } from "@blocknote/core/extensions";
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
  useBlockNoteEditor,
  useResolveUrl,
  FileBlockWrapper,
} from "@blocknote/react";
import { RiLayoutGrid2Fill, RiImageEditFill, RiDeleteBin7Line, RiArrowLeftRightLine } from "react-icons/ri";

const mediaContentConfig = {
  type: "mediaContent" as const,
  propSchema: {
    url: { default: "" as const },
    name: { default: "" as const },
    caption: { default: "" as const },
    showPreview: { default: true as const },
    previewWidth: { default: undefined as number | undefined, type: "number" as const },
    imagePosition: {
      default: "left" as const,
      values: ["left", "right"] as const,
    },
  },
  content: "inline" as const,
} as const;

function parseMediaContent(element: HTMLElement) {
  const wrapper = element.querySelector(".prose-media-content-split");
  if (!wrapper) return undefined;
  const img = wrapper.querySelector("img");
  const textCol = wrapper.querySelector(".prose-media-content-text");
  if (!img || !textCol) return undefined;
  const url = img.getAttribute("src") || img.getAttribute("data-url") || "";
  const imagePosition = (wrapper.getAttribute("data-image-position") || "left") as "left" | "right";
  return {
    url,
    name: img.getAttribute("alt") || "",
    caption: "",
    showPreview: true,
    previewWidth: undefined,
    imagePosition,
  };
}

const MediaPreview = (props: {
  url: string;
  name?: string;
  caption?: string;
}) => {
  const resolved = useResolveUrl(props.url);
  return (
    <img
      className="bn-visual-media w-full object-cover"
      src={
        resolved.loadingState === "loading"
          ? props.url
          : resolved.downloadUrl
      }
      alt={props.caption || props.name || "Media"}
      contentEditable={false}
      draggable={false}
    />
  );
};

const MediaContentBlock = (
  props: ReactCustomBlockRenderProps<
    (typeof mediaContentConfig)["type"],
    (typeof mediaContentConfig)["propSchema"],
    (typeof mediaContentConfig)["content"]
  >,
) => {
  const editor = useBlockNoteEditor();
  const { block, contentRef } = props;
  const hasUrl = !!(block.props.url && block.props.url !== "");
  const imagePosition = block.props.imagePosition || "left";
  const isLeft = imagePosition === "left";
  const [hovered, setHovered] = useState(false);

  const mediaArea = (
    <div
      className="relative flex min-h-[120px] min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-600 bg-zinc-800/50 p-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <FileBlockWrapper {...(props as any)} buttonIcon={<RiLayoutGrid2Fill size={24} />}>
        {hasUrl ? (
          <MediaPreview
            url={block.props.url!}
            name={block.props.name}
            caption={block.props.caption}
          />
        ) : null}
      </FileBlockWrapper>
      {hovered && (
        <div
          className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-lg border border-zinc-600 bg-zinc-800/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
          contentEditable={false}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.updateBlock(block.id, {
                props: { imagePosition: isLeft ? "right" : "left" },
              });
            }}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600 hover:text-white"
            title={isLeft ? "Image on right" : "Image on left"}
          >
            <RiArrowLeftRightLine size={14} />
            {isLeft ? "Right" : "Left"}
          </button>
          {hasUrl && (
            <>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  editor.getExtension(FilePanelExtension)?.showMenu(block.id);
                }}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600 hover:text-white"
                title="Replace"
              >
                <RiImageEditFill size={14} />
                Replace
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  editor.updateBlock(block.id, { props: { url: "", name: "" } });
                }}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-red-600/80 hover:text-white"
                title="Remove"
              >
                <RiDeleteBin7Line size={14} />
                Remove
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  const contentArea = (
    <div
      ref={contentRef}
      className="min-h-[80px] min-w-0 flex-1 rounded-lg border border-zinc-600 bg-zinc-800/30 p-4"
      style={{ minWidth: 0 }}
    />
  );

  return (
    <div className="bn-media-content-block my-4 flex w-full flex-row gap-4 items-stretch">
      {isLeft ? (
        <>
          {mediaArea}
          {contentArea}
        </>
      ) : (
        <>
          {contentArea}
          {mediaArea}
        </>
      )}
    </div>
  );
};

/** toExternalHTML – BlockNote koristi render za HTML export kad nije definiran; ovdje vraćamo strukturu za procesiranje u ProseContent */
const MediaContentToExternalHTML = (
  props: Omit<
    ReactCustomBlockRenderProps<
      (typeof mediaContentConfig)["type"],
      (typeof mediaContentConfig)["propSchema"],
      (typeof mediaContentConfig)["content"]
    >,
    "contentRef"
  >,
) => {
  const { block } = props;
  const url = block.props.url;
  const imagePosition = block.props.imagePosition || "left";
  const isLeft = imagePosition === "left";

  if (!url) {
    return (
      <div className="prose-media-content-split flex flex-col gap-4 md:flex-row" data-image-position={imagePosition}>
        <div className="w-full md:w-1/2">
          <p className="text-zinc-500">Media area</p>
        </div>
        <div className="prose-media-content-text w-full md:w-1/2" />
      </div>
    );
  }

  const img = (
    <img
      src={url}
      alt={block.props.name || block.props.caption || "Media"}
      data-display-width="split"
      data-prose-split="true"
      className="w-full object-cover"
    />
  );

  return (
    <div
      className="prose-media-content-split flex flex-col gap-4 md:flex-row md:items-start"
      data-image-position={imagePosition}
    >
      <div className={`w-full md:w-1/2 shrink-0 ${isLeft ? "order-1" : "order-2"}`}>
        {img}
      </div>
      <div className={`prose-media-content-text prose w-full md:w-1/2 min-w-0 ${isLeft ? "order-2" : "order-1"}`} />
    </div>
  );
};

export const MediaContentBlockSpec = createReactBlockSpec(mediaContentConfig, () => ({
  render: MediaContentBlock,
  parse: parseMediaContent,
  toExternalHTML: MediaContentToExternalHTML,
  meta: {
    fileBlockAccept: ["image/*"],
    runsBefore: ["file"],
  },
}));
