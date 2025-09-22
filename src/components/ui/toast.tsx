// src/components/ui/toast.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: "success" | "error" | "info";
  duration?: number; // ms
};

function variantClasses(variant: ToastItem["variant"]) {
  switch (variant) {
    case "success":
      return "bg-emerald-600 text-white";
    case "error":
      return "bg-red-600 text-white";
    default:
      return "bg-ink-900 text-white";
  }
}

/**
 * Toaster
 * - Listens for `window.dispatchEvent(new CustomEvent('toast', { detail: { title, description, variant, duration } }))`
 * - Renders a small stack bottom-right
 */
export default function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    function onToast(e: Event) {
      const ce = e as CustomEvent<Omit<ToastItem, "id">>;
      const id = Math.random().toString(36).slice(2, 9);
      const item: ToastItem = {
        id,
        title: ce.detail?.title ?? "",
        description: ce.detail?.description ?? "",
        variant: ce.detail?.variant ?? "info",
        duration: ce.detail?.duration ?? 2600,
      };
      setToasts((prev) => [...prev, item]);

      // auto-remove
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, item.duration);
    }

    window.addEventListener("toast", onToast as EventListener);
    return () => window.removeEventListener("toast", onToast as EventListener);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[380px] max-w-[92vw] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg px-4 py-3 shadow-lg ${variantClasses(
            t.variant
          )}`}
          role="status"
          aria-live="polite"
        >
          {t.title ? (
            <div className="text-sm font-medium">{t.title}</div>
          ) : null}
          {t.description ? (
            <div className="mt-0.5 text-xs/5 opacity-90">{t.description}</div>
          ) : null}
        </div>
      ))}
    </div>,
    document.body
  );
}

/**
 * Convenience helper (optional)
 * Call from client code: toast({ title: "...", description: "...", variant: "success" })
 */
export function toast(detail: Omit<ToastItem, "id">) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("toast", { detail }));
}

/**
 * FlashToastOnLoad: show a toast if `message` is provided (e.g. from searchParams in server component)
 */
export function FlashToastOnLoad({
  message,
  variant = "success",
}: {
  message?: string | null;
  variant?: ToastItem["variant"];
}) {
  React.useEffect(() => {
    if (!message) return;
    toast({ title: message, variant, duration: 2600 });
  }, [message, variant]);
  return null;
}
