"use client";

import * as React from "react";

type ProgressProps = {
  value: number; // 0..100
  label?: string | null; // e.g., "23/23 answered"
  id?: string;
};

export default function Progress({ value, label, id }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const autoId = React.useId();
  const htmlId = id ?? autoId;

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={htmlId}>
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-70">{label}</span>
            <span className="tabular-nums">{Math.round(pct)}%</span>
          </div>
        </label>
      ) : null}

      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800/40">
        {/* semantic progress for a11y; hide native track */}
        <progress id={htmlId} value={pct} max={100} className="sr-only" />
        {/* visual bar */}
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-400 ease-out dark:bg-brand-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
