"use client";

import { useRef, useEffect } from "react";
import { Link as LinkIcon, X, ExternalLink } from "lucide-react";

export type LinkSuggestion = { path: string; title: string; label: string };

interface LinkEditModalProps {
  isOpen: boolean;
  url: string;
  text: string;
  openInNewTab: boolean;
  suggestions: LinkSuggestion[];
  suggestionsVisible: boolean;
  onUrlChange: (url: string) => void;
  onOpenInNewTabChange: (value: boolean) => void;
  onSuggestionSelect: (path: string) => void;
  onSuggestionFocus: () => void;
  onConfirm: () => void;
  onRemove: () => void;
  onClose: () => void;
  /** Sakrij gumb "Ukloni link" kad se dodaje novi link (nema što ukloniti) */
  hideRemoveButton?: boolean;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function LinkEditModal({
  isOpen,
  url,
  openInNewTab,
  suggestions,
  suggestionsVisible,
  onUrlChange,
  onOpenInNewTabChange,
  onSuggestionSelect,
  onSuggestionFocus,
  onConfirm,
  onRemove,
  onClose,
  onKeyDown,
  hideRemoveButton,
}: LinkEditModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-600 bg-zinc-800 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
              <LinkIcon className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">
              {hideRemoveButton ? "Dodaj link" : "Uredi link"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            aria-label="Zatvori"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            URL adresa
          </label>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onFocus={onSuggestionFocus}
            onKeyDown={onKeyDown}
            placeholder="https://... ili /blog/slug ili /about"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {suggestionsVisible && suggestions.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-zinc-600 bg-zinc-800 py-1"
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestions.map((item) => (
                <li key={`${item.label}-${item.path}`}>
                  <button
                    type="button"
                    onMouseDown={() => onSuggestionSelect(item.path)}
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-zinc-700"
                  >
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-zinc-600 px-1.5 py-0.5 text-xs text-zinc-300">
                        {item.label}
                      </span>
                      <span className="font-medium text-zinc-100">
                        {item.title}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500">{item.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => onOpenInNewTabChange(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-amber-500"
            />
            <ExternalLink className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">Otvori u novom tabu</span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
            >
              Odustani
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-amber-400"
            >
              {hideRemoveButton ? "Dodaj link" : "Spremi"}
            </button>
          </div>
          {!hideRemoveButton && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/30"
            >
              Ukloni link (ostavi samo tekst)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
