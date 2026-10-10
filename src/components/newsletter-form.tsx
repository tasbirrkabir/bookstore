"use client";

import { useState } from "react";
import { Loader2, MailCheck, ArrowRight } from "lucide-react";

/**
 * Newsletter subscribe form for the home page band.
 * Posts to /api/newsletter; success and errors are shown inline.
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
            ? "flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3.5 text-sm text-[#eef4ea]"
            : "flex items-center gap-3 rounded-xl bg-forest-soft px-4 py-3.5 text-sm text-forest-deep"
        }
      >
        <MailCheck aria-hidden className="size-5 shrink-0 text-forest" />
        <p>ধন্যবাদ! নতুন বই আর অফারের খবর সবার আগে পাবেন।</p>
      </div>
    );
  }

  const inputClass =
    tone === "onDark"
      ? "h-12 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-sm text-white placeholder:text-white/50 outline-none transition-colors focus:border-white/50"
      : "h-12 flex-1 rounded-full border border-border bg-card px-5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-forest/50";

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <div className="flex flex-col gap-2.5 sm:flex-row">
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
          className={
            tone === "onDark"
              ? "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f2f4ea] px-7 text-sm font-semibold text-forest-deep transition-colors hover:bg-white disabled:opacity-60"
              : "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-forest px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-forest-deep disabled:opacity-60"
          }
        >
          {state === "busy" ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden className="size-4" />
          )}
          সাবস্ক্রাইব
        </button>
      </div>
      {state === "error" && message ? (
        <p role="alert" className={
          tone === "onDark" ? "text-xs font-medium text-[#f0c9b5]" : "text-xs font-medium text-press-deep"
        }>
          {message}
        </p>
      ) : (
        <p className={tone === "onDark" ? "text-xs text-white/55" : "text-xs text-muted-foreground"}>
          শুধু বই আর পড়ার খবর, বাড়তি মেইল নয়।
        </p>
      )}
    </form>
  );
}
