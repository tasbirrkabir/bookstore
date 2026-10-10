"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastHost } from "@/components/toast-host";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const errs: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = "সঠিক ইমেইল দিন।";
    if (!password) errs.password = "পাসওয়ার্ড দিন।";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; user?: { email: string; name: string | null } };
      if (res.ok && data.ok) {
        toast.success(`স্বাগতম${data.user?.name ? `, ${data.user.name}` : ""}!`);
        router.push(next);
        router.refresh();
        return;
      }
      setErrors({ form: data.error ?? "লগইন করা যায়নি। আবার চেষ্টা করুন।" });
    } catch {
      setErrors({ form: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <ToastHost />

      <div className="rounded-lg border border-hairline bg-card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">লগইন করুন</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          অ্যাকাউন্টে ঢুকে অর্ডার ও ডিজিটাল লাইব্রেরি একসাথে দেখুন।
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <Label htmlFor="login-email">ইমেইল</Label>
            <Input
              id="login-email"
              type="email"
              className="mt-1.5 h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "err-login-email" : undefined}
            />
            {errors.email ? (
              <p id="err-login-email" role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="login-password">পাসওয়ার্ড</Label>
            <Input
              id="login-password"
              type="password"
              className="mt-1.5 h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "err-login-password" : undefined}
            />
            {errors.password ? (
              <p id="err-login-password" role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.password}</p>
            ) : null}
          </div>

          {errors.form ? (
            <p role="alert" className="rounded-md bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
              {errors.form}
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> লগইন হচ্ছে…
              </>
            ) : (
              <>
                <LogIn className="size-4" aria-hidden /> লগইন
              </>
            )}
          </Button>
        </form>

        <div className="mt-5 rounded-md border border-hairline bg-muted/60 px-3.5 py-3">
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-sage" aria-hidden />
            <span>
              ডেমো কাস্টমার: <span className="font-mono text-foreground/80">customer@pata.test</span> /{" "}
              <span className="font-mono text-foreground/80">pata-customer-123</span>
            </span>
          </p>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          নতুন এখানে?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-primary underline underline-offset-4 hover:underline">
            অ্যাকাউন্ট খুলুন
          </Link>
        </p>
      </div>
    </div>
  );
}
