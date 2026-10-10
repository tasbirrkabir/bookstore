import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 md:py-28">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-accent-foreground">
        <BookOpen aria-hidden className="size-7" />
      </div>
      <p className="mt-6 text-sm font-semibold tracking-[0.2em] text-muted-foreground">৪০৪</p>
      <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
        পাতা হারিয়ে ফেলেছেন?
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        ঠিকানাটি বদলে গিয়ে থাকতে পারে, অথবা পাতাটি আর নেই। নিচে বই খুঁজে দেখুন, অথবা দোকানে ফিরে
        যান।
      </p>
      <form
        action="/shop"
        method="get"
        role="search"
        className="mt-8 flex w-full max-w-md items-center gap-2"
      >
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            name="q"
            aria-label="বই খুঁজুন"
            placeholder="বই, লেখক বা ISBN লিখুন…"
            className="h-12 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <Button type="submit" className="h-12 px-6">
          খুঁজুন
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="outline" className="h-11 bg-card px-6">
          <Link href="/">হোম</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 bg-card px-6">
          <Link href="/shop">সব বই</Link>
        </Button>
      </div>
    </div>
  );
}
