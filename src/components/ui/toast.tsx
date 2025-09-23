// src/components/ui/toast.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type Variant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: Variant;
  duration?: number; // ms
};

function variantClasses(variant: Variant = "info") {
  switch (variant) {
    case "success":
      return "bg-emerald-600 text-white";
    case "error":
      return "bg-rose-600 text-white";
    default:
      return "bg-ink-900 text-white";
  }
}

/**
 * Toaster
 * - Listens for: window.dispatchEvent(new CustomEvent('toast', { detail: { title, description, variant, duration } }))
 * - Renders a small stacked viewport (bottom-right)
 */
export default function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    const onToast = (e: Event) => {
      const ce = e as CustomEvent<Omit<ToastItem, "id"> | undefined>;
      const detail = ce.detail ?? {};
      const id = Math.random().toString(36).slice(2, 9);

      const item: ToastItem = {
        id,
        title: detail.title ?? "",
        description: detail.description ?? "",
        variant: detail.variant ?? "info",
        duration: detail.duration ?? 2600,
      };

      setToasts((prev) => [...prev, item]);

      // auto-remove
      const timeout = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, item.duration);

      // Clean up if unmounted before timeout fires
      return () => window.clearTimeout(timeout);
    };

    window.addEventListener("toast", onToast as EventListener);
    return () => window.removeEventListener("toast", onToast as EventListener);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[380px] max-w-[92vw] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg px-4 py-3 shadow-lg ring-1 ring-black/5
                      animate-[toastIn_.18s_ease-out] ${variantClasses(
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

      {/* keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes toastIn{from{opacity:.001;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}",
        }}
      />
    </div>,
    document.body
  );
}

/**
 * Convenience helper for client code:
 *   toast({ title: "Saved", description: "Project updated", variant: "success" })
 */
export function toast(detail: Omit<ToastItem, "id">) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("toast", { detail }));
}

/**
 * FlashToastOnLoad: emit a one-shot toast when a page loads.
 * Useful with `?toast=` query params surfaced by server components.
 */
export function FlashToastOnLoad({
  message,
  variant = "success",
  duration = 2600,
}: {
  message?: string | null;
  variant?: Variant;
  duration?: number;
}) {
  React.useEffect(() => {
    if (!message) return;
    toast({ title: message, variant, duration });
  }, [message, variant, duration]);
  return null;
}
