"use client";

import { Toaster } from "@/components/ui/sonner";

/**
 * Mounts the sonner toast viewport. The global layout mounts the legacy Radix
 * toaster, so client pages that use `toast("sonner")` render this host once
 * inside their own tree.
 */
export function ToastHost() {
  return <Toaster position="top-center" richColors closeButton duration={4500} />;
}
