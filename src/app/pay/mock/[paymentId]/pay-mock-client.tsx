"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Loader2,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ToastHost } from "@/components/toast-host";
import { formatBdt } from "@/lib/money";

type Phase = "idle" | "processing-success" | "processing-fail" | "failed";

export function PayMockClient({
  paymentId,
  paymentStatus,
  orderNumber,
  amountMinor,
  currency,
  merchantName,
}: {
  paymentId: string;
  paymentStatus: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  merchantName: string;
}) {
  const [method, setMethod] = useState("bkash");
  const [phase, setPhase] = useState<Phase>("idle");

  const alreadyPaid = paymentStatus === "paid";

  /** Order URL with the guest capability token from this tab's session storage (if any). */
  function orderUrl(): string {
    let url = `/order/${orderNumber}`;
    try {
      const t = sessionStorage.getItem(`pata_gt:${orderNumber}`);
      if (t) url += `?t=${encodeURIComponent(t)}`;
    } catch {
      /* storage unavailable */
    }
    return url;
  }

  async function complete(outcome: "success" | "fail") {
    setPhase(outcome === "success" ? "processing-success" : "processing-fail");
    try {
      const res = await fetch("/api/payments/mock/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, outcome, method }),
      });
      const data = (await res.json()) as { ok: boolean; redirectUrl?: string; error?: string };

      if (outcome === "success") {
        if (res.ok && data.ok && data.redirectUrl) {
          // Append the guest token (kept from checkout) so a guest lands on their order page.
          let url = data.redirectUrl;
          try {
            const t = sessionStorage.getItem(`pata_gt:${orderNumber}`);
            if (t) url += (url.includes("?") ? "&" : "?") + `t=${encodeURIComponent(t)}`;
          } catch {
            /* storage unavailable */
          }
          window.location.href = url;
          return;
        }
        toast.error(data.error ?? "পেমেন্ট সম্পন্ন করা যায়নি।");
        setPhase("failed");
        return;
      }

      // Simulated failure: the verifier rejects the callback and marks the payment
      // failed server-side, the API answers 400 by design.
      setPhase("failed");
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা, গেটওয়ে অনুরোধ পাঠানো যায়নি।");
      setPhase("idle");
    }
  }

  const busy = phase === "processing-success" || phase === "processing-fail";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <ToastHost />

      {/* Simulated-gateway banner, must never look like the real store */}
      <div className="mb-5 flex items-start gap-2.5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <p className="text-sm leading-6 text-warning-foreground">
          <span className="font-semibold">এটি একটি সিমুলেটেড পেমেন্ট গেটওয়ে, শুধুমাত্র ডেভেলপমেন্ট ডেমো।</span>{" "}
          কোনো প্রকৃত টাকা লেনদেন হয় না; পেমেন্ট ফলাফল সার্ভারে সিগনেচার-যাচাইয়ের মাধ্যমে নিশ্চিত হয়।
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border-2 border-dashed border-hairline bg-card">
        {/* Gateway header strip */}
        <div className="hairline-b bg-muted px-5 py-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Mock Gateway · DEMO ONLY
          </p>
          <p className="mt-0.5 font-display text-lg font-semibold">{merchantName}</p>
        </div>

        {alreadyPaid ? (
          <div className="px-5 py-8 text-center">
            <BadgeCheck className="mx-auto size-10 text-success" aria-hidden />
            <h1 className="mt-3 font-display text-xl font-semibold">পেমেন্ট ইতিমধ্যে সম্পন্ন</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              এই পেমেন্ট অনুরোধটি আগেই যাচাই ও নিশ্চিত হয়েছে।
            </p>
            <Button asChild className="mt-5 h-11">
              <Link href={orderUrl()}>অর্ডার পেজে যান <ArrowRight className="size-4" aria-hidden /></Link>
            </Button>
          </div>
        ) : phase === "failed" ? (
          <div className="px-5 py-8 text-center">
            <XCircle className="mx-auto size-10 text-destructive" aria-hidden />
            <h1 className="mt-3 font-display text-xl font-semibold">পেমেন্ট ব্যর্থ হয়েছে (সিমুলেটেড)</h1>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
              ব্যর্থ ফলাফল সার্ভারে যাচাই হয়ে অর্ডারে নথিভুক্ত হয়েছে। অর্ডারটি এখনো পরিশোধিত হয়নি, আবার চেষ্টা করতে পারেন।
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Button className="h-11" onClick={() => setPhase("idle")}>
                আবার চেষ্টা করুন
              </Button>
              <Button asChild variant="outline" className="h-11">
                <Link href={orderUrl()}>অর্ডার পেজে ফিরুন</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              অর্ডার পেজ দেখতে গেস্ট লিঙ্ক বা লগইন প্রয়োজন হতে পারে।
            </p>
          </div>
        ) : (
          <div className="px-5 py-6">
            <dl className="font-mono text-sm">
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-muted-foreground">অর্ডার নম্বর</dt>
                <dd className="font-semibold">{orderNumber}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-muted-foreground">পরিমাণ</dt>
                <dd className="font-semibold">{formatBdt(amountMinor)} <span className="text-xs text-muted-foreground">{currency}</span></dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-muted-foreground">পেমেন্ট আইডি</dt>
                <dd className="max-w-40 truncate text-xs">{paymentId}</dd>
              </div>
            </dl>

            <Separator className="my-4 bg-hairline" />

            <p className="text-sm font-semibold">পেমেন্ট পদ্ধতি (ডেমো, কোনো তথ্য চাওয়া হয় না)</p>
            <RadioGroup
              value={method}
              onValueChange={setMethod}
              className="mt-3 grid gap-2.5"
              aria-label="সিমুলেটেড পেমেন্ট পদ্ধতি"
            >
              {[
                { id: "bkash", label: "bKash", Icon: Smartphone },
                { id: "nagad", label: "Nagad", Icon: Wallet },
                { id: "card", label: "কার্ড (ভিসা/মাস্টারকার্ড)", Icon: CreditCard },
              ].map(({ id, label, Icon }) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-hairline px-3.5 py-3 transition-colors has-[data-state=checked]:border-primary"
                >
                  <RadioGroupItem value={id} />
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="font-mono text-sm">{label}</span>
                </label>
              ))}
            </RadioGroup>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              এই ডেমো গেটওয়ে কোনো অ্যাকাউন্ট নম্বর, পিন বা ওটিপি চায় না, বাটনে চাপ দিলেই ফলাফল সার্ভারে যাচাই হয়।
            </p>

            <div className="mt-6 grid gap-2.5">
              <Button
                className="h-11 w-full"
                disabled={busy}
                onClick={() => void complete("success")}
              >
                {phase === "processing-success" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> যাচাই হচ্ছে…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" aria-hidden /> পেমেন্ট সফল করুন
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full"
                disabled={busy}
                onClick={() => void complete("fail")}
              >
                {phase === "processing-fail" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> পাঠানো হচ্ছে…
                  </>
                ) : (
                  "পেমেন্ট ব্যর্থ করুন"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
        ক্রেতা: {merchantName} · এই পেজটি প্রকৃত পেমেন্ট প্রসেসিং নয়, <Link href="/" className="underline underline-offset-4">দোকানে ফিরুন</Link>
      </p>
    </div>
  );
}
