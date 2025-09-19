// src/components/ui/FlashToast.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function FlashToast() {
  const search = useSearchParams();
  const toast = search.get("toast"); // e.g. submitted|reopened|deleted
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(!!toast);

  useEffect(() => {
    if (!toast) return;
    setOpen(true);
    const t = setTimeout(() => {
      setOpen(false);
      // strip ?toast=... without adding history
      const params = new URLSearchParams(search.toString());
      params.delete("toast");
      router.replace(params.size ? `${pathname}?${params}` : pathname);
    }, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  if (!open || !toast) return null;

  const msg =
    toast === "submitted"
      ? "Intake marked as submitted."
      : toast === "reopened"
      ? "Intake reopened (back to Draft)."
      : toast === "deleted"
      ? "Project deleted."
      : "Action completed.";

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center">
      <div className="rounded-md border border-ink-200 bg-white px-4 py-2 shadow-card">
        <span className="text-sm">{msg}</span>
      </div>
    </div>
  );
}
