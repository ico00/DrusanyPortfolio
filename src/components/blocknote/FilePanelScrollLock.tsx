"use client";

/**
 * Kad je File Panel otvoren: onemogućuje scroll, prikazuje backdrop, centrira panel kao modal.
 */
import { FilePanelExtension } from "@blocknote/core/extensions";
import { useExtensionState } from "@blocknote/react";
import { createPortal } from "react-dom";
import { useEffect } from "react";

export function FilePanelScrollLock() {
  const blockId = useExtensionState(FilePanelExtension);

  useEffect(() => {
    if (!blockId) return;
    document.body.setAttribute("data-file-panel-open", "true");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.removeAttribute("data-file-panel-open");
      document.body.style.overflow = prev || "";
    };
  }, [blockId]);

  if (!blockId) return null;

  return createPortal(
    <div
      className="file-panel-backdrop"
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 89,
        backdropFilter: "blur(2px)",
      }}
    />,
    document.body
  );
}
