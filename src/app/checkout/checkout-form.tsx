"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ToastHost } from "@/components/toast-host";
import { FORMAT_LABELS } from "@/lib/order-ui";
import { formatBdt } from "@/lib/money";
import type { CartQuote } from "@/components/commerce-types";

const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DISTRICTS = [
  "ঢাকা",
  "চট্টগ্রাম",
  "খুলনা",
  "রাজশাহী",
  "সিলেট",
  "বরিশাল",
  "রংপুর",
  "ময়মনসিংহ",
  "কুমিল্লা",
  "যশোর",
  "অন্যান্য",
];

type CheckoutUser = { name: string | null; email: string | null; phone: string | null } | null;

export function CheckoutForm({
  quote,
  paymentOnlineAvailable,
  freeShippingThresholdMinor,
  deliveryEstimates,
  supportEmail,
  user,
}: {
  quote: CartQuote;
  paymentOnlineAvailable: boolean;
  freeShippingThresholdMinor: number | null;
  deliveryEstimates: { inside: string; outside: string };
  supportEmail: string;
  user: CheckoutUser;
}) {
  const router = useRouter();

  /* ── form state ── */
  const [contact, setContact] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
  });
  const [ship, setShip] = useState({
    recipientName: "",
    recipientPhone: "",
    district: "",
    area: "",
    address: "",
    postcode: "",
    note: "",
  });
  const [zone, setZone] = useState<string>("inside_dhaka");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online" | "">(
    quote.codEligible ? "cod" : paymentOnlineAvailable && quote.requiresOnlinePayment ? "online" : ""
  );
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* ── derived ── */
  const hasPhysical = quote.hasPhysical;
  const hasIssues = quote.lines.some((l) => l.hasIssue !== null);
  const purchasableTotal = Math.max(0, quote.subtotalMinor - quote.discountMinor);
  const zoneInfo = quote.shippingZones.find((z) => z.id === zone) ?? null;

  const shippingMinor = useMemo(() => {
    if (!hasPhysical || !zoneInfo) return 0;
    if (freeShippingThresholdMinor && purchasableTotal >= freeShippingThresholdMinor) return 0;
    return zoneInfo.feeMinor;
  }, [hasPhysical, zoneInfo, freeShippingThresholdMinor, purchasableTotal]);

  const totalMinor = purchasableTotal + shippingMinor;
  const recipientName = ship.recipientName.trim() || contact.name.trim();
  const recipientPhone = ship.recipientPhone.replace(/[\s-]/g, "") || contact.phone.replace(/[\s-]/g, "");
  const noPaymentAvailable = !quote.codEligible && !paymentOnlineAvailable;

  const zoneEstimate = zone === "outside_dhaka" ? deliveryEstimates.outside : deliveryEstimates.inside;

  /* ── validation (mirrors server rules) ── */
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (contact.name.trim().length < 3) errs.name = "পুরো নাম লিখুন (কমপক্ষে ৩ অক্ষর)।";
    if (!PHONE_RE.test(contact.phone.replace(/[\s-]/g, ""))) errs.phone = "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)।";
    if (contact.email.trim() && !EMAIL_RE.test(contact.email.trim())) errs.email = "সঠিক ইমেইল দিন।";

    if (hasPhysical) {
      if (!ship.district) errs.district = "জেলা নির্বাচন করুন।";
      if (!ship.area.trim()) errs.area = "এলাকা/উপজেলা লিখুন।";
      if (ship.address.trim().length < 10) errs.address = "বিস্তারিত ঠিকানা লিখুন (কমপক্ষে ১০ অক্ষর)।";
      if (!PHONE_RE.test(recipientPhone)) errs.recipientPhone = "প্রাপকের সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।";
    }
    if (!paymentMethod) errs.paymentMethod = "একটি পেমেন্ট পদ্ধতি নির্বাচন করুন।";
    if (!consent) errs.consent = "শর্তাবলিতে সম্মতি ছাড়া অর্ডার নিশ্চিত করা যাবে না।";
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("ফর্মের চিহ্নিত তথ্যগুলো ঠিক করে আবার চেষ্টা করুন।");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name.trim(),
          contactPhone: contact.phone.replace(/[\s-]/g, ""),
          contactEmail: contact.email.trim() || null,
          paymentMethod,
          shippingZone: hasPhysical ? zone : null,
          shipping: hasPhysical
            ? {
                recipientName,
                recipientPhone,
                district: ship.district,
                area: ship.area.trim(),
                address: ship.address.trim(),
                postcode: ship.postcode.trim() || null,
                note: ship.note.trim() || null,
              }
            : null,
          consent: true,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        orderNumber?: string;
        guestToken?: string | null;
        redirectUrl?: string | null;
        paymentError?: string;
      };

      if (res.ok && data.ok && data.orderNumber) {
        // Keep the guest capability token in this tab so the (simulated) gateway
        // redirect can land the guest on their order page.
        try {
          sessionStorage.setItem(`pata_gt:${data.orderNumber}`, data.guestToken ?? "");
        } catch {
          /* storage unavailable, order page will fall back to /track */
        }
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl; // mock gateway page
          return;
        }
        if (data.paymentError) toast.error(data.paymentError);
        router.push(`/order/${data.orderNumber}?t=${encodeURIComponent(data.guestToken ?? "")}`);
        return;
      }

      toast.error(data.error ?? "অর্ডার করা যায়নি। একটু পরে আবার চেষ্টা করুন।");
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা, অর্ডার হয়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  }

  const setErr = (key: string) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `err-${key}` : undefined,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <ToastHost />

      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="size-4" aria-hidden /> কার্টে ফিরে যান
      </Link>

      <header className="hairline-b mt-3 pb-5">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">চেকআউট</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          শান্ত মনে, এক পেজে, তথ্যগুলো পূরণ করে অর্ডার নিশ্চিত করুন।
        </p>
      </header>

      {hasIssues ? (
        <Alert className="mt-6 border-warning/40 bg-warning/5">
          <AlertTriangle className="text-warning" aria-hidden />
          <AlertTitle>কার্টে সমস্যাযুক্ত আইটেম আছে</AlertTitle>
          <AlertDescription>
            কিছু আইটেম স্টকশেষ বা অপ্রাপ্য, <Link href="/cart" className="font-medium text-foreground underline underline-offset-4">কার্টে গিয়ে</Link> সেগুলো সরিয়ে বা ঠিক করে ফিরে আসুন।
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_340px]">
        <div className="divide-y divide-hairline">
          {/* ── a) যোগাযোগ ── */}
          <section aria-labelledby="sec-contact" className="pb-8">
            <h2 id="sec-contact" className="font-display text-xl font-semibold">
              <span className="mr-1.5 text-muted-foreground">১.</span>যোগাযোগ
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="contact-name">পুরো নাম *</Label>
                <Input
                  id="contact-name"
                  className="mt-1.5 h-11"
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  autoComplete="name"
                  placeholder="যেমন: রাহাত হোসেন"
                  {...setErr("name")}
                />
                <FieldError id="err-name" message={errors.name} />
              </div>
              <div>
                <Label htmlFor="contact-phone">মোবাইল *</Label>
                <Input
                  id="contact-phone"
                  className="mt-1.5 h-11"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="01712345678"
                  {...setErr("phone")}
                />
                <p className="mt-1 text-xs text-muted-foreground">বাংলাদেশি নম্বর: 01XXXXXXXXX</p>
                <FieldError id="err-phone" message={errors.phone} />
              </div>
              <div>
                <Label htmlFor="contact-email">
                  ইমেইল <span className="text-muted-foreground">(ঐচ্ছিক, তবে প্রস্তাবিত)</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  className="mt-1.5 h-11"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...setErr("email")}
                />
                <p className="mt-1 text-xs text-muted-foreground">অর্ডার ইমেইল ও ডিজিটাল ডাউনলোড তথ্য পাঠাতে দরকার হয়।</p>
                <FieldError id="err-email" message={errors.email} />
              </div>
            </div>
          </section>

          {/* ── b) ডেলিভারি ঠিকানা ── */}
          {hasPhysical ? (
            <section aria-labelledby="sec-shipping" className="py-8">
              <h2 id="sec-shipping" className="font-display text-xl font-semibold">
                <span className="mr-1.5 text-muted-foreground">২.</span>ডেলিভারি ঠিকানা
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ship-recipient-name">
                    প্রাপকের নাম <span className="text-xs text-muted-foreground">(খালি রাখলে যোগাযোগের নাম)</span>
                  </Label>
                  <Input
                    id="ship-recipient-name"
                    className="mt-1.5 h-11"
                    value={ship.recipientName}
                    onChange={(e) => setShip((s) => ({ ...s, recipientName: e.target.value }))}
                    placeholder={contact.name || "প্রাপকের নাম"}
                    {...setErr("recipientName")}
                  />
                  <FieldError id="err-recipientName" message={errors.recipientName} />
                </div>
                <div>
                  <Label htmlFor="ship-recipient-phone">
                    প্রাপকের মোবাইল <span className="text-xs text-muted-foreground">(খালি রাখলে যোগাযোগের নম্বর)</span>
                  </Label>
                  <Input
                    id="ship-recipient-phone"
                    className="mt-1.5 h-11"
                    value={ship.recipientPhone}
                    onChange={(e) => setShip((s) => ({ ...s, recipientPhone: e.target.value }))}
                    inputMode="tel"
                    placeholder={contact.phone || "01XXXXXXXXX"}
                    {...setErr("recipientPhone")}
                  />
                  <FieldError id="err-recipientPhone" message={errors.recipientPhone} />
                </div>
                <div>
                  <Label htmlFor="ship-district">জেলা *</Label>
                  <Select
                    value={ship.district}
                    onValueChange={(v) => setShip((s) => ({ ...s, district: v }))}
                  >
                    <SelectTrigger id="ship-district" className="mt-1.5 h-11 w-full" aria-invalid={errors.district ? true : undefined} aria-describedby={errors.district ? "err-district" : undefined}>
                      <SelectValue placeholder="জেলা নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="err-district" message={errors.district} />
                </div>
                <div>
                  <Label htmlFor="ship-area">এলাকা / উপজেলা *</Label>
                  <Input
                    id="ship-area"
                    className="mt-1.5 h-11"
                    value={ship.area}
                    onChange={(e) => setShip((s) => ({ ...s, area: e.target.value }))}
                    placeholder="যেমন: ধানমন্ডি"
                    {...setErr("area")}
                  />
                  <FieldError id="err-area" message={errors.area} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="ship-address">বিস্তারিত ঠিকানা *</Label>
                  <Textarea
                    id="ship-address"
                    className="mt-1.5 min-h-20"
                    value={ship.address}
                    onChange={(e) => setShip((s) => ({ ...s, address: e.target.value }))}
                    placeholder="বাসা/ফ্ল্যাট নম্বর, রোড, থানা, কুরিয়ার যাতে সহজে খুঁজে পায়"
                    {...setErr("address")}
                  />
                  <FieldError id="err-address" message={errors.address} />
                </div>
                <div>
                  <Label htmlFor="ship-postcode">
                    পোস্টকোড <span className="text-muted-foreground">(ঐচ্ছিক)</span>
                  </Label>
                  <Input
                    id="ship-postcode"
                    className="mt-1.5 h-11"
                    value={ship.postcode}
                    onChange={(e) => setShip((s) => ({ ...s, postcode: e.target.value }))}
                    inputMode="numeric"
                    placeholder="যেমন: 1209"
                  />
                </div>
                <div>
                  <Label htmlFor="ship-note">
                    ডেলিভারি নোট <span className="text-muted-foreground">(ঐচ্ছিক)</span>
                  </Label>
                  <Input
                    id="ship-note"
                    className="mt-1.5 h-11"
                    value={ship.note}
                    onChange={(e) => setShip((s) => ({ ...s, note: e.target.value }))}
                    placeholder="যেমন: বিকেলে ডেলিভারি দিলে ভালো হয়"
                  />
                </div>
              </div>

              {/* Shipping zone */}
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold">ডেলিভারি জোন *</legend>
                <RadioGroup
                  value={zone}
                  onValueChange={(v) => setZone(v)}
                  className="mt-3 grid gap-3 sm:grid-cols-2"
                  aria-label="ডেলিভারি জোন"
                >
                  {quote.shippingZones.map((z) => {
                    const free = !!(freeShippingThresholdMinor && purchasableTotal >= freeShippingThresholdMinor);
                    return (
                      <label
                        key={z.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-hairline bg-card p-3.5 transition-colors has-[data-state=checked]:border-primary"
                      >
                        <RadioGroupItem value={z.id} className="mt-0.5" />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                            {z.label}
                            <span className="font-normal text-muted-foreground">
                              {free ? <span className="text-success">ফ্রি</span> : formatBdt(z.feeMinor)}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{z.estimate}</span>
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>
                {zoneInfo ? <p className="mt-2 text-xs text-muted-foreground">আনুমানিক সময়: {zoneEstimate}</p> : null}
              </fieldset>
            </section>
          ) : null}

          {/* ── c) পেমেন্ট ── */}
          <section aria-labelledby="sec-payment" className={hasPhysical ? "py-8" : "pt-8"}>
            <h2 id="sec-payment" className="font-display text-xl font-semibold">
              <span className="mr-1.5 text-muted-foreground">{hasPhysical ? "৩." : "২."}</span>পেমেন্ট
            </h2>

            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as "cod" | "online")}
              className="mt-4 grid gap-3"
              aria-label="পেমেন্ট পদ্ধতি"
            >
              {/* COD */}
              <label
                className={`flex items-start gap-3 rounded-md border border-hairline bg-card p-3.5 transition-colors ${
                  quote.codEligible ? "cursor-pointer has-[data-state=checked]:border-primary" : "opacity-70"
                }`}
              >
                <RadioGroupItem value="cod" disabled={!quote.codEligible} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <Banknote className="size-4 text-sage" aria-hidden />
                    ক্যাশ অন ডেলিভারি
                    {quote.codEligible ? (
                      <Badge variant="outline" className="font-normal">বই হাতে পেয়ে পেমেন্ট</Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {quote.codEligible
                      ? "কুরিয়ার বই বুঝিয়ে দেওয়ার সময় নগদ টাকা নেবে।"
                      : quote.hasDigital
                        ? "ডিজিটাল আইটেম থাকায় COD প্রযোজ্য নয়, ডিজিটাল অ্যাক্সেস পেমেন্ট যাচাইয়ের পরই চালু হয়।"
                        : "এই কার্টে COD প্রযোজ্য নয়।"}
                  </span>
                </span>
              </label>

              {/* Online */}
              <label
                className={`flex items-start gap-3 rounded-md border border-hairline bg-card p-3.5 transition-colors ${
                  paymentOnlineAvailable ? "cursor-pointer has-[data-state=checked]:border-primary" : "opacity-70"
                }`}
              >
                <RadioGroupItem value="online" disabled={!paymentOnlineAvailable} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <CreditCard className="size-4 text-sage" aria-hidden />
                    অনলাইন পেমেন্ট
                    {paymentOnlineAvailable ? (
                      <Badge variant="outline" className="font-normal">bKash / Nagad / কার্ড</Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal">গেটওয়ে কনফিগারের অপেক্ষায়</Badge>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {paymentOnlineAvailable
                      ? "নিরাপদ গেটওয়ে পেজে পেমেন্ট সম্পন্ন করতে নিয়ে যাওয়া হবে। পেমেন্ট যাচাই হওয়ার পরই অর্ডার নিশ্চিত হয়।"
                      : "অনলাইন পেমেন্ট গেটওয়ে এখনো কনফিগার করা হয়নি, শিগগিরই আসছে।"}
                  </span>
                </span>
              </label>
            </RadioGroup>
            <FieldError id="err-paymentMethod" message={errors.paymentMethod} />

            {noPaymentAvailable ? (
              <Alert className="mt-4 border-destructive/30 bg-destructive/5">
                <AlertTriangle className="text-destructive" aria-hidden />
                <AlertTitle>কোনো পেমেন্ট পদ্ধতি উপলব্ধ নয়</AlertTitle>
                <AlertDescription>
                  এই কার্টে COD প্রযোজ্য নয় এবং অনলাইন পেমেন্ট কনফিগার করা নেই। কার্টে শুধু শারীরিক বই রেখে COD বেছে নিতে পারেন, অথবা{" "}
                  <a href={`mailto:${supportEmail}`} className="font-medium underline underline-offset-4">{supportEmail}</a>-এ যোগাযোগ করুন।
                </AlertDescription>
              </Alert>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-sage" aria-hidden />
                পেমেন্টের জন্য আমরা কখনোই পিন বা ওটিপি চাই না, পেমেন্ট হয় গেটওয়ের নিজস্ব পেজে।
              </p>
            )}
          </section>
        </div>

        {/* ── d) অর্ডার সারসংক্ষেপ + consent + submit ── */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section aria-labelledby="sec-summary" className="rounded-lg border border-hairline bg-card p-4 sm:p-5">
            <h2 id="sec-summary" className="text-sm font-semibold">
              অর্ডার সারসংক্ষেপ
              <span className="ml-2 font-normal text-muted-foreground">{quote.lines.length}টি আইটেম</span>
            </h2>
            <ul className="mt-3 max-h-64 space-y-2.5 overflow-y-auto scroll-slim pr-1" aria-label="অর্ডারের আইটেম">
              {quote.lines.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{l.title}</span>
                    <span className="text-xs text-muted-foreground">
                      × {l.quantity}, {FORMAT_LABELS[l.formatType]}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">{formatBdt(l.lineSubtotalMinor)}</span>
                </li>
              ))}
            </ul>

            <Separator className="my-3 bg-hairline" />

            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">সাবটোটাল</dt>
                <dd className="font-medium">{formatBdt(quote.subtotalMinor)}</dd>
              </div>
              {quote.discountMinor > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">ছাড় {quote.couponCode ? `(${quote.couponCode})` : ""}</dt>
                  <dd className="font-medium text-success">−{formatBdt(quote.discountMinor)}</dd>
                </div>
              ) : null}
              {hasPhysical ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">ডেলিভারি ({zoneInfo?.label ?? "জোন"})</dt>
                  <dd className="font-medium">
                    {shippingMinor === 0 ? <span className="text-success">ফ্রি</span> : formatBdt(shippingMinor)}
                  </dd>
                </div>
              ) : null}
              <Separator className="bg-hairline" />
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold">সর্বমোট</dt>
                <dd className="font-display text-xl font-semibold">{formatBdt(totalMinor)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              মূল্য ও স্টক সার্ভারে সর্বশেষ যাচাই হয়, চূড়ান্ত হিসাব অর্ডার তৈরির সময় নিশ্চিত হবে।
            </p>
          </section>

          {/* Consent */}
          <section aria-labelledby="sec-consent" className="rounded-lg border border-hairline bg-card p-4 sm:p-5">
            <h2 id="sec-consent" className="sr-only">সম্মতি</h2>
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5 size-5"
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "err-consent" : undefined}
                id="consent"
              />
              <span className="text-sm leading-6 text-foreground/90">
                আমি{" "}
                <Link href="/policies/terms" target="_blank" className="text-primary underline underline-offset-4">শর্তাবলি</Link>
                ,{" "}
                <Link href="/policies/returns" target="_blank" className="text-primary underline underline-offset-4">রিটার্ন</Link>{" "}
                ও{" "}
                <Link href="/policies/privacy" target="_blank" className="text-primary underline underline-offset-4">গোপনীয়তা নীতি</Link>{" "}
                পড়ে সম্মত হচ্ছি। *
              </span>
            </label>
            <FieldError id="err-consent" message={errors.consent} />
          </section>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full text-base"
            disabled={submitting || hasIssues || noPaymentAvailable || !paymentMethod}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                অর্ডার হচ্ছে…
              </>
            ) : (
              <>
                <Lock className="size-4" aria-hidden />
                অর্ডার নিশ্চিত করুন, {formatBdt(totalMinor)}
              </>
            )}
          </Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            অর্ডার নিশ্চিত করলে আপনার কার্ট খালি হয়ে যাবে এবং অর্ডার পেজে নিয়ে যাওয়া হবে।
          </p>
        </aside>
      </form>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {message}
    </p>
  );
}
