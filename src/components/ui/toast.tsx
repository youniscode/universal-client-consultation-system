"use client";

import { useEffect } from "react";
import { toast, Toaster } from "sonner";

type Variant = "success" | "error" | "info";

type Props = {
  /** message to show (if falsy, does nothing) */
  message?: string;
  /** toast style; defaults to "success" when omitted */
  variant?: Variant;
};

/**
 * Fire a one-shot toast on mount.
 * Use: <FlashToastOnLoad message="Saved!" variant="success" />
 */
export default function FlashToastOnLoad({ message, variant }: Props) {
  useEffect(() => {
    if (!message) return;
    const v: Variant = variant ?? "success";
    if (v === "success") toast.success(message);
    else if (v === "error") toast.error(message);
    else toast.info(message);
  }, [message, variant]);

  // no visible UI
  return null;
}

/** Optional: export a colocated Toaster so pages/layouts can render it. */
export function AppToaster() {
  return <Toaster richColors position="top-right" />;
}
