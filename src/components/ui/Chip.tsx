// src/components/ui/Chip.tsx
"use client";

type ChipProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
};

export default function Chip({ children, title, className = "" }: ChipProps) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center rounded-md border border-ink-200/70",
        "bg-ink-50/40 px-2 py-0.5 text-xs text-ink-700",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
