import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Shared editorial prose wrapper for static content / policy pages:
 * breadcrumb-ish header, serif title, hairline separators, max-w-prose body.
 */
export function PolicyPage({
  title,
  subtitle,
  section = "সহায়তা",
  updated,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Crumb label of the parent area (e.g. "সহায়তা" / "নীতিমালা") */
  section?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <nav aria-label="পথনির্দেশ" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">হোম</Link>
        <ChevronRight className="size-3" aria-hidden />
        <span>{section}</span>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground/80" aria-current="page">{title}</span>
      </nav>

      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-prose text-[15px] leading-7 text-muted-foreground">{subtitle}</p> : null}
        {updated ? <p className="mt-2 text-xs text-muted-foreground">সর্বশেষ হালনাগাদ: {updated}</p> : null}
      </header>

      <div className="hairline-t mt-8 pt-8">
        <div className="max-w-prose space-y-8">{children}</div>
      </div>
    </div>
  );
}

/** A titled section inside a policy page. */
export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-foreground/90">{children}</div>
    </section>
  );
}
