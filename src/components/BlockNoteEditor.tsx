"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core/extensions";
import { FilePanelExtension } from "@blocknote/core/extensions";
import { editorHasBlockWithType } from "@blocknote/core";
import {
  BlockNoteContext,
  FilePanelController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import TiptapLink from "@tiptap/extension-link";
import { RiContrast2Line, RiYoutubeFill } from "react-icons/ri";
import { Search } from "lucide-react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { CustomFormattingToolbar } from "./CustomFormattingToolbar";
import BlogBlockInspectorSidebar from "./BlogBlockInspectorSidebar";
import { BlogTablePresentationExtension } from "@/lib/blogTablePresentationExtension";
import { BlogFilePanel } from "./blocknote/BlogFilePanel";
import { FilePanelScrollLock } from "./blocknote/FilePanelScrollLock";
import { blogBlockNoteSchema } from "@/lib/blocknoteImageSchema";

interface BlockNoteEditorProps {
  content: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  /** Ako je proslijeđeno, prikazuje se tab Upload u panelu za slike */
  uploadFile?: (file: File) => Promise<string | Record<string, any>>;
}

export default function BlockNoteEditor({
  content,
  onChange,
  className = "",
  minHeight = "200px",
  uploadFile,
}: BlockNoteEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialContentLoaded = useRef(false);

  const useBlogSchema = !!uploadFile;
  const schema = useBlogSchema && blogBlockNoteSchema ? blogBlockNoteSchema : undefined;

  const editor = useCreateBlockNote(
    {
      ...(schema && { schema }),
      initialContent: [
        {
          type: "paragraph",
          content: [],
        },
      ],
      uploadFile,
      // Native BlockNote tablice: zaglavlja (pravi <th>) i spajanje/dijeljenje ćelija.
      // Resize stupaca povlačenjem i dodavanje/brisanje redova/stupaca dolaze kroz
      // default table handles. Zamjenjuje raniji ručni headerRow/columnWidths sloj.
      // Boje ćelija namjerno isključene: izvoze se kao imena boja (data-background-color),
      // pa bi trebale mapiranje cijele BlockNote palete na objavljenoj prose strani.
      tables: {
        headers: true,
        splitCells: true,
      },
      _tiptapOptions: {
        extensions: [
          TiptapLink.configure({
            openOnClick: false,
            HTMLAttributes: { rel: "noopener noreferrer" },
          }),
          ...(schema ? [BlogTablePresentationExtension] : []),
        ],
      },
    },
    [useBlogSchema]
  );

  const [contentReady, setContentReady] = useState(false);

  // Učitaj HTML sadržaj pri mountu (odgođeno da izbjegnemo flushSync unutar lifecycle-a)
  useEffect(() => {
    if (!editor || initialContentLoaded.current) return;
    const html = content?.trim();
    if (!html) {
      initialContentLoaded.current = true;
      setContentReady(true);
      return;
    }
    const id = setTimeout(() => {
      try {
        const blocks = editor.tryParseHTMLToBlocks(html);
        if (blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch {
        // Ako parsiranje ne uspije, ostavi default
      }
      initialContentLoaded.current = true;
      setContentReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, [editor, content]);

  useEffect(() => {
    if (!editor) return;
    const unsub = editor.onChange(() => {
      // blocksToHTMLLossy koristi toExternalHTML po bloku – bez curenja DOM-a iz React editora
      // (npr. prije/poslije: blocksToFullHTML bi u HTML ubacio gumb „Postavke klizača”).
      const html = editor.blocksToHTMLLossy(editor.document);
      onChangeRef.current?.(html);
    });
    return unsub;
  }, [editor]);

  // Spriječi otvaranje linka pri kliku – link se tretira kao tekst za uređivanje
  // TiptapLink openOnClick: false + fallback handler (mousedown i click) za sve preglednike
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const preventLinkNavigation = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!el.contains(target)) return;
      const element = target instanceof Element ? target : target.parentElement;
      if (element?.closest("a[href]")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("mousedown", preventLinkNavigation, true);
    el.addEventListener("click", preventLinkNavigation, true);
    return () => {
      el.removeEventListener("mousedown", preventLinkNavigation, true);
      el.removeEventListener("click", preventLinkNavigation, true);
    };
  }, []);

  // Custom slash menu items – default + YouTube + prije/poslije (blog schema)
  const getCustomSlashMenuItems = useCallback(() => {
    const defaultItems = getDefaultReactSlashMenuItems(editor);
    const imageIdx = defaultItems.findIndex(
      (i) => i.title?.toLowerCase().includes("image") || i.title === "Slika"
    );
    const insertAt = imageIdx >= 0 ? imageIdx + 1 : defaultItems.length;

    const extra: ReturnType<typeof getDefaultReactSlashMenuItems> = [];

    if (editorHasBlockWithType(editor, "youtubeEmbed")) {
      extra.push({
        title: "YouTube video",
        subtext: "Insert a YouTube link",
        aliases: ["youtube", "video", "embed"],
        group: "Media" as const,
        icon: <RiYoutubeFill size={18} />,
        onItemClick: () => {
          insertOrUpdateBlockForSlashMenu(editor, { type: "youtubeEmbed" as any });
        },
      });
    }

    if (editorHasBlockWithType(editor, "beforeAfter")) {
      extra.push({
        title: "Before / after",
        subtext: "Two-image comparison slider",
        aliases: ["before", "after", "slider", "usporedba", "prije", "poslije"],
        group: "Media" as const,
        icon: <RiContrast2Line size={18} />,
        onItemClick: () => {
          insertOrUpdateBlockForSlashMenu(editor, { type: "beforeAfter" as any });
        },
      });
    }

    if (editorHasBlockWithType(editor, "playerFilter")) {
      extra.push({
        title: "Filter galerije",
        subtext: "Filtriraj galeriju po imenu (as-you-type)",
        aliases: ["filter", "search", "igrac", "igrač", "pretraga", "trazi", "traži"],
        group: "Media" as const,
        icon: <Search size={18} />,
        onItemClick: () => {
          insertOrUpdateBlockForSlashMenu(editor, { type: "playerFilter" as any });
        },
      });
    }

    if (extra.length === 0) return defaultItems;
    return [
      ...defaultItems.slice(0, insertAt),
      ...extra,
      ...defaultItems.slice(insertAt),
    ];
  }, [editor]);

  const getSlashMenuItems = useCallback(
    async (query: string) =>
      filterSuggestionItems(getCustomSlashMenuItems(), query),
    [getCustomSlashMenuItems]
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!editor || !contentReady) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [editor, contentReady]);

  if (!editor) return null;

  const blogBlockNoteContextValue = useMemo(
    () =>
      ({
        editor,
        colorSchemePreference: "dark" as const,
      }) satisfies React.ComponentProps<typeof BlockNoteContext.Provider>["value"],
    [editor]
  );

  const editorChrome = (
    <BlockNoteView
      editor={editor}
      theme="dark"
      className={`bn-editor-dark ${useBlogSchema ? "bn-gutenberg-editor !rounded-none !border-0" : ""}`}
      linkToolbar={false}
      formattingToolbar={false}
      slashMenu={!useBlogSchema}
      filePanel={!useBlogSchema}
    >
      {mounted && useBlogSchema && (
        <>
          <FilePanelScrollLock />
          <FilePanelController
            filePanel={BlogFilePanel}
            floatingUIOptions={{
              elementProps: {
                "data-file-panel": "true",
              } as React.HTMLAttributes<HTMLDivElement>,
            }}
          />
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={getSlashMenuItems}
          />
        </>
      )}
      {mounted && <CustomFormattingToolbar />}
    </BlockNoteView>
  );

  return (
    <div
      ref={wrapperRef}
      className={`blocknote-editor-wrapper overflow-hidden rounded-2xl border border-zinc-800/90 shadow-xl shadow-black/20 dark ${
        useBlogSchema
          ? "bn-layout-gutenberg flex min-h-[300px] flex-col bg-zinc-950 lg:min-h-[20rem]"
          : "border-zinc-700 bg-zinc-800"
      } ${className}`}
      style={
        useBlogSchema
          ? {
              minHeight,
              height: "min(85vh, calc(100vh - 8rem))",
              maxHeight: "min(85vh, calc(100vh - 8rem))",
            }
          : { minHeight }
      }
      data-theme="dark"
    >
      {useBlogSchema ? (
        <BlockNoteContext.Provider value={blogBlockNoteContextValue}>
          <div className="blog-editor-split flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#0f0f12]">
              {editorChrome}
            </div>
            {mounted && (
              <div className="flex max-h-[42vh] min-h-0 w-full shrink-0 flex-col border-t border-zinc-800/90 lg:max-h-none lg:h-full lg:w-[min(100%,320px)] lg:max-w-[320px] lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
                <BlogBlockInspectorSidebar />
              </div>
            )}
          </div>
        </BlockNoteContext.Provider>
      ) : (
        editorChrome
      )}
    </div>
  );
}
