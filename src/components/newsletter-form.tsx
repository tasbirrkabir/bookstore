"use client";

import { useState } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";

/**
 * Newsletter subscribe form for the home page band.
 * Posts to /api/newsletter; success and errors are shown inline.
 */
export function NewsletterForm() {
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
      <div className="flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3.5 text-sm text-[#f0e3bd]">
        <MailCheck aria-hidden className="size-5 shrink-0 text-[#e3c06b]" />
        <p>ধন্যবাদ! নতুন বই আর অফারের খবর সবার আগে পাবেন।</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
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
          className="h-11 flex-1 rounded-md border border-white/25 bg-white/10 px-3.5 text-sm text-[#f7f2e2] placeholder:text-[#f7f2e2]/50 outline-none transition focus:border-[#e3c06b] focus:bg-white/15"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#e3c06b] px-6 text-sm font-bold text-forest-deep transition hover:bg-[#eed48a] disabled:opacity-60"
        >
          {state === "busy" ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Send aria-hidden className="size-4" />
          )}
          সাবস্ক্রাইব
        </button>
      </div>
      {state === "error" && message ? (
        <p role="alert" className="text-xs font-medium text-[#f4b8a8]">
          {message}
        </p>
      ) : (
        <p className="text-xs text-[#f7f2e2]/55">শুধু বই আর পড়ার খবর, বাড়তি মেইল নয়।</p>
      )}
    </form>
  );
}
