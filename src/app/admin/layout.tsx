"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { UnsavedChangesProvider, useUnsavedChanges } from "@/contexts/UnsavedChangesContext";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const unsaved = useUnsavedChanges();

  useEffect(() => {
    if (!unsaved?.hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsaved?.hasUnsavedChanges]);

  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (!isAdminRoute) {
    return <>{children}</>;
  }

  if (process.env.NODE_ENV === "production") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminSidebar />
      <main className="ml-56 min-h-screen flex-1">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (!isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <UnsavedChangesProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </UnsavedChangesProvider>
  );
}
