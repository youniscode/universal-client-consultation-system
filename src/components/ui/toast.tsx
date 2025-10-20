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

function iconFor(variant: ToastItem["variant"]) {
  const base = "h-4 w-4";
  switch (variant) {
    case "success":
      return (
        <svg viewBox="0 0 20 20" className={`${base}`} aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L9 10.94 7.28 9.22a.75.75 0 1 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z"
          />
        </svg>
      );
    case "error":
      return (
        <svg viewBox="0 0 20 20" className={`${base}`} aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-5a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm1-8a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 10 5Z"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className={`${base}`} aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 2a8 8 0 1 0 .001 16.001A8 8 0 0 0 10 2Zm1 12H9v-2h2v2Zm0-3H9V6h2v5Z"
          />
        </svg>
      );
  }
}

function classesFor(variant: ToastItem["variant"]) {
  switch (variant) {
    case "success":
      return {
        wrap: "border-emerald-300/70 bg-white text-emerald-900",
        pill: "bg-emerald-500",
        icon: "text-emerald-600",
        close: "hover:text-emerald-700",
        progress: "bg-emerald-500/80",
      };
    case "error":
      return {
        wrap: "border-red-300/70 bg-white text-red-900",
        pill: "bg-red-500",
        icon: "text-red-600",
        close: "hover:text-red-700",
        progress: "bg-red-500/85",
      };
    default:
      return {
        wrap: "border-blue-300/70 bg-white text-blue-900",
        pill: "bg-blue-500",
        icon: "text-blue-600",
        close: "hover:text-blue-700",
        progress: "bg-blue-500/85",
      };
  }
}

/** Toaster: listens for `window.dispatchEvent(new CustomEvent('toast', { detail }))` */
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
        duration: ce.detail?.duration ?? 3200,
      };
      setToasts((prev) => [...prev, item]);

      const t = window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, item.duration);

      return () => window.clearTimeout(t);
    }

    window.addEventListener("toast", onToast as EventListener);
    return () => window.removeEventListener("toast", onToast as EventListener);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[380px] max-w-[94vw] flex-col gap-3">
        {toasts.map((t) => {
          const c = classesFor(t.variant);
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto overflow-hidden rounded-xl border shadow-xl backdrop-blur-sm animate-toast-in ${c.wrap}`}
            >
              <div className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 ${c.icon}`}>{iconFor(t.variant)}</div>
                <div className="min-w-0 flex-1">
                  {t.title ? (
                    <div className="text-sm font-medium">{t.title}</div>
                  ) : null}
                  {t.description ? (
                    <div className="mt-1 text-xs/5 text-ink-600">
                      {t.description}
                    </div>
                  ) : null}
                </div>
                <button
                  aria-label="Dismiss"
                  onClick={() =>
                    setToasts((prev) => prev.filter((x) => x.id !== t.id))
                  }
                  className={`rounded-md p-1 text-ink-500 transition ${c.close}`}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M6.28 6.28a.75.75 0 0 1 1.06 0L10 8.94l2.66-2.66a.75.75 0 1 1 1.06 1.06L11.06 10l2.66 2.66a.75.75 0 1 1-1.06 1.06L10 11.06l-2.66 2.66a.75.75 0 1 1-1.06-1.06L8.94 10 6.28 7.34a.75.75 0 0 1 0-1.06Z"
                    />
                  </svg>
                </button>
              </div>

              {/* progress bar */}
              <div
                className={`h-1 w-full ${c.progress} animate-toast-progress`}
                style={{ animationDuration: `${t.duration}ms` }}
              />
            </div>
          );
        })}
      </div>

      {/* local keyframes for enter + progress */}
      <style jsx global>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-toast-in {
          animation: toast-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes toast-progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
        .animate-toast-progress {
          transform-origin: left;
          animation-name: toast-progress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </>,
    document.body
  );
}

export function toast(detail: Omit<ToastItem, "id">) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("toast", { detail }));
}

/** Show a toast once on mount if `message` provided (server → client bridge). */
export function FlashToastOnLoad({
  message,
  variant = "success",
}: {
  message?: string | null;
  variant?: ToastItem["variant"];
}) {
  const shownFor = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!message) return;

    // prevent duplicate toasts (StrictMode double-invoke, remounts, back/forward)
    if (shownFor.current === message) return;
    shownFor.current = message;

    toast({ title: message, variant, duration: 3200 });

    // after showing once, strip ?toast= from the URL so it can't fire again
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("toast")) {
        url.searchParams.delete("toast");
        window.history.replaceState({}, "", url);
      }
    } catch {
      /* no-op */
    }
  }, [message, variant]);

  return null;
}
