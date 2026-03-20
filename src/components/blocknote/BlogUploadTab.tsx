"use client";

/**
 * Upload tab s drag-and-drop + postojeći file input (BlockNote PanelFileInput).
 * Logika uploada ista kao @blocknote/react UploadTab.
 */
import type {
  BlockSchema,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";
import type { FilePanelProps } from "@blocknote/react";
import { useBlockNoteEditor, useComponentsContext, useDictionary } from "@blocknote/react";
import { useCallback, useEffect, useRef, useState } from "react";

function fileMatchesAccept(file: File, accept: string): boolean {
  if (!accept || accept === "*/*") return true;
  const parts = accept.split(",").map((s) => s.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  for (const p of parts) {
    if (p.startsWith(".")) {
      if (name.endsWith(p)) return true;
    } else if (p.endsWith("/*")) {
      const prefix = p.slice(0, -2);
      if (type.startsWith(`${prefix}/`)) return true;
    } else if (type === p) {
      return true;
    }
  }
  return false;
}

type BlogUploadTabProps = FilePanelProps & {
  setLoading: (loading: boolean) => void;
};

export const BlogUploadTab = <
  B extends BlockSchema = DefaultBlockSchema,
  I extends InlineContentSchema = DefaultInlineContentSchema,
  S extends StyleSchema = DefaultStyleSchema,
>(
  props: BlogUploadTabProps
) => {
  const Components = useComponentsContext()!;
  const dict = useDictionary();
  const { setLoading } = props;
  const editor = useBlockNoteEditor<B, I, S>();
  const block = editor.getBlock(props.blockId)!;
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const openNativeFilePicker = useCallback(() => {
    const input = dropzoneRef.current?.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;
    input?.click();
  }, []);

  useEffect(() => {
    if (uploadFailed) {
      const t = setTimeout(() => setUploadFailed(false), 3000);
      return () => clearTimeout(t);
    }
  }, [uploadFailed]);

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (file === null) return;

      async function upload(f: File) {
        setLoading(true);
        if (editor.uploadFile !== undefined) {
          try {
            let updateData = await editor.uploadFile(f, props.blockId);
            if (typeof updateData === "string") {
              updateData = {
                props: {
                  name: f.name,
                  url: updateData,
                },
              };
            }
            editor.updateBlock(props.blockId, updateData);
          } catch {
            setUploadFailed(true);
          } finally {
            setLoading(false);
          }
        }
      }

      void upload(file);
    },
    [props.blockId, editor, setLoading]
  );

  const spec = editor.schema.blockSpecs[block.type];
  const accept = spec.implementation.meta?.fileBlockAccept?.length
    ? spec.implementation.meta.fileBlockAccept.join(",")
    : "*/*";

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (!fileMatchesAccept(file, accept)) return;
      handleFileChange(file);
    },
    [accept, handleFileChange]
  );

  return (
    <Components.FilePanel.TabPanel className="bn-tab-panel">
      <div
        ref={dropzoneRef}
        className={`bn-upload-dropzone rounded-lg border border-dashed px-4 py-5 transition-colors ${
          isDragging
            ? "border-amber-400/90 bg-zinc-700/40"
            : "border-zinc-600 bg-zinc-900/25"
        }`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <button
          type="button"
          className="mb-3 w-full cursor-pointer rounded-md bg-transparent text-center text-sm text-zinc-300 hover:text-zinc-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-400/80"
          onClick={openNativeFilePicker}
        >
          Drag and drop file here or{" "}
          <span className="font-medium underline decoration-zinc-500 underline-offset-2">
            Choose file
          </span>
        </button>
        <Components.FilePanel.FileInput
          className="bn-file-input"
          data-test="upload-input"
          accept={accept}
          placeholder={
            dict.file_panel.upload.file_placeholder[block.type] ||
            dict.file_panel.upload.file_placeholder["file"]
          }
          value={null}
          onChange={handleFileChange}
        />
      </div>
      {uploadFailed && (
        <div className="bn-error-text">{dict.file_panel.upload.upload_error}</div>
      )}
    </Components.FilePanel.TabPanel>
  );
};
