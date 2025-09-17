// src/components/ui/label.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export default function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-ink-800", className)}
      {...props}
    />
  );
}
