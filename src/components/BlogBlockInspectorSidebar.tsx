"use client";

import type { Block, BlockNoteEditor } from "@blocknote/core";
import { useBlockNoteEditor, useEditorState } from "@blocknote/react";
import { useCallback, useEffect, useState } from "react";
import {
  RiContrast2Line,
  RiDeleteBin6Line,
  RiH1,
  RiH2,
  RiH3,
  RiImage2Fill,
  RiLayoutGridLine,
  RiParagraph,
  RiTableLine,
  RiYoutubeFill,
} from "react-icons/ri";

type AnyBlock = Block<any, any, any>;

/** Plitka snimka aktivnog bloka — stabilna za useEditorState selektor. */
type ActiveBlock = {
  id: string;
  type: string;
  props: Record<string, any>;
};

const BLOCK_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  table: { label: "Table", icon: <RiTableLine size={18} /> },
  image: { label: "Image", icon: <RiImage2Fill size={18} /> },
  heading: { label: "Heading", icon: <RiH1 size={18} /> },
  paragraph: { label: "Paragraph", icon: <RiParagraph size={18} /> },
  beforeAfter: { label: "Before / after", icon: <RiContrast2Line size={18} /> },
  youtubeEmbed: { label: "YouTube", icon: <RiYoutubeFill size={18} /> },
};

function findTableAncestor(
  editor: BlockNoteEditor,
  start: AnyBlock | undefined
): AnyBlock | undefined {
  let b: AnyBlock | undefined = start;
  while (b) {
    if (b.type === "table") return b;
    b = editor.getParentBlock(b.id);
  }
  return undefined;
}

/** Aktivni blok: prvo iz selekcije (slike/void blokovi), pa iz tekstualnog kursora. */
function resolveActiveBlock(editor: BlockNoteEditor): AnyBlock | undefined {
  const selBlocks = editor.getSelection()?.blocks as AnyBlock[] | undefined;
  if (selBlocks && selBlocks.length === 1) return selBlocks[0];
  try {
    return editor.getTextCursorPosition().block as AnyBlock;
  } catch {
    return undefined;
  }
}

/**
 * Kontekstualni inspektor blokova (Gutenberg-stil). Za svaki tip bloka prikazuje
 * postavke koje inače žive skrivene u hover-izbornicima: širina/alt/opis slike,
 * razina naslova, orijentacija prije/poslije, zebra tablice itd.
 */
