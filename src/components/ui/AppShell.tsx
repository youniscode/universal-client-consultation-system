// src/components/ui/AppShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onClients = pathname?.startsWith("/clients");

  return (
    <div className="min-h-dvh bg-[radial-gradient(80rem_40rem_at_50%_-10%,#eef2ff_0%,transparent_60%)]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-ink-200/50 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="inline-block h-5 w-5 rounded bg-gradient-to-br from-brand-500 to-indigo-600" />
              <span>UCCS</span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/clients"
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition",
                  onClients
                    ? "bg-ink-900 text-white"
                    : "border border-ink-200 hover:bg-ink-50"
                )}
              >
                Clients →
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Page content */}
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
