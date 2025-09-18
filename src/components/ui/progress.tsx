// src/components/ui/progress.tsx
"use client";

import { useId } from "react";

type ProgressProps = {
  value: number; // 0..100
  label?: string | null;
  id?: string;
};

export default function Progress({ value, label, id }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  // Call the hook unconditionally, then coalesce
  const generatedId = useId();
  const htmlId = id ?? generatedId;

  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-70">{label}</span>
          {/* Tailwind utility `tabular-nums` is valid; some linters don’t know it */}
          <span className="tabular-nums">{Math.round(pct)}%</span>
        </div>
      ) : null}

      {/* Native progress (hidden track for a11y), custom visual bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200/60 dark:bg-ink-800/40">
        <progress
          id={htmlId}
          value={pct}
          max={100}
          className="sr-only"
          aria-label={label ?? "Progress"}
        />
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#4c78ff_0%,#7c5cff_60%,#a855f7_100%)] transition-[width] duration-400 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
