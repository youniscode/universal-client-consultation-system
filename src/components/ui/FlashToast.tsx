// src/components/ui/FlashToast.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Reads ?toast=<code> from the URL and shows a small, transient banner.
 * After ~2.6s it removes the query param via router.replace (no extra history entry).
 *
 * Supported codes (edit as you like):
 *  - submitted  -> "Intake marked as submitted."
 *  - reopened   -> "Intake reopened (back to Draft)."
 *  - deleted    -> "Project deleted."
 *  - (fallback) -> "Action completed."
 */
export default function FlashToast() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const toastCode = search.get("toast"); // e.g. submitted|reopened|deleted
  const [open, setOpen] = useState(Boolean(toastCode));

  // Map code -> message (memoized so the banner doesn't re-render unnecessarily)
  const msg = useMemo(() => {
    switch (toastCode) {
      case "submitted":
        return "Intake marked as submitted.";
      case "reopened":
        return "Intake reopened (back to Draft).";
      case "deleted":
        return "Project deleted.";
      default:
        return toastCode ? "Action completed." : null;
    }
  }, [toastCode]);

  useEffect(() => {
    if (!toastCode) return;

    setOpen(true);

    const t = window.setTimeout(() => {
      setOpen(false);

      // Strip ?toast=... without adding to history stack
      const params = new URLSearchParams(search.toString());
      params.delete("toast");
      const url = params.size ? `${pathname}?${params}` : pathname;
      router.replace(url);
    }, 2600);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastCode]);

  if (!open || !msg) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center">
      <div
        className="rounded-md border border-ink-200 bg-white px-4 py-2 shadow-card
                   animate-[fadeIn_.16s_ease-out] will-change-[opacity,transform]"
        role="status"
        aria-live="polite"
      >
        <span className="text-sm">{msg}</span>
      </div>
      {/* tiny keyframes for a subtle pop */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes fadeIn{from{opacity:.001;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}",
        }}
      />
    </div>
  );
}
