"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useBlockNoteEditor,
  useEditorState,
  useExtension,
  useComponentsContext,
} from "@blocknote/react";
import {
  BlockNoteEditor,
  formatKeyboardShortcut,
  isTableCellSelection,
} from "@blocknote/core";
import {
  FormattingToolbarExtension,
  LinkToolbarExtension,
  ShowSelectionExtension,
} from "@blocknote/core/extensions";
import { Link as LinkIcon } from "lucide-react";
import { LinkEditModal } from "./LinkEditModal";
import type { LinkSuggestion } from "./LinkEditModal";

const VALID_LINK_PROTOCOLS = ["http://", "https://", "mailto:", "/"];
const DEFAULT_LINK_PROTOCOL = "https";

function validateUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  for (const protocol of VALID_LINK_PROTOCOLS) {
    if (trimmed.toLowerCase().startsWith(protocol)) return trimmed;
  }
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return `${DEFAULT_LINK_PROTOCOL}://${trimmed}`;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function checkLinkInSchema(editor: BlockNoteEditor): boolean {
  return (
    "link" in editor.schema.inlineContentSchema &&
    editor.schema.inlineContentSchema["link"] === "link"
  );
}

export function CustomCreateLinkButton() {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  const formattingToolbar = useExtension(FormattingToolbarExtension);
  const { showSelection } = useExtension(ShowSelectionExtension);
  const linkExt = useExtension(LinkToolbarExtension);

  const [showModal, setShowModal] = useState(false);
  const [editUrl, setEditUrl] = useState("https://");
  const [editOpenInNewTab, setEditOpenInNewTab] = useState(true);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (
        !editor.isEditable ||
        !checkLinkInSchema(editor) ||
        isTableCellSelection(editor.prosemirrorState.selection) ||
        !(
          editor.getSelection()?.blocks || [editor.getTextCursorPosition().block]
        ).find((block) => block.content !== undefined)
      ) {
        return undefined;
      }
      return {
        url: editor.getSelectedLinkUrl(),
        text: editor.getSelectedText(),
        range: {
          from: editor.prosemirrorState.selection.from,
          to: editor.prosemirrorState.selection.to,
        },
      };
    },
  });

  useEffect(() => {
    showSelection(showModal, "createLinkButton");
    return () => showSelection(false, "createLinkButton");
  }, [showModal, showSelection]);

  useEffect(() => {
    setShowModal(false);
  }, [state]);

  // Učitaj predloške kad se modal otvori
  useEffect(() => {
    if (!showModal) {
      setSuggestions([]);
      setSuggestionsVisible(false);
      return;
    }
    setEditUrl(state?.url || "https://");
    if (state?.url && linkExt) {
      const anchor = linkExt.getLinkElementAtPos(state.range.from);
      setEditOpenInNewTab(anchor ? anchor.target === "_blank" : true);
    } else {
      setEditOpenInNewTab(true);
    }
    Promise.all([
      fetch("/api/blog", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/pages", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([blogData, pagesData]) => {
        const items: LinkSuggestion[] = [];
        if (blogData?.posts) {
          blogData.posts.slice(0, 12).forEach((p: { slug: string; title: string }) => {
            items.push({ path: `/blog/${p.slug}`, title: p.title, label: "Blog" });
          });
        }
        if (pagesData?.about?.html) {
          items.push({ path: "/about", title: "O meni", label: "Stranica" });
        }
        if (pagesData?.contact?.html) {
          items.push({ path: "/contact", title: "Kontakt", label: "Stranica" });
        }
        setSuggestions(items);
      })
      .catch(() => setSuggestions([]));
  }, [showModal, state?.url, state?.range, editor, linkExt]);

  // Filtriraj predloške dok korisnik tipka
  useEffect(() => {
    if (!showModal) return;
    const q = editUrl
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/*/, "")
      .replace(/^\/*/, "");
    if (!q) {
      setSuggestionsVisible(suggestions.length > 0);
      return;
    }
    fetch("/api/blog", { cache: "no-store" })
      .then((r) => r.json())
      .then((blogData) => {
        const all: LinkSuggestion[] = [];
        if (blogData?.posts) {
          blogData.posts.forEach((p: { slug: string; title: string }) => {
            all.push({ path: `/blog/${p.slug}`, title: p.title, label: "Blog" });
          });
        }
        all.push({ path: "/about", title: "O meni", label: "Stranica" });
        all.push({ path: "/contact", title: "Kontakt", label: "Stranica" });
        const filtered = all
          .filter(
            (item: LinkSuggestion) =>
              item.path.toLowerCase().includes(q) ||
              item.title.toLowerCase().includes(q) ||
              item.label.toLowerCase().includes(q)
          )
          .slice(0, 12);
        setSuggestions(filtered);
        setSuggestionsVisible(filtered.length > 0);
      })
      .catch(() => {});
  }, [editUrl, showModal]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    formattingToolbar?.store.setState(false);
  }, [formattingToolbar]);

  const applyLink = useCallback(() => {
    if (!state) return;
    const validated = validateUrl(editUrl);
    if (!validated) {
      closeModal();
      return;
    }
    const tiptap = editor?._tiptapEditor;
    if (tiptap) {
      const { from, to } = state.range;
      let chain = tiptap.chain().focus().setTextSelection({ from, to });
      if (state.url) {
        chain = chain.extendMarkRange("link");
      }
      chain
        .setLink({
          href: validated,
          target: editOpenInNewTab ? "_blank" : null,
        })
        .run();
    }
    closeModal();
  }, [editor, state, editUrl, editOpenInNewTab, closeModal]);

  const removeLink = useCallback(() => {
    if (!state?.url) return;
    linkExt?.deleteLink(state.range.from);
    closeModal();
  }, [linkExt, state, closeModal]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyLink();
      } else if (e.key === "Escape") {
        closeModal();
      }
    },
    [applyLink, closeModal]
  );

  // Ctrl+K / Cmd+K otvara modal
  useEffect(() => {
    const callback = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        if (state) {
          setShowModal(true);
          event.preventDefault();
        }
      }
    };
    editor?.domElement?.addEventListener("keydown", callback);
    return () => editor?.domElement?.removeEventListener("keydown", callback);
  }, [editor?.domElement, state]);

  if (state === undefined || !Components) return null;

  const isEditingLink = !!state.url;

  return (
    <>
      <Components.FormattingToolbar.Button
        label={isEditingLink ? "Uredi link" : "Dodaj link"}
        mainTooltip={isEditingLink ? "Uredi link" : "Dodaj link"}
        secondaryTooltip={formatKeyboardShortcut("Mod+K")}
        isSelected={showModal}
        onClick={() => setShowModal((o) => !o)}
        icon={<LinkIcon className="bn-button-icon" />}
      />
      <LinkEditModal
        isOpen={showModal}
        url={editUrl}
        text={state.text || ""}
        openInNewTab={editOpenInNewTab}
        suggestions={suggestions}
        suggestionsVisible={suggestionsVisible}
        onUrlChange={setEditUrl}
        onOpenInNewTabChange={setEditOpenInNewTab}
        onSuggestionSelect={(path) => {
          setEditUrl(path);
          setSuggestionsVisible(false);
        }}
        onSuggestionFocus={() => setSuggestionsVisible(suggestions.length > 0)}
        onConfirm={applyLink}
        onRemove={removeLink}
        onClose={closeModal}
        onKeyDown={handleKeyDown}
        hideRemoveButton={!isEditingLink}
      />
    </>
  );
}
