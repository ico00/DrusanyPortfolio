/**
 * BlockNote blok: usporedba prije/poslije (klizač kao Elfsight before/after).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
  useBlockNoteEditor,
} from "@blocknote/react";
import { RiContrast2Line, RiSettings3Line } from "react-icons/ri";

const beforeAfterConfig = {
  type: "beforeAfter" as const,
  propSchema: {
    beforeUrl: { default: "" as const },
    afterUrl: { default: "" as const },
    orientation: {
      default: "horizontal" as const,
      values: ["horizontal", "vertical"] as const,
    },
    beforeLabel: { default: "" as const },
    afterLabel: { default: "" as const },
  },
  content: "none" as const,
} as const;

type BeforeAfterProps = (typeof beforeAfterConfig)["propSchema"];

function parseBeforeAfter(element: HTMLElement) {
  const fig =
    element.tagName === "FIGURE" && element.classList.contains("prose-before-after")
      ? element
      : (element.closest("figure.prose-before-after") as HTMLElement | null);
  if (!fig) return undefined;
  const after = fig.querySelector("img.prose-before-after-after");
  const before = fig.querySelector("img.prose-before-after-before");
  if (!after || !before) return undefined;
  const aSrc = (after as HTMLImageElement).getAttribute("src") || "";
  const bSrc = (before as HTMLImageElement).getAttribute("src") || "";
  if (!aSrc || !bSrc) return undefined;
  const o = fig.getAttribute("data-orientation");
  const orientation: "horizontal" | "vertical" =
    o === "vertical" ? "vertical" : "horizontal";
  return {
    beforeUrl: bSrc,
    afterUrl: aSrc,
    orientation,
    beforeLabel: (before as HTMLImageElement).getAttribute("alt") || "",
    afterLabel: (after as HTMLImageElement).getAttribute("alt") || "",
  };
}

async function extractUploadUrl(
  editor: BlockNoteEditor,
  file: File,
  blockId: string
): Promise<string | null> {
  if (editor.uploadFile === undefined) return null;
  try {
    let updateData = await editor.uploadFile(file, blockId);
    if (typeof updateData === "string") return updateData;
    if (
      updateData &&
      typeof updateData === "object" &&
      "props" in updateData &&
      updateData.props &&
      typeof (updateData.props as { url?: string }).url === "string"
    ) {
      return (updateData.props as { url: string }).url;
    }
  } catch {
    return null;
  }
  return null;
}

/** U editoru koristimo izravno `src` – izbjegava ProseMirror + resolveUrl; slike su već apsolutni blog URL-ovi. */
function EditorPreviewImg({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={url}
      className={className}
      src={url}
      alt={alt}
      draggable={false}
      contentEditable={false}
    />
  );
}

/**
 * Natpisi unutar zona širine/visine kao vidljivi sloj – kad je klizač skroz ustranu,
 * natpis „Prije”/„Poslije” nestaje s overflowom (ne stoji preko cijelog okvira).
 */
function BeforeAfterOverlayLabels({
  beforeText,
  afterText,
}: {
  beforeText: string;
  afterText: string;
}) {
  return (
    <>
      <div
        className="prose-before-after-caption-zone prose-before-after-caption-zone-before"
        aria-hidden
      >
        <span className="prose-before-after-caption">{beforeText}</span>
      </div>
      <div
        className="prose-before-after-caption-zone prose-before-after-caption-zone-after"
        aria-hidden
      >
        <span className="prose-before-after-caption">{afterText}</span>
      </div>
    </>
  );
}

