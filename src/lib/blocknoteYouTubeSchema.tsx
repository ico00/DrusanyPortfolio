/**
 * BlockNote blok za YouTube embed – ubaci blok, zalijepi link, video se prikaže po širini stranice.
 */
import { useState } from "react";
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
  useBlockNoteEditor,
} from "@blocknote/react";
import { RiYoutubeFill } from "react-icons/ri";

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:[?&/]|$)/;

function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
}

function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

const youtubeEmbedConfig = {
  type: "youtubeEmbed" as const,
  propSchema: {
    url: { default: "" as const },
  },
  content: "none" as const,
} as const;

function parseYouTubeEmbed(element: HTMLElement) {
  let iframe: HTMLIFrameElement | null = null;
  if (element.tagName === "IFRAME") {
    iframe = element as HTMLIFrameElement;
  } else {
    iframe = element.querySelector("iframe");
  }
  if (iframe) {
    const src = iframe.src || iframe.getAttribute("src") || "";
    const id = extractYouTubeVideoId(src);
    if (id) return { url: getEmbedUrl(id) };
  }
  // WordPress embed: figure s linkom ili URL kao tekst
  if (element.tagName === "FIGURE") {
    const link = element.querySelector('a[href*="youtube.com"], a[href*="youtu.be"]');
    if (link) {
      const id = extractYouTubeVideoId((link as HTMLAnchorElement).href || "");
      if (id) return { url: getEmbedUrl(id) };
    }
    const text = element.textContent?.trim() || "";
    const id = extractYouTubeVideoId(text);
    if (id) return { url: getEmbedUrl(id) };
  }
  return undefined;
}

const YouTubeEmbedBlock = (
  props: ReactCustomBlockRenderProps<
    (typeof youtubeEmbedConfig)["type"],
    (typeof youtubeEmbedConfig)["propSchema"],
    (typeof youtubeEmbedConfig)["content"]
  >,
) => {
  const editor = useBlockNoteEditor();
  const { block } = props;
  const url = block.props.url || "";
  const videoId = extractYouTubeVideoId(url);
  const embedUrl = videoId ? getEmbedUrl(videoId) : null;
  const [inputValue, setInputValue] = useState(url || "");

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text");
    const id = extractYouTubeVideoId(pasted);
    if (id) {
      e.preventDefault();
      setInputValue(getEmbedUrl(id));
      editor.updateBlock(block.id, { props: { url: getEmbedUrl(id) } });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const id = extractYouTubeVideoId(val);
    if (id) {
      editor.updateBlock(block.id, { props: { url: getEmbedUrl(id) } });
    }
  };

  const handleBlur = () => {
    const id = extractYouTubeVideoId(inputValue);
    if (id) {
      editor.updateBlock(block.id, { props: { url: getEmbedUrl(id) } });
    }
  };

  return (
    <div
      className="bn-youtube-embed-block my-4 w-full rounded-lg border border-dashed border-zinc-600 bg-zinc-800/30 p-4"
      contentEditable={false}
    >
      {embedUrl ? (
        <div className="relative w-full" style={{ aspectRatio: "16/9", padding: 6, boxSizing: "border-box" }}>
          <iframe
            src={embedUrl}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <RiYoutubeFill size={24} />
            <span className="text-sm font-medium">YouTube video</span>
          </div>
          <input
            type="url"
            placeholder="Zalijepi YouTube link (npr. https://www.youtube.com/watch?v=...)"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onPaste={handlePaste}
            className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}
    </div>
  );
};

export const YouTubeEmbedToExternalHTML = (
  props: Omit<
    ReactCustomBlockRenderProps<
      (typeof youtubeEmbedConfig)["type"],
      (typeof youtubeEmbedConfig)["propSchema"],
      (typeof youtubeEmbedConfig)["content"]
    >,
    "contentRef"
  >,
) => {
  const url = props.block.props.url || "";
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const embedUrl = getEmbedUrl(videoId);
  return (
    <figure className="prose-youtube-wrapper my-6 w-full">
      <div className="relative w-full" style={{ aspectRatio: "16/9", padding: 6, boxSizing: "border-box" }}>
        <iframe
          src={embedUrl}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </figure>
  );
};

export const YouTubeEmbedBlockSpec = createReactBlockSpec(youtubeEmbedConfig, () => ({
  render: YouTubeEmbedBlock,
  parse: parseYouTubeEmbed,
  toExternalHTML: YouTubeEmbedToExternalHTML,
}));
