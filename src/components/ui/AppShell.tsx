// src/components/ui/AppShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  { href: "/clients", label: "Clients" },
  // you can add: { href: "/projects", label: "Projects" }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            UCCS
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {nav.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "px-2 py-1 rounded-md hover:bg-muted",
                    active && "bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container py-8">{children}</main>
    </div>
  );
}