const BeforeAfterBlock = (
  props: ReactCustomBlockRenderProps<
    (typeof beforeAfterConfig)["type"],
    BeforeAfterProps,
    (typeof beforeAfterConfig)["content"]
  >
) => {
  const editor = useBlockNoteEditor();
  const { block } = props;
  const {
    beforeUrl,
    afterUrl,
    orientation,
    beforeLabel,
    afterLabel,
  } = block.props;
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const beforeAlt = beforeLabel.trim() || "Prije";
  const afterAlt = afterLabel.trim() || "Poslije";

  const pickBefore = useCallback(() => beforeInputRef.current?.click(), []);
  const pickAfter = useCallback(() => afterInputRef.current?.click(), []);

  const hasBoth = !!(beforeUrl && afterUrl);
  const sameUrl =
    hasBoth && beforeUrl.trim() !== "" && beforeUrl === afterUrl;
  const [sliderPct, setSliderPct] = useState(50);
  /** Kad su obje slike postavljene, editor prikazuje samo klizač (kao na blogu). */
  const [settingsOpen, setSettingsOpen] = useState(!hasBoth);

  useEffect(() => {
    if (!hasBoth) setSettingsOpen(true);
  }, [hasBoth]);

  const onBeforeFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !f.type.startsWith("image/")) return;
      const url = await extractUploadUrl(editor, f, block.id);
      if (url) {
        editor.updateBlock(block.id, { props: { beforeUrl: url } });
        if (afterUrl) setSettingsOpen(false);
      }
    },
    [editor, block.id, afterUrl]
  );

  const onAfterFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !f.type.startsWith("image/")) return;
      const url = await extractUploadUrl(editor, f, block.id);
      if (url) {
        editor.updateBlock(block.id, { props: { afterUrl: url } });
        if (beforeUrl) setSettingsOpen(false);
      }
    },
    [editor, block.id, beforeUrl]
  );

  const showChrome = !hasBoth || settingsOpen;
  const wrapperClass = showChrome
    ? "bn-before-after-block my-4 w-full rounded-lg border border-dashed border-zinc-600 bg-zinc-800/30 p-4"
    : "bn-before-after-block bn-before-after-block--compact my-4 w-full";

  return (
    <div className={wrapperClass} contentEditable={false}>
      <input
        ref={beforeInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={onBeforeFile}
      />
      <input
        ref={afterInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={onAfterFile}
      />

      {showChrome && (
        <>
          <div
            className="mb-3 flex flex-wrap items-center gap-2"
            style={{ rowGap: 8 }}
          >
            <RiContrast2Line className="shrink-0 text-zinc-400" size={22} />
            <span className="text-sm font-medium text-zinc-300">
              Prije / poslije
            </span>
            <div
              className="ml-auto flex shrink-0 flex-wrap items-center gap-3"
              style={{ rowGap: 8 }}
            >
              {hasBoth && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen(false);
                  }}
                  className="text-xs font-medium text-amber-400/90 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-300"
                >
                  Prikaži samo klizač
                </button>
              )}
              <div
                className="flex shrink-0 items-stretch rounded-md border border-zinc-500 bg-zinc-900/80 p-0.5"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  gap: 6,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  editor.updateBlock(block.id, {
                    props: { orientation: "horizontal" },
                  });
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  backgroundColor:
                    orientation === "horizontal"
                      ? "rgb(217 119 6)"
                      : "transparent",
                  color:
                    orientation === "horizontal"
                      ? "rgb(255 255 255)"
                      : "rgb(161 161 170)",
                }}
              >
                Vodoravno
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  editor.updateBlock(block.id, {
                    props: { orientation: "vertical" },
                  });
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  backgroundColor:
                    orientation === "vertical"
                      ? "rgb(217 119 6)"
                      : "transparent",
                  color:
                    orientation === "vertical"
                      ? "rgb(255 255 255)"
                      : "rgb(161 161 170)",
                }}
              >
                Okomito
              </button>
              </div>
            </div>
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <label
              className="flex flex-col gap-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-zinc-400">
                Opis „prije” (alt, opcionalno)
              </span>
              <input
                type="text"
                value={beforeLabel}
                onChange={(e) =>
                  editor.updateBlock(block.id, {
                    props: { beforeLabel: e.target.value },
                  })
                }
                placeholder="npr. prije obrade"
                className="bn-ba-text-input rounded px-2 py-1.5 text-xs"
              />
            </label>
            <label
              className="flex flex-col gap-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-zinc-400">
                Opis „poslije” (alt, opcionalno)
              </span>
              <input
                type="text"
                value={afterLabel}
                onChange={(e) =>
                  editor.updateBlock(block.id, {
                    props: { afterLabel: e.target.value },
                  })
                }
                placeholder="npr. poslije obrade"
                className="bn-ba-text-input rounded px-2 py-1.5 text-xs"
              />
            </label>
          </div>

          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Slika „prije”</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    pickBefore();
                  }}
                  className="bn-ba-picker-btn"
                >
                  Odaberi
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Slika „poslije”</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    pickAfter();
                  }}
                  className="bn-ba-picker-btn"
                >
                  Odaberi
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showChrome && sameUrl && (
        <p className="mb-2 rounded border border-amber-600/50 bg-amber-950/40 px-2 py-1.5 text-xs text-amber-200">
          Obje strane koriste istu datoteku (isti URL). Učitaj dvije različite
          slike da usporedba ima smisla.
        </p>
      )}

      {hasBoth ? (
        <figure
          className="prose-before-after mx-0 w-full"
          data-orientation={orientation}
          style={
            {
              ["--ba-pos"]: `${sliderPct}%`,
            } as React.CSSProperties
          }
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="prose-before-after-viewport"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <EditorPreviewImg
              url={afterUrl}
              alt={afterAlt}
              className="prose-before-after-after"
            />
            <EditorPreviewImg
              url={beforeUrl}
              alt={beforeAlt}
              className="prose-before-after-before"
            />
            <div className="prose-before-after-divider" aria-hidden />
            <BeforeAfterOverlayLabels
              beforeText={beforeAlt}
              afterText={afterAlt}
            />
            <input
              type="range"
              className="prose-before-after-range prose-before-after-range--editor"
              min={0}
              max={100}
              value={sliderPct}
              step={0.5}
              aria-label="Usporedba prije i poslije"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => setSliderPct(Number(e.target.value))}
            />
          </div>
        </figure>
      ) : (
        <p className="text-center text-xs text-zinc-500">
          Učitaj obje slike da vidiš klizač.
        </p>
      )}

      {hasBoth && !settingsOpen && (
        <div className="mt-1.5 flex justify-center">
          <button
            type="button"
            title="Postavke klizača"
            aria-label="Postavke klizača: slike, opisi, smjer"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSettingsOpen(true);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-700/60 hover:text-zinc-300"
          >
            <RiSettings3Line size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
};

export const BeforeAfterToExternalHTML = (
  props: Omit<
    ReactCustomBlockRenderProps<
      (typeof beforeAfterConfig)["type"],
      BeforeAfterProps,
      (typeof beforeAfterConfig)["content"]
    >,
    "contentRef"
  >
) => {
  const { beforeUrl, afterUrl, orientation, beforeLabel, afterLabel } =
    props.block.props;
  /* blocksToHTMLLossy ne smije dobiti null dom – inače ExportManager puca na ret.dom.classList */
  if (!beforeUrl || !afterUrl) {
    return (
      <span
        className="bn-export-placeholder"
        aria-hidden="true"
        data-bn-export="beforeAfter-incomplete"
      />
    );
  }

  const beforeAlt = beforeLabel.trim() || "Prije";
  const afterAlt = afterLabel.trim() || "Poslije";

  return (
    <figure
      className="prose-before-after my-6 w-full max-w-full"
      data-orientation={orientation}
    >
      <div className="prose-before-after-viewport">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="prose-before-after-after"
          src={afterUrl}
          alt={afterAlt}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="prose-before-after-before"
          src={beforeUrl}
          alt={beforeAlt}
        />
        <div className="prose-before-after-divider" aria-hidden />
        <div
          className="prose-before-after-caption-zone prose-before-after-caption-zone-before"
          aria-hidden
        >
          <span className="prose-before-after-caption">{beforeAlt}</span>
        </div>
        <div
          className="prose-before-after-caption-zone prose-before-after-caption-zone-after"
          aria-hidden
        >
          <span className="prose-before-after-caption">{afterAlt}</span>
        </div>
        <input
          type="range"
          className="prose-before-after-range"
          min={0}
          max={100}
          defaultValue={50}
          step={0.5}
          aria-label="Usporedba prije i poslije"
        />
      </div>
    </figure>
  );
};

export const BeforeAfterBlockSpec = createReactBlockSpec(beforeAfterConfig, () => ({
  render: BeforeAfterBlock,
  parse: parseBeforeAfter,
  toExternalHTML: BeforeAfterToExternalHTML,
}));
