"use client";

import { useState } from "react";
import { Loader2, MailCheck, ArrowRight } from "lucide-react";

/**
 * Newsletter subscribe form for the home page band.
 * Posts to /api/newsletter; success and errors are shown inline.
 * Single-row pill with an embedded round submit button.
 * tone="onDark" adapts colors for the deep green newsletter band.
 */
export function NewsletterForm({ tone = "light" }: { tone?: "light" | "onDark" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "সাবস্ক্রিপশন নেওয়া যায়নি, আবার চেষ্টা করুন।");
        return;
      }
      setState("done");
      setEmail("");
    } catch {
      setState("error");
      setMessage("সংযোগে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
  }

  if (state === "done") {
    return (
      <div
        className={
          tone === "onDark"
            ? "flex items-center gap-3 rounded-full bg-white/10 py-3.5 pl-5 pr-6 text-sm text-[#eef4ea]"
            : "flex items-center gap-3 rounded-full bg-forest-soft py-3.5 pl-5 pr-6 text-sm text-forest-deep"
        }
      >
        <MailCheck aria-hidden className="size-5 shrink-0 text-forest" />
        <p>ধন্যবাদ! নতুন বই আর অফারের খবর সবার আগে পাবেন।</p>
      </div>
    );
  }

  const inputClass =
    tone === "onDark"
      ? "h-14 w-full rounded-full border border-white/20 bg-white/10 pl-5 pr-16 text-sm text-white placeholder:text-white/50 outline-none transition-colors focus:border-white/55"
      : "h-14 w-full rounded-full border border-border bg-card pl-5 pr-16 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-forest/50";

  const submitClass =
    tone === "onDark"
      ? "absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#f2f4ea] text-forest-deep transition-colors hover:bg-white disabled:opacity-60"
      : "absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-forest text-primary-foreground transition-colors hover:bg-forest-deep disabled:opacity-60";

  return (
    <form onSubmit={onSubmit} className="space-y-2.5" noValidate>
      <div className="relative">
        <label htmlFor="newsletter-email" className="sr-only">
          ইমেইল ঠিকানা
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="আপনার ইমেইল ঠিকানা"
          autoComplete="email"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={state === "busy"}
          aria-label="সাবস্ক্রাইব করুন"
          className={submitClass}
        >
          {state === "busy" ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden className="size-[18px]" />
          )}
        </button>
      </div>
      {state === "error" && message ? (
        <p role="alert" className="pl-2 text-xs font-medium text-press-deep">
          {message}
        </p>
      ) : (
        <p className={tone === "onDark" ? "pl-2 text-xs text-white/55" : "pl-2 text-xs text-muted-foreground"}>
          শুধু বই আর পড়ার খবর, বাড়তি মেইল নয়।
        </p>
      )}
    </form>
  );
}
