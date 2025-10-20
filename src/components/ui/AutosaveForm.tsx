// src/components/ui/AutosaveForm.tsx
"use client";

import * as React from "react";

type Status = "idle" | "saving" | "saved" | "error";

type Props = {
  /** The project this answer set belongs to */
  projectId: string;
  /** The autosaving form fields (inputs/selects/textareas) live inside children */
  children: React.ReactNode;
  /** Optional: debounce delay in ms (default 500) */
  debounceMs?: number;
  /** Optional: api endpoint (default /api/answers) */
  endpoint?: string;
};

/**
 * Wraps form fields and autosaves to /api/answers on change, with a small
 * floating status badge (“Saving… / Saved ✓ / Error”) in the top-right.
 *
 * How it works:
 * - On any input/select/textarea change, we debounce and POST a FormData payload:
 *   - projectId
 *   - Each field serialized as q_<questionId>=<value>
 * - The status badge animates between saving/saved/error states.
 */
export default function AutosaveForm({
  projectId,
  children,
  debounceMs = 500,
  endpoint = "/api/answers",
}: Props) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const timerRef = React.useRef<number | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");

  const save = React.useCallback(async () => {
    const form = formRef.current;
    if (!form) return;

    // Build FormData with projectId + all fields
    const fd = new FormData();
    fd.set("projectId", projectId);

    // We accept inputs, textareas and selects.
    const fields = form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input[name], textarea[name], select[name]");

    fields.forEach((el) => {
      const name = el.name;
      // We expect names shaped like q_<questionId>, but we’ll send anything present.
      // For checkboxes/radios, only include checked ones.
      if ((el as HTMLInputElement).type === "checkbox") {
        const cb = el as HTMLInputElement;
        if (cb.checked) fd.append(name, cb.value || "on");
        return;
      }
      if ((el as HTMLInputElement).type === "radio") {
        const rb = el as HTMLInputElement;
        if (rb.checked) fd.set(name, rb.value);
        return;
      }
      fd.set(name, el.value ?? "");
    });

    try {
      setStatus("saving");
      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        setStatus("error");
        // Surface more detail in console for debugging
        try {
          const j = await res.json();
          // eslint-disable-next-line no-console
          console.error("Autosave error", res.status, j);
        } catch {
          // eslint-disable-next-line no-console
          console.error("Autosave error", res.status);
        }
        return;
      }

      setStatus("saved");
      // Gently return to idle so the badge fades away
      window.setTimeout(() => setStatus("idle"), 1200);
    } catch (err) {
      setStatus("error");
      // eslint-disable-next-line no-console
      console.error("Autosave network error", err);
    }
  }, [endpoint, projectId]);

  // Debounced onChange handler
  const onAnyChange = React.useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    // Show “saving…” quickly to reassure the user
    setStatus((s) => (s === "saved" ? "saved" : "saving"));
    timerRef.current = window.setTimeout(save, debounceMs) as unknown as number;
  }, [debounceMs, save]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <form
      ref={formRef}
      // Use capture so we catch changes from any nested component
      onChange={onAnyChange}
      className="relative"
    >
      {/* Floating badge (top-right). aria-live for screen readers */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute right-0 -top-8 md:-top-9 flex h-6 items-center justify-end text-xs"
      >
        <StatusBadge status={status} />
      </div>

      {children}
    </form>
  );
}

/** Small, unobtrusive status badge */
function StatusBadge({ status }: { status: Status }) {
  // Keep it invisible when idle
  if (status === "idle") {
    return (
      <span className="opacity-0 transition-opacity duration-300 select-none">
        &nbsp;
      </span>
    );
  }

  if (status === "saving") {
    return (
      <span className="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-ink-900 px-2 py-0.5 text-[11px] font-medium text-white shadow">
        <Spinner className="h-3 w-3" />
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white shadow transition-opacity">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  }

  // error
  return (
    <span className="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white shadow">
      <Exclamation className="h-3 w-3" />
      Error
    </span>
  );
}

/* Minimal inline icons (no deps) */
function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.414l2.543 2.543 6.543-6.543a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Exclamation({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.593c.75 1.336-.21 2.996-1.742 2.996H3.481c-1.532 0-2.492-1.66-1.742-2.996L8.257 3.1zM10 13a1 1 0 100 2 1 1 0 000-2zm-1-6a1 1 0 012 0v3a1 1 0 01-2 0V7z"
        clipRule="evenodd"
      />
    </svg>
  );
}
