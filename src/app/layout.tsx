// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";
import Toaster from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "UCCS",
  description: "Universal Client Consultation System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ink-50/60 text-ink-900 antialiased">
        <AppShell>{children}</AppShell>
        {/* Floating toast stack (safe in layout) */}
        <Toaster />
      </body>
    </html>
  );
}
