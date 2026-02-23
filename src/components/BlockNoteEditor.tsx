"use client";

import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import TiptapLink from "@tiptap/extension-link";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { FloatingBlockTypeBar } from "./FloatingBlockTypeBar";
import { CustomFormattingToolbar } from "./CustomFormattingToolbar";
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
      _tiptapOptions: {
        extensions: [
          TiptapLink.configure({
            openOnClick: false,
            HTMLAttributes: { rel: "noopener noreferrer" },
          }),
        ],
      },
    },
    [useBlogSchema]
  );

  // Učitaj HTML sadržaj pri mountu (odgođeno da izbjegnemo flushSync unutar lifecycle-a)
  useEffect(() => {
    if (!editor || initialContentLoaded.current) return;
    const html = content?.trim();
    if (!html) {
      initialContentLoaded.current = true;
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
    }, 0);
    return () => clearTimeout(id);
  }, [editor, content]);

  useEffect(() => {
    if (!editor) return;
    const unsub = editor.onChange(() => {
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

  if (!editor) return null;

  return (
    <div
      ref={wrapperRef}
      className={`blocknote-editor-wrapper rounded-lg border border-zinc-700 bg-zinc-800 dark ${className}`}
      style={{ minHeight }}
      data-theme="dark"
    >
      <BlockNoteView
        editor={editor}
        theme="dark"
        className="bn-editor-dark"
        linkToolbar={false}
        formattingToolbar={false}
      >
        <FloatingBlockTypeBar />
        <CustomFormattingToolbar />
      </BlockNoteView>
    </div>
  );
}
