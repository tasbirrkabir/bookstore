"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
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
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 md:py-28">
      <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">সমস্যা</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
        কিছু একটা ভুল হয়েছে
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        অপ্রত্যাশিত একটি সমস্যায় পাতাটি দেখানো গেল না। আবার চেষ্টা করুন — সমস্যা থেকে গেলে কিছুক্ষণ
        পরে আবার আসবেন।
      </p>
      <Button onClick={reset} size="lg" className="mt-7 h-12 px-7">
        আবার চেষ্টা করুন
      </Button>
      <Link
        href="/"
        className="mt-4 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        হোমপেজে ফিরে যান
      </Link>
    </div>
  );
}
