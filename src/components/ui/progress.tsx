"use client";

type ProgressProps = {
  value: number; // 0..100
  label?: string | null;
};

export default function Progress({ value, label }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-70">{label}</span>
          {/* Some editors falsely flag tabular-nums; it's fine */}
          <span className="tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}

      {/* Native control = no ARIA warnings, fully accessible */}
      <progress
        className="w-full h-2 [&::-webkit-progress-bar]:rounded [&::-webkit-progress-value]:rounded
                   [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-black
                   transition-[width] duration-300"
        value={Math.round(pct)}
        max={100}
        aria-label={label ?? "progress"}
      />
    </div>
  );
}
