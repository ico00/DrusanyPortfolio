"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { ADMIN_UI } from "@/data/adminUI";

interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean;
  setUnsavedChanges: (value: boolean) => void;
  confirmUnsaved: () => Promise<boolean>;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setUnsavedChangesState] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const setUnsavedChanges = useCallback((value: boolean) => {
    setUnsavedChangesState(value);
  }, []);

  const confirmUnsaved = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setShowConfirmModal(true);
    });
  }, []);

  const handleConfirm = useCallback((leave: boolean) => {
    resolveRef.current?.(leave);
    resolveRef.current = null;
    setShowConfirmModal(false);
  }, []);

  useEffect(() => {
    if (!showConfirmModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleConfirm(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirmModal, handleConfirm]);

  return (
    <UnsavedChangesContext.Provider value={{ hasUnsavedChanges, setUnsavedChanges, confirmUnsaved }}>
      {children}
      {showConfirmModal && (
        <div
          className={ADMIN_UI.modal.overlay}
          onClick={() => handleConfirm(false)}
        >
          <div
            className={ADMIN_UI.modal.card}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={ADMIN_UI.modal.title}>
              {ADMIN_UI.confirmModal.title}
            </h3>
            <p className={ADMIN_UI.modal.body}>
              {ADMIN_UI.confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                className={ADMIN_UI.buttons.secondary}
              >
                {ADMIN_UI.confirmModal.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                className={ADMIN_UI.buttons.primary}
              >
                {ADMIN_UI.confirmModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const ctx = useContext(UnsavedChangesContext);
  return ctx;
}
