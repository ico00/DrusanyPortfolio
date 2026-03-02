/**
 * Custom BlockNote Image block s displayWidth prop (full | 50 | 25).
 * Proširuje default image block za odabir širine prikaza u blogu.
 */
import { useState } from "react";
import {
  BlockNoteSchema,
  createImageBlockConfig,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
  useBlockNoteEditor,
  useResolveUrl,
  FigureWithCaption,
  ResizableFileBlockWrapper,
  LinkWithCaption,
} from "@blocknote/react";
import { RiImage2Fill } from "react-icons/ri";

const baseConfig = createImageBlockConfig({});
const extendedImageConfig = {
  ...baseConfig,
  propSchema: {
    ...baseConfig.propSchema,
    displayWidth: {
      default: "full" as const,
      values: ["full", "50", "25"] as const,
    },
  },
} as const;

function parseImageWithDisplayWidth(element: HTMLElement) {
  if (element.tagName !== "IMG") return undefined;
  const img = element as HTMLImageElement;
  const url = img.src || img.getAttribute("data-url") || undefined;
  const previewWidth =
    img.width ||
    parseInt(img.getAttribute("data-preview-width") || "", 10) ||
    undefined;
  const name = img.alt || img.getAttribute("data-name") || undefined;
  const displayWidth = img.getAttribute("data-display-width");
  const validDisplayWidth: "full" | "50" | "25" =
    displayWidth && ["full", "50", "25"].includes(displayWidth)
      ? (displayWidth as "full" | "50" | "25")
      : "full";

  return {
    url,
    previewWidth: Number.isNaN(previewWidth) ? undefined : previewWidth,
    name,
    displayWidth: validDisplayWidth,
    backgroundColor: "default" as const,
  };
}

function imageParse(element: HTMLElement) {
  if (element.tagName === "IMG") {
    if (element.closest("figure")) return undefined;
    return parseImageWithDisplayWidth(element);
  }
  if (element.tagName === "FIGURE") {
    const img = element.querySelector("img");
    if (!img) return undefined;
    const parsed = parseImageWithDisplayWidth(img);
    if (!parsed) return undefined;
    const figcaption = element.querySelector("figcaption");
    return {
      ...parsed,
      caption: figcaption?.textContent || "",
    };
  }
  return undefined;
}

const ImagePreview = (
  props: Omit<
    ReactCustomBlockRenderProps<
      (typeof extendedImageConfig)["type"],
      (typeof extendedImageConfig)["propSchema"],
      (typeof extendedImageConfig)["content"]
    >,
    "contentRef"
  >,
) => {
  const resolved = useResolveUrl(props.block.props.url!);
  return (
    <img
      className="bn-visual-media"
      src={
        resolved.loadingState === "loading"
          ? props.block.props.url
          : resolved.downloadUrl
      }
      alt={props.block.props.caption || "BlockNote image"}
      contentEditable={false}
      draggable={false}
    />
  );
};

const ImageToExternalHTML = (
  props: Omit<
    ReactCustomBlockRenderProps<
      (typeof extendedImageConfig)["type"],
      (typeof extendedImageConfig)["propSchema"],
      (typeof extendedImageConfig)["content"]
    >,
    "contentRef"
  >,
) => {
  if (!props.block.props.url) {
    return <p>Add image</p>;
  }

  const displayWidth = props.block.props.displayWidth || "full";
  const imageProps: Record<string, string | number | undefined> = {
    src: props.block.props.url,
    alt:
      props.block.props.name ||
      props.block.props.caption ||
      "BlockNote image",
    width: props.block.props.previewWidth,
  };
  if (displayWidth !== "full") {
    (imageProps as Record<string, string>)["data-display-width"] =
      displayWidth;
  }

  const image = props.block.props.showPreview ? (
    <img {...imageProps} />
  ) : (
    <a href={props.block.props.url}>
      {props.block.props.name || props.block.props.url}
    </a>
  );

  if (props.block.props.caption) {
    return props.block.props.showPreview ? (
      <FigureWithCaption caption={props.block.props.caption}>
        {image}
      </FigureWithCaption>
    ) : (
      <LinkWithCaption caption={props.block.props.caption}>
        {image}
      </LinkWithCaption>
    );
  }

  return image;
};

const WIDTH_OPTIONS = [
  { value: "full", label: "Full" },
  { value: "50", label: "50%" },
  { value: "25", label: "25%" },
] as const;

const DISPLAY_WIDTH_MAP: Record<string, string> = { "50": "50%", "25": "25%" };

const ImageBlock = (
  props: ReactCustomBlockRenderProps<
    (typeof extendedImageConfig)["type"],
    (typeof extendedImageConfig)["propSchema"],
    (typeof extendedImageConfig)["content"]
  >,
) => {
  const editor = useBlockNoteEditor();
  const [hovered, setHovered] = useState(false);
  const dw = props.block.props.displayWidth;
  const hasUrl = !!props.block.props.url;
  const constrainStyle = DISPLAY_WIDTH_MAP[dw]
    ? { maxWidth: DISPLAY_WIDTH_MAP[dw], transition: "max-width 0.2s ease" }
    : undefined;

  return (
    <div
      style={{ position: "relative", ...constrainStyle }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ResizableFileBlockWrapper
        {...(props as any)}
        buttonIcon={<RiImage2Fill size={24} />}
      >
        <ImagePreview {...(props as any)} />
      </ResizableFileBlockWrapper>

      {hasUrl && hovered && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: "rgba(39,39,42,0.92)",
            borderRadius: 8,
            border: "1px solid rgba(113,113,122,0.5)",
            padding: "3px 6px",
            backdropFilter: "blur(8px)",
            pointerEvents: "auto",
          }}
          contentEditable={false}
        >
          {WIDTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor.updateBlock(props.block.id, {
                  props: { displayWidth: opt.value },
                });
              }}
              style={{
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 5,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background:
                  dw === opt.value ? "#d97706" : "transparent",
                color: dw === opt.value ? "#fff" : "#a1a1aa",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CustomImageBlock = createReactBlockSpec(extendedImageConfig, () => ({
  render: ImageBlock,
  parse: imageParse,
  toExternalHTML: ImageToExternalHTML,
  meta: {
    fileBlockAccept: ["image/*"],
    runsBefore: ["file"],
  },
}));

import { YouTubeEmbedBlockSpec } from "./blocknoteYouTubeSchema";

export const blogBlockNoteSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    image: CustomImageBlock(),
    youtubeEmbed: YouTubeEmbedBlockSpec(),
  },
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});