export default function BlogBlockInspectorSidebar() {
  const editor = useBlockNoteEditor();

  const active = useEditorState<ActiveBlock | undefined>({
    editor,
    selector: ({ editor }) => {
      if (!editor?.isEditable) return undefined;
      const raw = resolveActiveBlock(editor);
      if (!raw) return undefined;
      const table = findTableAncestor(editor, raw);
      const target = table ?? raw;
      return {
        id: target.id,
        type: target.type,
        props: { ...(target.props || {}) },
      };
    },
  });

  const updateProps = useCallback(
    (patch: Record<string, any>) => {
      if (!active) return;
      editor.updateBlock(active.id, { props: patch });
    },
    [active, editor]
  );

  const removeBlock = useCallback(
    (label: string) => {
      if (!active) return;
      if (
        !confirm(
          `Remove ${label} from the post? This can only be undone via undo in the editor.`
        )
      ) {
        return;
      }
      editor.removeBlocks([active.id]);
    },
    [active, editor]
  );

  const meta = active ? BLOCK_META[active.type] : undefined;

  return (
    <aside
      className="blog-inspector flex min-h-0 flex-1 flex-col bg-[#0a0a0c] text-zinc-200"
      aria-label="Block settings"
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-zinc-800/80 bg-[#08080a] px-4 py-3.5">
        <span className="text-violet-400">
          {meta?.icon ?? <RiLayoutGridLine size={18} />}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight text-white">
            {meta?.label ?? "Block settings"}
          </h2>
          <p className="truncate text-[11px] text-zinc-500">
            {active ? "Contextual controls" : "Select a block"}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-5">
        {!active ? (
          <EmptyState />
        ) : active.type === "table" ? (
          <TablePanel
            striped={!!active.props.striped}
            onToggleStriped={() =>
              updateProps({ striped: !active.props.striped })
            }
          />
        ) : active.type === "image" ? (
          <ImagePanel
            key={active.id}
            displayWidth={active.props.displayWidth ?? "full"}
            name={active.props.name ?? ""}
            caption={active.props.caption ?? ""}
            onChange={updateProps}
          />
        ) : active.type === "heading" ? (
          <HeadingPanel
            level={Number(active.props.level) || 1}
            onChange={(level) => updateProps({ level })}
          />
        ) : active.type === "beforeAfter" ? (
          <BeforeAfterPanel
            key={active.id}
            orientation={active.props.orientation ?? "horizontal"}
            beforeLabel={active.props.beforeLabel ?? ""}
            afterLabel={active.props.afterLabel ?? ""}
            onChange={updateProps}
          />
        ) : active.type === "youtubeEmbed" ? (
          <YouTubePanel
            key={active.id}
            url={active.props.url ?? ""}
            onChange={updateProps}
          />
        ) : (
          <EmptyState typeLabel={meta?.label ?? active.type} />
        )}
      </div>

      {active && (active.type === "table" || active.type === "beforeAfter") && (
        <footer className="shrink-0 border-t border-zinc-800/90 p-3">
          <button
            type="button"
            onClick={() => removeBlock(meta?.label.toLowerCase() ?? "block")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-950/30 py-2.5 text-sm font-medium text-red-400 transition-colors hover:border-red-800/70 hover:bg-red-950/50"
          >
            <RiDeleteBin6Line size={18} />
            Remove {meta?.label.toLowerCase()}
          </button>
        </footer>
      )}
    </aside>
  );
}

/* ----------------------------- sub-paneli ----------------------------- */

function TablePanel({
  striped,
  onToggleStriped,
}: {
  striped: boolean;
  onToggleStriped: () => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Table">
        <ToggleRow
          label="Zebra rows"
          description="Alternating row background"
          checked={striped}
          onChange={onToggleStriped}
        />
      </Section>

      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Editing the table
        </p>
        <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-zinc-500">
          <li>
            <span className="text-zinc-400">Rows and columns:</span> handles{" "}
            <span className="text-zinc-400">＋</span> /{" "}
            <span className="text-zinc-400">⋮</span> at the table edge.
          </li>
          <li>
            <span className="text-zinc-400">Header, merging cells:</span>{" "}
            cell menu (handle next to the row/column).
          </li>
          <li>
            <span className="text-zinc-400">Column width:</span> drag the line
            between columns.
          </li>
        </ul>
      </section>
    </div>
  );
}

const IMAGE_WIDTHS = [
  { value: "full", label: "Full" },
  { value: "50", label: "50%" },
  { value: "25", label: "25%" },
] as const;

function ImagePanel({
  displayWidth,
  name,
  caption,
  onChange,
}: {
  displayWidth: string;
  name: string;
  caption: string;
  onChange: (patch: Record<string, any>) => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Display width">
        <Segmented
          options={IMAGE_WIDTHS}
          value={displayWidth}
          onChange={(v) => onChange({ displayWidth: v })}
        />
      </Section>

      <Section title="Caption">
        <DebouncedInput
          value={caption}
          placeholder="Text below the image…"
          onCommit={(v) => onChange({ caption: v })}
        />
      </Section>

      <Section title="Alt text (SEO / accessibility)">
        <DebouncedInput
          value={name}
          placeholder="Image description for screen readers…"
          onCommit={(v) => onChange({ name: v })}
        />
      </Section>
    </div>
  );
}

const HEADING_LEVELS = [
  { value: 1, label: "H1", icon: <RiH1 size={18} /> },
  { value: 2, label: "H2", icon: <RiH2 size={18} /> },
  { value: 3, label: "H3", icon: <RiH3 size={18} /> },
] as const;

function HeadingPanel({
  level,
  onChange,
}: {
  level: number;
  onChange: (level: number) => void;
}) {
  return (
    <Section title="Heading level">
      <div className="grid grid-cols-3 gap-2">
        {HEADING_LEVELS.map((h) => (
          <button
            key={h.value}
            type="button"
            onClick={() => onChange(h.value)}
            className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition-colors ${
              level === h.value
                ? "border-violet-500/70 bg-violet-600/15 text-violet-300"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            {h.icon}
            {h.label}
          </button>
        ))}
      </div>
    </Section>
  );
}

const ORIENTATIONS = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
] as const;

function BeforeAfterPanel({
  orientation,
  beforeLabel,
  afterLabel,
  onChange,
}: {
  orientation: string;
  beforeLabel: string;
  afterLabel: string;
  onChange: (patch: Record<string, any>) => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Slider direction">
        <Segmented
          options={ORIENTATIONS}
          value={orientation}
          onChange={(v) => onChange({ orientation: v })}
        />
      </Section>
      <Section title="“Before” label">
        <DebouncedInput
          value={beforeLabel}
          placeholder="e.g. Prije"
          onCommit={(v) => onChange({ beforeLabel: v })}
        />
      </Section>
      <Section title="“After” label">
        <DebouncedInput
          value={afterLabel}
          placeholder="e.g. Poslije"
          onCommit={(v) => onChange({ afterLabel: v })}
        />
      </Section>
    </div>
  );
}

function YouTubePanel({
  url,
  onChange,
}: {
  url: string;
  onChange: (patch: Record<string, any>) => void;
}) {
  return (
    <Section title="YouTube URL">
      <DebouncedInput
        value={url}
        placeholder="https://www.youtube.com/watch?v=…"
        onCommit={(v) => onChange({ url: v })}
      />
    </Section>
  );
}

function EmptyState({ typeLabel }: { typeLabel?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/30 p-5 text-center">
      <p className="text-sm leading-relaxed text-zinc-500">
        {typeLabel ? (
          <>
            The <span className="text-zinc-400">{typeLabel}</span> block has no
            extra settings. Text formatting lives in the toolbar above.
          </>
        ) : (
          <>
            Place the cursor in a block (table, image, heading…) to see its
            settings here.
          </>
        )}
      </p>
    </div>
  );
}

/* ----------------------------- gradivni dijelovi ----------------------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
            value === o.value
              ? "bg-violet-600 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DebouncedInput({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft !== value) onCommit(draft);
  };

  return (
    <input
      type="text"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="w-full rounded-lg border border-zinc-700/90 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15"
    />
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="flex w-full items-start justify-between gap-3 rounded-lg text-left transition-colors hover:bg-zinc-800/40"
      >
        <span>
          <span className="block text-sm font-medium text-zinc-200">
            {label}
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500">
            {description}
          </span>
        </span>
        <span
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
            checked ? "bg-violet-600" : "bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </button>
    </div>
  );
}
