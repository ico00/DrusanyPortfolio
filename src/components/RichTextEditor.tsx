"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, FontSize, Color } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import { useEffect, useImperativeHandle, forwardRef, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Minus,
} from "lucide-react";

export interface RichTextEditorRef {
  getHTML: () => string;
  setContent: (html: string) => void;
}

interface RichTextEditorProps {
  content: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

// Preset boje – zinc paleta + amber (Drusany stil)
const presetColors = [
  { value: "#fafafa", name: "Bijela" },
  { value: "#e4e4e7", name: "Svijetlo siva" },
  { value: "#a1a1aa", name: "Srednje siva" },
  { value: "#71717a", name: "Tamnija siva" },
  { value: "#52525b", name: "Zinc 500" },
  { value: "#3f3f46", name: "Zinc 600" },
  { value: "#27272a", name: "Zinc 800" },
  { value: "#18181b", name: "Zinc 900" },
  { value: "#fbbf24", name: "Amber 400" },
  { value: "#f59e0b", name: "Amber 500" },
  { value: "#d97706", name: "Amber 600" },
  { value: "#22c55e", name: "Zelena" },
  { value: "#3b82f6", name: "Plava" },
  { value: "#8b5cf6", name: "Ljubičasta" },
  { value: "#ec4899", name: "Roza" },
];

const fontSizes = [
  { value: "12px", label: "Mali" },
  { value: "14px", label: "Normalni" },
  { value: "16px", label: "Srednji" },
  { value: "18px", label: "Veći" },
  { value: "20px", label: "Veliki" },
  { value: "24px", label: "Jako veliki" },
  { value: "28px", label: "Naslov" },
  { value: "32px", label: "Veliki naslov" },
];

const headingOptions = [
  { value: "p", label: "Paragraf" },
  { value: "h1", label: "Naslov 1" },
  { value: "h2", label: "Naslov 2" },
  { value: "h3", label: "Naslov 3" },
  { value: "h4", label: "Naslov 4" },
];

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    {
      content,
      onChange,
      placeholder,
      className = "",
      minHeight = "200px",
    },
    ref
  ) {
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const [isHeadingOpen, setIsHeadingOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("https://");
    const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(true);
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [isFontSizeModalOpen, setIsFontSizeModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [linkSuggestions, setLinkSuggestions] = useState<
      { path: string; title: string; label: string }[]
    >([]);
    const [linkSuggestionsVisible, setLinkSuggestionsVisible] = useState(false);
    const headingDropdownRef = useRef<HTMLDivElement>(null);
    const linkInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit,
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-amber-400 underline hover:text-amber-300",
          },
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        FontSize,
        Color,
        Image.configure({
          HTMLAttributes: { class: "max-w-full h-auto rounded-lg" },
        }),
      ],
      content,
      editorProps: {
        attributes: {
          class:
            "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-zinc-200 [&_h1]:text-zinc-100 [&_h2]:text-zinc-100 [&_h3]:text-zinc-100 [&_h4]:text-zinc-100 [&_p]:text-zinc-200 [&_li]:text-zinc-200 [&_a]:text-amber-400 [&_a]:underline [&_a:hover]:text-amber-300 placeholder:text-zinc-500",
        },
      },
      onUpdate: ({ editor }) => {
        onChangeRef.current?.(editor.getHTML());
      },
    });

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }, [content, editor]);

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? "",
      setContent: (html: string) =>
        editor?.commands.setContent(html, { emitUpdate: false }),
    }));

    // Zatvori heading dropdown kad se klikne izvan
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          headingDropdownRef.current &&
          !headingDropdownRef.current.contains(e.target as Node)
        ) {
          setIsHeadingOpen(false);
        }
      };
      if (isHeadingOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isHeadingOpen]);

    // Učitaj blog i pages za predloške linkova
    useEffect(() => {
      if (!isLinkModalOpen) {
        setLinkSuggestions([]);
        setLinkSuggestionsVisible(false);
        return;
      }
      Promise.all([
        fetch("/api/blog", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/pages", { cache: "no-store" }).then((r) => r.json()),
      ])
        .then(([blogData, pagesData]) => {
          const items: { path: string; title: string; label: string }[] = [];
          if (Array.isArray(blogData)) {
            blogData.forEach((p: { id: string; title: string }) => {
              items.push({ path: `/blog/${p.id}`, title: p.title, label: "Blog" });
            });
          }
          if (pagesData?.about?.html) {
            items.push({ path: "/about", title: "About", label: "Stranica" });
          }
          if (pagesData?.contact?.html) {
            items.push({ path: "/contact", title: "Contact", label: "Stranica" });
          }
          setLinkSuggestions(items.slice(0, 12));
        })
        .catch(() => setLinkSuggestions([]));
    }, [isLinkModalOpen]);

    // Filtriraj predloške linkova dok korisnik tipka
    useEffect(() => {
      if (!isLinkModalOpen) return;
      const q = linkUrl
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\/*/, "")
        .replace(/^\/*/, "");
      if (!q) {
        setLinkSuggestionsVisible(linkSuggestions.length > 0);
        return;
      }
      fetch("/api/blog", { cache: "no-store" })
        .then((r) => r.json())
        .then((blogData) => {
          const all: { path: string; title: string; label: string }[] = [];
          if (Array.isArray(blogData)) {
            blogData.forEach((p: { id: string; title: string }) => {
              all.push({ path: `/blog/${p.id}`, title: p.title, label: "Blog" });
            });
          }
          all.push({ path: "/about", title: "About", label: "Stranica" });
          all.push({ path: "/contact", title: "Contact", label: "Stranica" });
          const filtered = all
            .filter(
              (item) =>
                item.path.toLowerCase().includes(q) ||
                item.title.toLowerCase().includes(q) ||
                item.label.toLowerCase().includes(q)
            )
            .slice(0, 12);
          setLinkSuggestions(filtered);
          setLinkSuggestionsVisible(filtered.length > 0);
        })
        .catch(() => {});
    }, [linkUrl, isLinkModalOpen]);

    const getSelectedHeading = () => {
      if (!editor) return "p";
      for (let i = 1; i <= 4; i++) {
        if (editor.isActive("heading", { level: i })) return `h${i}`;
      }
      return "p";
    };

    const handleLink = () => {
      const { from, to } = editor?.state.selection ?? {};
      if (from === undefined || to === undefined || from === to) return;
      const attrs = editor?.getAttributes("link");
      if (attrs?.href) {
        setLinkUrl(attrs.href);
      } else {
        setLinkUrl("https://");
      }
      setIsLinkModalOpen(true);
      setTimeout(() => linkInputRef.current?.focus(), 100);
    };

    const confirmLink = () => {
      const url = linkUrl.trim();
      if (!url || url === "https://") {
        setIsLinkModalOpen(false);
        return;
      }
      editor
        ?.chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url, target: linkOpenInNewTab ? "_blank" : null })
        .run();
      if (!editor?.isActive("link")) {
        editor
          ?.chain()
          .focus()
          .setLink({
            href: url,
            target: linkOpenInNewTab ? "_blank" : null,
          })
          .run();
      }
      setIsLinkModalOpen(false);
    };

    const removeLink = () => {
      editor?.chain().focus().unsetLink().run();
      setIsLinkModalOpen(false);
    };

    const closeLinkModal = () => {
      setIsLinkModalOpen(false);
    };

    const openColorModal = () => {
      const attrs = editor?.getAttributes("textStyle");
      setIsColorModalOpen(true);
    };

    const confirmColor = (color: string) => {
      editor?.chain().focus().setColor(color).run();
      setIsColorModalOpen(false);
    };

    const openFontSizeModal = () => {
      setIsFontSizeModalOpen(true);
    };

    const confirmFontSize = (size: string) => {
      editor?.chain().focus().setFontSize(size).run();
      setIsFontSizeModalOpen(false);
    };

    const confirmImage = () => {
      const url = imageUrl.trim();
      if (url) {
        editor?.chain().focus().setImage({ src: url }).run();
      }
      setIsImageModalOpen(false);
      setImageUrl("");
    };

    if (!editor) return null;

    const btn = (active: boolean) =>
      `rounded px-2 py-1.5 text-sm transition-colors ${
        active
          ? "bg-amber-500/20 text-amber-400"
          : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
      }`;

    return (
      <div
        className={`rounded-lg border border-zinc-700 bg-zinc-800/50 ${className}`}
        style={{ minHeight }}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-700 p-2">
          {/* Heading dropdown */}
          <div ref={headingDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsHeadingOpen(!isHeadingOpen)}
              className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm ${btn(false)}`}
            >
              <Type className="h-4 w-4" />
              <span>
                {headingOptions.find((h) => h.value === getSelectedHeading())
                  ?.label ?? "Stil"}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isHeadingOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isHeadingOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-zinc-600 bg-zinc-800 py-1 shadow-xl">
                {headingOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (opt.value === "p") {
                        editor.chain().focus().setParagraph().run();
                      } else {
                        editor
                          .chain()
                          .focus()
                          .toggleHeading({
                            level: parseInt(opt.value[1] ?? "1") as 1 | 2 | 3 | 4,
                          })
                          .run();
                      }
                      setIsHeadingOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-700 ${
                      getSelectedHeading() === opt.value
                        ? "bg-amber-500/20 text-amber-400"
                        : "text-zinc-300"
                    }`}
                  >
                    {opt.label}
                    {getSelectedHeading() === opt.value && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-zinc-600" />

          {/* Bold, Italic, Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btn(editor.isActive("bold"))}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btn(editor.isActive("italic"))}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={btn(editor.isActive("underline"))}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-zinc-600" />

          {/* Alignment */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={btn(editor.isActive({ textAlign: "left" }))}
            title="Lijevo"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={btn(editor.isActive({ textAlign: "center" }))}
            title="Centrirano"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={btn(editor.isActive({ textAlign: "right" }))}
            title="Desno"
          >
            <AlignRight className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-zinc-600" />

          {/* Font size */}
          <button
            type="button"
            onClick={openFontSizeModal}
            className={btn(false)}
            title="Veličina fonta"
          >
            <Type className="h-4 w-4" />
          </button>
          {/* Color */}
          <button
            type="button"
            onClick={openColorModal}
            className={btn(editor.isActive("textStyle"))}
            title="Boja teksta"
          >
            <Palette className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-zinc-600" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={btn(editor.isActive("bulletList"))}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={btn(editor.isActive("orderedList"))}
            title="Numerirana lista"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={btn(false)}
            title="Horizontalna crta"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-zinc-600" />

          {/* Link */}
          <button
            type="button"
            onClick={handleLink}
            className={btn(editor.isActive("link"))}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>

          {/* Image */}
          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className={btn(false)}
            title="Dodaj sliku"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="[&_.ProseMirror]:text-zinc-200 [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror_h1]:text-zinc-100 [&_.ProseMirror_h2]:text-zinc-100 [&_.ProseMirror_h3]:text-zinc-100 [&_.ProseMirror_h4]:text-zinc-100 [&_.ProseMirror_p]:text-zinc-200 [&_.ProseMirror_li]:text-zinc-200 [&_.ProseMirror.ProseMirror-empty::before]:text-zinc-500">
          <EditorContent editor={editor} />
        </div>

        {/* Link Modal */}
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeLinkModal}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-600 bg-zinc-800 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                    <LinkIcon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">
                    {editor.isActive("link") ? "Uredi link" : "Dodaj link"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeLinkModal}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative mb-4">
                <label className="mb-2 block text-sm font-medium text-zinc-400">
                  URL adresa
                </label>
                <input
                  ref={linkInputRef}
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onFocus={() =>
                    linkSuggestions.length > 0 && setLinkSuggestionsVisible(true)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmLink();
                    } else if (e.key === "Escape") closeLinkModal();
                  }}
                  placeholder="https://... ili /blog ili /about"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {linkSuggestionsVisible && linkSuggestions.length > 0 && (
                  <ul
                    className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-zinc-600 bg-zinc-800 py-1"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {linkSuggestions.map((item) => (
                      <li key={`${item.label}-${item.path}`}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setLinkUrl(item.path);
                            setLinkSuggestionsVisible(false);
                          }}
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
                          <span className="text-xs text-zinc-500">
                            {item.path}
                          </span>
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
                    checked={linkOpenInNewTab}
                    onChange={(e) => setLinkOpenInNewTab(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-amber-500"
                  />
                  <ExternalLink className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-300">
                    Otvori u novom tabu
                  </span>
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeLinkModal}
                    className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                  >
                    Odustani
                  </button>
                  <button
                    type="button"
                    onClick={confirmLink}
                    className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-amber-400"
                  >
                    {editor.isActive("link") ? "Spremi" : "Dodaj link"}
                  </button>
                </div>
                {editor.isActive("link") && (
                  <button
                    type="button"
                    onClick={removeLink}
                    className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/30"
                  >
                    Ukloni link
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Color Modal */}
        {isColorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsColorModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-xs rounded-xl border border-zinc-600 bg-zinc-800 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-100">
                  Boja teksta
                </h3>
                <button
                  type="button"
                  onClick={() => setIsColorModalOpen(false)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {presetColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => confirmColor(c.value)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-zinc-600 transition-all hover:border-amber-500 hover:scale-110"
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Font Size Modal */}
        {isFontSizeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsFontSizeModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-xs rounded-xl border border-zinc-600 bg-zinc-800 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-100">
                  Veličina fonta
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFontSizeModalOpen(false)}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {fontSizes.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => confirmFontSize(s.value)}
                    className="rounded-lg border border-zinc-600 bg-zinc-700/50 px-3 py-2 text-left text-sm text-zinc-200 hover:border-amber-500 hover:bg-amber-500/10"
                    style={{ fontSize: s.value }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {isImageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setIsImageModalOpen(false);
                setImageUrl("");
              }}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-600 bg-zinc-800 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                    <ImageIcon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100">
                    Dodaj sliku
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setImageUrl("");
                  }}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <label className="mb-2 block text-sm font-medium text-zinc-400">
                URL slike
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmImage();
                  if (e.key === "Escape") {
                    setIsImageModalOpen(false);
                    setImageUrl("");
                  }
                }}
                placeholder="https://... ili /uploads/..."
                className="mb-4 w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setImageUrl("");
                  }}
                  className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                >
                  Odustani
                </button>
                <button
                  type="button"
                  onClick={confirmImage}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-amber-400"
                >
                  Dodaj
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default RichTextEditor;
