"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastHost } from "@/components/toast-host";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^01[3-9]\d{8}$/;

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "আপনার নাম লিখুন।";
    if (form.phone.trim() && !PHONE_RE.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।";
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "সঠিক ইমেইল দিন।";
    if (form.password.length < 8) errs.password = "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।";
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim(),
          password: form.password,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; user?: { email: string; name: string | null } };
      if (res.ok && data.ok) {
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে — স্বাগতম!");
        router.push(next);
        router.refresh();
        return;
      }
      if (res.status === 409) {
        setErrors({ email: data.error ?? "এই ইমেইল দিয়ে অ্যাকাউন্ট আছে। লগইন করুন।" });
        return;
      }
      setErrors({ form: data.error ?? "অ্যাকাউন্ট খোলা যায়নি। আবার চেষ্টা করুন।" });
    } catch {
      setErrors({ form: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।" });
    } finally {
      setLoading(false);
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <ToastHost />

      <div className="rounded-lg border border-hairline bg-card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">অ্যাকাউন্ট খুলুন</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          অ্যাকাউন্ট খুললে সব অর্ডার এক জায়গায় আর কেনা ই-বুকগুলো ডিজিটাল লাইব্রেরিতে সাজানো থাকবে।
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <Label htmlFor="reg-name">নাম *</Label>
            <Input
              id="reg-name"
              className="mt-1.5 h-11"
              value={form.name}
              onChange={set("name")}
              autoComplete="name"
              placeholder="যেমন: রাহাত হোসেন"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "err-reg-name" : undefined}
            />
            {errors.name ? <p id="err-reg-name" role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.name}</p> : null}
          </div>
          <div>
            <Label htmlFor="reg-phone">
              মোবাইল <span className="text-muted-foreground">(ঐচ্ছিক)</span>
            </Label>
            <Input
              id="reg-phone"
              className="mt-1.5 h-11"
              value={form.phone}
              onChange={set("phone")}
              inputMode="tel"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? "err-reg-phone" : undefined}
            />
            {errors.phone ? <p id="err-reg-phone" role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.phone}</p> : null}
          </div>
          <div>
            <Label htmlFor="reg-email">ইমেইল *</Label>
            <Input
              id="reg-email"
              type="email"
              className="mt-1.5 h-11"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "err-reg-email" : undefined}
            />
            {errors.email ? <p id="err-reg-email" role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p> : null}
          </div>
          <div>
            <Label htmlFor="reg-password">পাসওয়ার্ড *</Label>
            <Input
              id="reg-password"
              type="password"
              className="mt-1.5 h-11"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "err-reg-password" : "hint-reg-password"}
            />
            {errors.password ? (
              <p id="err-reg-password" role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.password}</p>
            ) : (
              <p id="hint-reg-password" className="mt-1.5 text-xs text-muted-foreground">কমপক্ষে ৮ অক্ষর।</p>
            )}
          </div>

          {errors.form ? (
            <p role="alert" className="rounded-md bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
              {errors.form}
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> অ্যাকাউন্ট খোলা হচ্ছে…
              </>
            ) : (
              <>
                <UserRoundPlus className="size-4" aria-hidden /> অ্যাকাউন্ট খুলুন
              </>
            )}
          </Button>
        </form>

        <p className="mt-5 text-sm text-muted-foreground">
          আগে থেকেই অ্যাকাউন্ট আছে?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-primary underline underline-offset-4 hover:underline">
            লগইন করুন
          </Link>
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          অ্যাকাউন্ট খুললে আপনি আমাদের{" "}
          <Link href="/policies/terms" className="underline underline-offset-4">শর্তাবলি</Link> ও{" "}
          <Link href="/policies/privacy" className="underline underline-offset-4">গোপনীয়তা নীতির</Link> সাথে সম্মত হচ্ছেন।
        </p>
      </div>
    </div>
  );
}
