"use client";

// Client providers for the admin area: TanStack Query + sonner toasts.
// Mounted once from src/app/admin/layout.tsx (the root layout uses the radix
// toaster for the storefront; the admin area standardizes on sonner).

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 15_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-right" closeButton duration={5000} />
    </QueryClientProvider>
  );
}
