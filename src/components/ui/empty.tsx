// src/components/Empty.tsx
import { cn } from "@/lib/utils";

export default function Empty({
  title = "Nothing here yet",
  subtitle,
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border bg-white p-10 text-center text-ink-700",
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-ink-100 mb-3" />
      <p className="font-medium">{title}</p>
      {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
    </div>
  );
}
