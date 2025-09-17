// src/components/ui/card.tsx
import { cn } from "@/lib/utils";

export default function Card(
  props: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }
) {
  const { className, hover = true, ...rest } = props;
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200/70 bg-white shadow-[0_1px_2px_rgb(16_24_40/0.04)]",
        hover &&
          "transition hover:shadow-[0_12px_24px_-10px_rgb(16_24_40/0.18)]",
        className
      )}
      {...rest}
    />
  );
}
