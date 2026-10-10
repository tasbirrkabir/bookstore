"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastHost } from "@/components/toast-host";

export function TrackForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!orderNumber.trim() || !contact.trim()) {
      setError("অর্ডার নম্বর ও (ইমেইল অথবা মোবাইল) দিন।");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), contact: contact.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; redirectUrl?: string; error?: string };
      if (res.ok && data.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }
      setError(data.error ?? "এই তথ্যে কোনো অর্ডার মেলেনি। অর্ডার নম্বর ও যোগাযোগের তথ্য যাচাই করুন।");
    } catch {
      setError("নেটওয়ার্ক সমস্যা — একটু পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <ToastHost />

      <div className="rounded-lg border border-hairline bg-card p-6 sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-full bg-sage-soft">
          <PackageSearch className="size-6 text-sage" aria-hidden />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">অর্ডার ট্র্যাক করুন</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          অর্ডার নম্বর ও (ইমেইল অথবা মোবাইল) দিন — মিলে গেলে অর্ডার পেজের সরাসরি লিঙ্ক পেয়ে যাবেন।
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <Label htmlFor="track-order-number">অর্ডার নম্বর</Label>
            <Input
              id="track-order-number"
              className="mt-1.5 h-11 font-mono uppercase"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="যেমন: PATA-XXXXXX"
              autoComplete="off"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "track-error" : undefined}
            />
          </div>
          <div>
            <Label htmlFor="track-contact">ইমেইল অথবা মোবাইল</Label>
            <Input
              id="track-contact"
              className="mt-1.5 h-11"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="you@example.com অথবা 01XXXXXXXXX"
              autoComplete="off"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "track-error" : undefined}
            />
          </div>

          {error ? (
            <p id="track-error" role="alert" className="rounded-md bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> খোঁজা হচ্ছে…
              </>
            ) : (
              "লিঙ্ক নিন"
            )}
          </Button>
        </form>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          নিরাপত্তার স্বার্থে অর্ডার নম্বর একা যথেষ্ট নয় — ইমেইল বা মোবাইলও মিলতে হবে। লিঙ্কটি ২৪ ঘণ্টার জন্য কাজ করে।
        </p>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        অ্যাকাউন্ট আছে?{" "}
        <a href="/login" className="text-primary underline underline-offset-4">লগইন করে</a> সব অর্ডার একসাথে দেখুন।
      </p>
    </div>
  );
}
