// src/components/ui/AppShell.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { PropsWithChildren, useState } from "react";
import LogoutButton from "@/components/ui/LogoutButton";

export default function AppShell({ children }: PropsWithChildren) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="min-h-dvh bg-ink-50/40 text-ink-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-ink-200">
        <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
          {/* Left side: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            {imgOk ? (
              <Image
                src="/logo.svg" // make sure public/logo.svg exists
                alt="UCCS"
                width={20}
                height={20}
                className="rounded-sm"
                priority
                onError={() => setImgOk(false)}
              />
            ) : (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-brand-500 text-white text-[10px] font-bold">
                UC
              </span>
            )}
            <span>UCCS</span>
          </Link>

          {/* Right side: Navigation + Logout */}
          <nav className="flex items-center gap-3">
            <Link
              href="/clients"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-ink-50 transition"
            >
              Clients →
            </Link>

            <LogoutButton
              label="Logout"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition"
            />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
