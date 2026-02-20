/**
 * Centralizirane opcije za Admin UI
 *
 * Ovdje se nalaze svi stringovi, CSS klase i poruke za admin panel.
 * Uredi ovaj dokument da promijeniš izgled ili tekstove na jednom mjestu.
 *
 * Povezani fajlovi:
 * - src/app/globals.css – .rdp-admin-dark (kalendar), [data-theme="dark"] (BlockNote)
 * - src/components/DatePicker.tsx – ADMIN_UI.datePicker
 * - src/components/DateTimePicker.tsx – isto
 * - src/contexts/UnsavedChangesContext.tsx – ADMIN_UI.confirmModal, modal, buttons
 * - src/components/AdminBlog.tsx – toast, duplicate modal (hrvatski)
 * - src/components/AdminClient.tsx – toast, duplicate modal (engleski)
 * - src/components/AdminPages.tsx – toast
 * - src/components/BlockNoteErrorBoundary.tsx – editorError, buttons
 */

export const ADMIN_UI = {
  // ─── Modal overlay i kartica (confirm, duplicate, itd.) ───
  modal: {
    overlay: "fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/90 p-4",
    overlayZ50: "fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4",
    card: "w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl",
    cardWide: "w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl",
    title: "mb-3 text-lg font-semibold text-zinc-200",
    titleMb4: "mb-4 text-lg font-semibold text-zinc-200",
    body: "mb-6 text-sm text-zinc-400",
    bodyMb4: "mb-4 text-sm text-zinc-500",
  },

  // ─── Gumbi u modalu ───
  buttons: {
    secondary: "rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700",
    primary: "rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-500",
    neutral: "rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600",
    danger: "rounded-lg bg-red-600/80 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600",
  },

  // ─── Toast (success/error) ───
  toast: {
    container: "fixed bottom-6 right-6 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg",
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    text: "text-sm font-medium",
  },

  // ─── Confirm modal (unsaved changes) ───
  confirmModal: {
    title: "Unsaved changes",
    message: "You have unsaved changes. Are you sure you want to leave?",
    cancel: "Cancel",
    confirm: "Leave",
  },

  // ─── DatePicker / DateTimePicker / kalendar ───
  datePicker: {
    placeholder: "Select date",
    placeholderDateTime: "Select date and time",
    wrapperClass: "rdp-admin-dark",
    dropdownClass: "absolute left-0 top-full z-50 mt-1 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl",
    triggerClass: "flex w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-left text-zinc-100 transition-colors hover:border-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500",
  },

  // ─── Duplicate modal (blog & portfolio gallery) ───
  duplicateModal: {
    titlePrefix: "Duplicate:",
    titleSuffix: "already exists in gallery",
    question: "How would you like to proceed?",
    newLabel: "New (upload)",
    existingLabel: "Existing in gallery",
    overwrite: "Overwrite",
    overwriteAll: "Overwrite all",
    addSuffix: "Add as _2",
    addAllSuffix: "Add all as _2",
    cancel: "Cancel (skip)",
    cancelAll: "Skip all",
  },

  // ─── BlockNote error boundary ───
  editorError: {
    message: "The editor closed due to an error. Content is saved – you can save the post or reload the editor.",
    retry: "Reload editor",
  },

  // ─── Common messages (errors, success) ───
  messages: {
    // Blog
    blogSaveSuccess: "Post updated.",
    blogSaveError: "Update failed.",
    blogCreateSuccess: "Post created.",
    blogCreateError: "Create failed.",
    blogDeleteSuccess: "Post deleted.",
    blogDeleteError: "Delete failed.",
    blogDeleteConfirm: "Delete this post?",
    featuredUploadSuccess: "Featured image uploaded. Click Save to persist.",
    uploadError: "Upload failed.",
    slugDateRequired: "Enter title and save the post before uploading.",
    dateRequired: "Enter date before uploading.",
    imageFormatError: "Select images (JPEG, PNG, WebP or GIF).",
    // Pages
    pagesSaveSuccess: "Pages saved.",
    pagesSaveError: "Failed to save pages.",
    // Gallery
    selectImagesFirst: "Select images before submitting.",
    reorderSuccess: "Order saved.",
    reorderError: "Error saving.",
  },

  // ─── Admin blog labels & aria ───
  blog: {
    dragReorder: "Drag to reorder",
    select: "Select",
    deselect: "Deselect",
    featuredImage: "Featured image",
    setFeatured: "Set as featured",
    removeImage: "Remove image",
    newPost: "New post",
    editPost: "Edit post",
    featuredPost: "Featured post",
    removeFromFeatured: "Remove from featured",
    addToFeatured: "Add to featured",
    showsInWidget: "Shows in featured widget",
    selectCategories: "Select categories",
    enterDateTitle: "Enter date and title before upload. Images go to",
    clickForFocus: "Click on image to set focus point",
    orSelectFromGrid: "or select from grid:",
    removeFeatured: "Remove featured image",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    selectedCount: (n: number) => `${n} selected`,
    applyToSelected: "Apply to selected",
    deleteSelected: "Delete selected",
    clickSaveToPersist: "Click Save (above) to persist changes. Then run",
    clickSaveSuffix: "to see changes on the page.",
    selectedImages: (n: number) => `Selected images: ${n}`,
    newImages: "New images",
    clickOrDrag: "Click or drag images",
    addToGallery: (n?: number) => (n ? `Add ${n} to gallery` : "Add to gallery"),
    delete: "Delete",
    createPost: "Create post",
    save: "Save",
    noFeaturedFilter: "Showing only posts without featured image",
    noPostsFilter: "No posts match the filters.",
    noPostsYet: 'No posts yet. Click "New post" to create.',
    imageAdded: (n: number) => (n === 1 ? "Image added to gallery." : `${n} images added to gallery.`),
    rateLimit: (uploaded: number, total: number, remaining: number) =>
      `Rate limit – ${uploaded} of ${total} uploaded. Wait a minute and click upload again for the remaining ${remaining} images.`,
    fileNotDeleted: "File was not deleted from disk – try again.",
    deleteFailed: (n: number) => `${n} file(s) could not be deleted from disk.`,
    removedFromGallery: "Images removed from gallery.",
    appliedTo: (n: number) => `Applied to ${n} image(s). Click Save to persist.`,
    title: "Title",
    postTitlePlaceholder: "Post title",
    galleryLabel: "Post gallery",
    enterDateTitleBefore: "Enter date and title before upload. Images go to",
    removeFeaturedImage: "Remove featured image",
    titleForSelected: "Title (for selected)",
    descriptionForSelected: "Description (for selected)",
    titlePlaceholder: "e.g. Advent in Zagreb",
    descriptionPlaceholder: "e.g. Main square, December 2025",
    allDates: "All dates",
    blogPosts: "Blog posts",
    content: "Content",
    date: "Date",
    time: "Time",
    draftHint: "Not shown publicly",
    publishedHint: "Visible on blog",
    deleteImagesConfirm: (n: number) => `Delete ${n} image(s)?`,
  },

  // ─── Media (admin media list) ───
  mediaBulk: {
    selectAll: "Select all",
    selectPage: "Select page",
    deselectAll: "Deselect all",
    selectedCount: (n: number) => `${n} selected`,
    deleteSelected: "Delete selected",
    downloadSelected: "Download selected",
    copyUrls: "Copy URLs",
    detachSelected: "Detach selected",
    detachConfirm: (n: number) => `Detach ${n} image(s) from all usages? Files will remain on disk.`,
  },

  media: {
    searchPlaceholder: "Search images...",
    uploadDate: "Upload date",
    detach: "Detach",
    detachConfirm: "Detach from",
    detachSuccess: "Detached.",
    detachError: "Detach failed.",
    delete: "Delete",
    download: "Download",
    copyUrl: "Copy URL",
    urlCopied: "URL copied",
    deleteConfirm: "Delete this file? References in gallery/blog/pages may break.",
    deleteSuccess: "File deleted.",
    deleteError: "Delete failed.",
    downloadError: "Download failed.",
  },
} as const;
