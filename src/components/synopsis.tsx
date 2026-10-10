"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Book synopsis. Long copy (> 400 chars) collapses to a few lines
 * with an expand/collapse toggle; short copy renders as-is.
 */
export function Synopsis({ text, clampChars = 400 }: { text: string; clampChars?: number }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > clampChars;

  if (!isLong) {
    return (
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{text}</p>
    );
  }

  return (
    <div>
      <p
        className={cn(
          "whitespace-pre-line text-[15px] leading-relaxed text-foreground/90",
          !open && "line-clamp-4"
        )}
      >
        {text}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 mt-1 h-10 gap-1.5 text-primary hover:text-primary"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "কম দেখুন" : "আরও পড়ুন"}
        <ChevronDown aria-hidden className={cn("size-4 transition-transform", open && "rotate-180")} />
      </Button>
    </div>
  );
}
