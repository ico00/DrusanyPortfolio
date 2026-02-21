"use client";

import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { StaticBlockTypeBar } from "./StaticBlockTypeBar";

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

  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: [],
      },
    ],
    uploadFile,
  });

  // Učitaj HTML sadržaj pri mountu
  useEffect(() => {
    if (!editor || initialContentLoaded.current) return;
    const html = content?.trim();
    if (!html) {
      initialContentLoaded.current = true;
      return;
    }
    try {
      const blocks = editor.tryParseHTMLToBlocks(html);
      if (blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks);
      }
    } catch {
      // Ako parsiranje ne uspije, ostavi default
    }
    initialContentLoaded.current = true;
  }, [editor, content]);

  useEffect(() => {
    if (!editor) return;
    const unsub = editor.onChange(() => {
      const html = editor.blocksToHTMLLossy(editor.document);
      onChangeRef.current?.(html);
    });
    return unsub;
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={`blocknote-editor-wrapper rounded-lg border border-zinc-700 bg-zinc-800 dark ${className}`}
      style={{ minHeight }}
      data-theme="dark"
    >
      <BlockNoteView
        editor={editor}
        theme="dark"
        className="bn-editor-dark bn-has-static-toolbar"
      >
        <StaticBlockTypeBar />
      </BlockNoteView>
    </div>
  );
}
