"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-3xl font-semibold">বইয়ের তালিকা দেখানো গেল না</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        ক্যাটালগ লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন, সমস্যা থেকে গেলে কিছুক্ষণ পরে আসবেন।
      </p>
      <Button onClick={reset} size="lg" className="mt-6 h-12 px-7">
        আবার চেষ্টা করুন
      </Button>
    </div>
  );
}
