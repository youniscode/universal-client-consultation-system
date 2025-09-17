// src/components/ui/select.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export default function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-md border bg-white px-3 py-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
}
