import Image from "next/image";
import { cn } from "@/lib/utils";
import { BookOpen, FileText, Package } from "lucide-react";

export const COVER_PATTERNS = ["oxblood", "sage", "ink", "clay", "mustard", "teal", "plum"] as const;
export type CoverPattern = (typeof COVER_PATTERNS)[number];

/**
 * Book cover with a consistent 2:3 aspect ratio.
 * Uses the uploaded cover image when present, otherwise renders a tasteful
 * CSS-generated demo cover (clearly treated as demo content).
 */
export function BookCover({
  title,
  author,
  coverImage,
  coverPattern = "oxblood",
  size = "md",
  className,
  priority = false,
}: {
  title: string;
  author?: string;
  coverImage?: string | null;
  coverPattern?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}) {
  const pattern = (COVER_PATTERNS as readonly string[]).includes(coverPattern) ? coverPattern : "oxblood";
  const titleSize = {
    sm: "text-[11px] leading-snug",
    md: "text-sm leading-snug",
    lg: "text-lg leading-snug",
    xl: "text-2xl leading-snug",
  }[size];
  const authorSize = {
    sm: "text-[9px]",
    md: "text-[11px]",
    lg: "text-sm",
    xl: "text-base",
  }[size];
  const pad = { sm: "p-2", md: "p-3", lg: "p-5", xl: "p-7" }[size];

  return (
    <div
      className={cn(
        "cover-pattern relative aspect-[2/3] w-full select-none",
        `cover-${pattern}`,
        className
      )}
    >
      {coverImage ? (
        <Image
          src={coverImage}
          alt={`${title}, প্রচ্ছদ`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div className={cn("relative z-10 flex h-full flex-col justify-between text-[#fdf8f5]", pad)}>
          <div className="flex items-center gap-1.5">
            <span className={cn("font-display font-semibold tracking-wide opacity-85", size === "sm" ? "text-[8px]" : "text-[10px]")}>
              পাতা
            </span>
            <span className={cn("h-px flex-1 bg-[#fdf8f5]/30", size === "sm" ? "opacity-50" : "")} />
          </div>
          <div>
            <p className={cn("font-bengali-serif font-semibold", titleSize)} style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>
              {title}
            </p>
            {author ? <p className={cn("mt-1.5 opacity-80 font-bengali", authorSize)}>{author}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}

/** Small format availability labels for product cards. */
export function FormatBadges({ formats, className }: { formats: string[]; className?: string }) {
  if (formats.length === 0) return null;
  const items = formats.map((f) => {
    switch (f) {
      case "physical":
        return { key: "physical", label: "হার্ড কপি", Icon: BookOpen };
      case "digital":
        return { key: "digital", label: "PDF", Icon: FileText };
      case "bundle":
        return { key: "bundle", label: "বান্ডেল", Icon: Package };
      default:
        return null;
    }
  }).filter(Boolean) as { key: string; label: string; Icon: typeof BookOpen }[];

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)} aria-label="উপলব্ধ ফরম্যাট">
      {items.map(({ key, label, Icon }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full border border-hairline bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          <Icon className="size-3" aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
