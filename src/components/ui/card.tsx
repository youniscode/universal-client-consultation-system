// src/components/ui/card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * If true, adds a tiny lift on hover (for clickable cards/lists).
   */
  hoverable?: boolean;
};

export default function Card({ className, hoverable, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-card",
        hoverable && "transition hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}
