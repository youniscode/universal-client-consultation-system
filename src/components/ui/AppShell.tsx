// src/components/ui/AppShell.tsx
import Link from "next/link";
import Image from "next/image";
import AuthControls from "./AuthControls";

// NOTE: No "use client" here — this stays a Server Component
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink-50/40 text-ink-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-ink-200">
        <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <Image
              src="/logo.svg" // keep a file at public/logo.svg (optional)
              alt="UCCS"
              width={20}
              height={20}
              className="rounded-sm"
              priority
            />
            <span>UCCS</span>
          </Link>

          {/* Server component that can read cookies via next/headers */}
          <AuthControls />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
