// src/components/ui/StatusPill.tsx
"use client";

import { ProjectStatus } from "@prisma/client";
import clsx from "clsx";

export default function StatusPill({ status }: { status: ProjectStatus }) {
  const isSubmitted = status === "SUBMITTED";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isSubmitted
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      )}
      title={isSubmitted ? "Submitted" : "Draft"}
    >
      {isSubmitted ? "Submitted" : "Draft"}
    </span>
  );
}
