// src/components/ui/StatusPill.tsx
"use client";

import { ProjectStatus } from "@prisma/client";

type Props = {
  status: ProjectStatus;
  className?: string;
};

const MAP: Partial<Record<ProjectStatus, { label: string; cls: string }>> = {
  DRAFT: {
    label: "Draft",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  SUBMITTED: {
    label: "Submitted",
    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  // If you add more statuses later, put them here:
  // ACTIVE: { label: "Active", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
};

export default function StatusPill({ status, className = "" }: Props) {
  const cfg = MAP[status] ?? {
    label: status, // fallback label is the enum value
    cls: "bg-ink-100 text-ink-700 ring-1 ring-ink-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls} ${className}`}
      aria-label={`Project status: ${cfg.label}`}
    >
      {cfg.label}
    </span>
  );
}
