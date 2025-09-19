// src/components/ui/empty-state.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode; // e.g., a <Link> or <button>
  className?: string;
};

export default function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-white/60 p-10 text-center",
        className
      )}
    >
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-600">
        {/* simple sparkles icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2l1.8 3.8L18 7.6l-3.2 2.5.9 4-3.7-2.3L8.3 14l.9-4L6 7.6l4.2-1.8L12 2zM4 18l.9 1.9L7 21l-1.6 1.2L5 24l-1-1.8L2 21l1.9-.2L4 18zm14-2l1.3 2.8L22 20l-2.7 1 .7 2.9L18 22.3 16 24l.8-3L14 20l2.8-.2L18 16z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </svg>
      </div>

      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-ink-600">{description}</p>
      )}

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
