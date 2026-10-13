/**
 * BlockNote blok za filter galerije po imenu – ubaci blok gdje god u tekstu posta,
 * filtrira slike u galeriji ispod (po title/description polju svake fotografije).
 * Opt-in po postu: aktivan je samo na postovima gdje je blok stvarno umetnut.
 */
import { useState } from "react";
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
  useBlockNoteEditor,
} from "@blocknote/react";
import { Search } from "lucide-react";

export const PLAYER_FILTER_DEFAULT_PLACEHOLDER = "Filtriraj po imenu…";

const playerFilterConfig = {
  type: "playerFilter" as const,
  propSchema: {
    placeholder: { default: PLAYER_FILTER_DEFAULT_PLACEHOLDER as string },
  },
  content: "none" as const,
} as const;

function parsePlayerFilter(element: HTMLElement) {
  const wrapper =
    element.classList.contains("prose-player-filter")
      ? element
      : (element.closest("div.prose-player-filter") as HTMLElement | null);
  if (!wrapper) return undefined;
  const input = wrapper.querySelector<HTMLInputElement>(
    ".prose-player-filter-input"
  );
  const placeholder = input?.getAttribute("placeholder")?.trim();
  return { placeholder: placeholder || PLAYER_FILTER_DEFAULT_PLACEHOLDER };
}

const PlayerFilterBlock = (
  props: ReactCustomBlockRenderProps<
    (typeof playerFilterConfig)["type"],
    (typeof playerFilterConfig)["propSchema"],
    (typeof playerFilterConfig)["content"]
  >
) => {
  const editor = useBlockNoteEditor();
  const { block } = props;
  const [value, setValue] = useState(
    block.props.placeholder || PLAYER_FILTER_DEFAULT_PLACEHOLDER
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    editor.updateBlock(block.id, { props: { placeholder: val } });
  };

  return (
    <div
      className="bn-player-filter-block my-4 flex flex-col gap-2 rounded-lg border border-dashed border-zinc-600 bg-zinc-800/30 p-4"
      contentEditable={false}
    >
      <div className="flex items-center gap-2 text-zinc-400">
        <Search size={16} />
        <span className="text-sm font-medium">
          Filter galerije (aktivan na javnoj stranici)
        </span>
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Tekst u polju za pretragu (npr. Filtriraj po imenu…)"
        className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <p className="text-xs text-zinc-500">
        Filtrira galeriju fotografija ovog posta po naslovu/opisu svake slike.
      </p>
    </div>
  );
};

export const PlayerFilterToExternalHTML = (
  props: Omit<
    ReactCustomBlockRenderProps<
      (typeof playerFilterConfig)["type"],
      (typeof playerFilterConfig)["propSchema"],
      (typeof playerFilterConfig)["content"]
    >,
    "contentRef"
  >
) => {
  const placeholder =
    props.block.props.placeholder || PLAYER_FILTER_DEFAULT_PLACEHOLDER;
  return (
    <div className="prose-player-filter">
      <input
        type="search"
        className="prose-player-filter-input"
        placeholder={placeholder}
        aria-label="Filtriraj galeriju po imenu"
        autoComplete="off"
      />
    </div>
  );
};

export const PlayerFilterBlockSpec = createReactBlockSpec(
  playerFilterConfig,
  () => ({
    render: PlayerFilterBlock,
    parse: parsePlayerFilter,
    toExternalHTML: PlayerFilterToExternalHTML,
  })
);
