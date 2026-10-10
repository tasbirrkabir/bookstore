"use client";

// Store settings: branding, announcement, delivery (poisha↔taka conversion),
// download defaults, misc, plus read-only system status chips.
// The form initializes once from fetched settings and never resets on errors.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  adminAction,
  adminApi,
  PageHeader,
  Panel,
  Spinner,
  ToneBadge,
  type AdminSettings,
  type SettingsResponse,
} from "@/components/admin/admin-shared";
import { poishaToTakaInput, takaInputToPoisha } from "@/lib/money";

type SettingsForm = {
  storeName: string;
  storeNameEn: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  addressLine: string;
  facebookUrl: string;
  announcementEnabled: boolean;
  announcement: string;
  shippingInside: string;
  shippingOutside: string;
  freeShippingThreshold: string;
  deliveryEstimateInside: string;
  deliveryEstimateOutside: string;
  downloadLimitDefault: string;
  downloadExpiryDays: string;
  codEnabled: boolean;
  returnWindowDays: string;
  aboutText: string;
};

function formFromSettings(s: AdminSettings): SettingsForm {
  return {
    storeName: s.storeName,
    storeNameEn: s.storeNameEn,
    tagline: s.tagline,
    supportEmail: s.supportEmail,
    supportPhone: s.supportPhone,
    addressLine: s.addressLine,
    facebookUrl: s.facebookUrl ?? "",
    announcementEnabled: s.announcementEnabled,
    announcement: s.announcement ?? "",
    shippingInside: poishaToTakaInput(s.shippingInsideDhaka),
    shippingOutside: poishaToTakaInput(s.shippingOutsideDhaka),
    freeShippingThreshold: poishaToTakaInput(s.freeShippingThreshold),
    deliveryEstimateInside: s.deliveryEstimateInside,
    deliveryEstimateOutside: s.deliveryEstimateOutside,
    downloadLimitDefault: String(s.downloadLimitDefault),
    downloadExpiryDays: String(s.downloadExpiryDays),
    codEnabled: s.codEnabled,
    returnWindowDays: String(s.returnWindowDays),
    aboutText: s.aboutText ?? "",
  };
}

function positiveIntOr(v: string, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.max(0, Math.floor(n)) || fallback;
}

export default function AdminSettingsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi<SettingsResponse>("/api/admin?resource=settings"),
  });

  if (isLoading) return <Spinner label="সেটিংস লোড হচ্ছে…" />;
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden />
        <AlertTitle>সেটিংস আনা যায়নি</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  if (!data) return null;

  return (
    <SettingsFormView
      settings={data.settings}
      emailConfigured={data.emailConfigured}
      paymentProvider={data.paymentProvider}
    />
  );
}

function SettingsFormView({
  settings,
  emailConfigured,
  paymentProvider,
}: {
  settings: AdminSettings;
  emailConfigured: boolean;
  paymentProvider: "mock" | "disabled";
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SettingsForm>(() => formFromSettings(settings));

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: (f: SettingsForm) => {
      const inside = takaInputToPoisha(f.shippingInside);
      const outside = takaInputToPoisha(f.shippingOutside);
      if (inside === null) throw new Error("ঢাকার ভিতরের ডেলিভারি চার্জ সঠিক দিন।");
      if (outside === null) throw new Error("ঢাকার বাইরের ডেলিভারি চার্জ সঠিক দিন।");
      return adminAction({
        action: "settings_update",
        settings: {
          storeName: f.storeName,
          storeNameEn: f.storeNameEn,
          tagline: f.tagline,
          supportEmail: f.supportEmail,
          supportPhone: f.supportPhone,
          addressLine: f.addressLine,
          facebookUrl: f.facebookUrl.trim() || null,
          announcementEnabled: f.announcementEnabled,
          announcement: f.announcement.trim() || null,
          shippingInsideDhaka: inside,
          shippingOutsideDhaka: outside,
          freeShippingThreshold: takaInputToPoisha(f.freeShippingThreshold),
          deliveryEstimateInside: f.deliveryEstimateInside,
          deliveryEstimateOutside: f.deliveryEstimateOutside,
          downloadLimitDefault: positiveIntOr(f.downloadLimitDefault, 5),
          downloadExpiryDays: positiveIntOr(f.downloadExpiryDays, 365),
          codEnabled: f.codEnabled,
          returnWindowDays: positiveIntOr(f.returnWindowDays, 7),
          aboutText: f.aboutText.trim() || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("সেটিংস সংরক্ষিত হয়েছে।");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-5 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      <PageHeader
        title="সেটিংস"
        description="দোকানের ব্র্যান্ড, ঘোষণা, ডেলিভারি ও ডিজিটাল ডাউনলোডের ডিফল্ট।"
        actions={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <ToneBadge tone={emailConfigured ? "green" : "amber"} title="EMAIL_PROVIDER_API_KEY + EMAIL_FROM_ADDRESS">
                ইমেইল: {emailConfigured ? "কনফিগারড" : "কনফিগার নেই"}
              </ToneBadge>
              <ToneBadge tone={paymentProvider === "mock" ? "amber" : "red"}>
                পেমেন্ট: {paymentProvider === "mock" ? "ডেমো (mock)" : "বন্ধ"}
              </ToneBadge>
            </div>
            <Button type="submit" className="min-h-[44px]" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
              {save.isPending ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </Button>
          </>
        }
      />

      <Panel title="ব্র্যান্ডিং">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">দোকানের নাম (বাংলা)</Label>
            <Input id="s-name" value={form.storeName} onChange={(e) => set("storeName", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-nameEn">দোকানের নাম (ইংরেজি)</Label>
            <Input id="s-nameEn" value={form.storeNameEn} onChange={(e) => set("storeNameEn", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-tagline">ট্যাগলাইন</Label>
            <Input id="s-tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-email">সাপোর্ট ইমেইল</Label>
            <Input id="s-email" type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phone">সাপোর্ট ফোন</Label>
            <Input id="s-phone" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-address">ঠিকানা</Label>
            <Input id="s-address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-fb">ফেসবুক পেজ URL</Label>
            <Input id="s-fb" value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} className="min-h-[44px]" placeholder="ঐচ্ছিক" />
          </div>
        </div>
      </Panel>

      <Panel title="ঘোষণা" description="হেডারের উপরে দেখানো ঘোষণা বার।">
        <div className="space-y-4">
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-hairline px-3">
            <span className="text-sm font-medium">ঘোষণা চালু</span>
            <Switch checked={form.announcementEnabled} onCheckedChange={(v) => set("announcementEnabled", v)} aria-label="ঘোষণা চালু" />
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="s-ann">ঘোষণার লেখা</Label>
            <Input id="s-ann" value={form.announcement} onChange={(e) => set("announcement", e.target.value)} className="min-h-[44px]" placeholder="যেমন: ৫০০৳+ অর্ডারে ফ্রি ডেলিভারি!" />
          </div>
        </div>
      </Panel>

      <Panel title="ডেলিভারি" description="চার্জ টাকায় দিন, সিস্টেমে পয়সায় (poisha) সংরক্ষিত হয়।">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-in">ঢাকার ভিতরে চার্জ (৳)</Label>
            <Input id="s-in" type="number" inputMode="decimal" min="0" step="0.01" value={form.shippingInside} onChange={(e) => set("shippingInside", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-out">ঢাকার বাইরে চার্জ (৳)</Label>
            <Input id="s-out" type="number" inputMode="decimal" min="0" step="0.01" value={form.shippingOutside} onChange={(e) => set("shippingOutside", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-free">ফ্রি শিপিংয়ের সীমা (৳)</Label>
            <Input id="s-free" type="number" inputMode="decimal" min="0" step="0.01" value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} className="min-h-[44px]" placeholder="বন্ধ, খালি রাখুন" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-estIn">সময় অনুমান, ঢাকার ভিতরে</Label>
            <Input id="s-estIn" value={form.deliveryEstimateInside} onChange={(e) => set("deliveryEstimateInside", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-estOut">সময় অনুমান, ঢাকার বাইরে</Label>
            <Input id="s-estOut" value={form.deliveryEstimateOutside} onChange={(e) => set("deliveryEstimateOutside", e.target.value)} className="min-h-[44px]" />
          </div>
        </div>
      </Panel>

      <Panel title="ডাউনলোড ডিফল্ট" description="ভ্যারিয়েন্টে আলাদা মান না দিলে এগুলো প্রযোজ্য হবে।">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-dl">সর্বোচ্চ ডাউনলোড</Label>
            <Input id="s-dl" type="number" inputMode="numeric" min="1" step="1" value={form.downloadLimitDefault} onChange={(e) => set("downloadLimitDefault", e.target.value)} className="min-h-[44px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-exp">ডাউনলোড মেয়াদ (দিন)</Label>
            <Input id="s-exp" type="number" inputMode="numeric" min="1" step="1" value={form.downloadExpiryDays} onChange={(e) => set("downloadExpiryDays", e.target.value)} className="min-h-[44px]" />
          </div>
        </div>
      </Panel>

      <Panel title="অন্যান্য">
        <div className="space-y-4">
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-hairline px-3">
            <span>
              <span className="block text-sm font-medium">ক্যাশ অন ডেলিভারি (COD) চালু</span>
              <span className="block text-xs text-muted-foreground">বন্ধ করলে শুধু অনলাইন পেমেন্ট গ্রহণ হবে</span>
            </span>
            <Switch checked={form.codEnabled} onCheckedChange={(v) => set("codEnabled", v)} aria-label="COD চালু" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-return">রিটার্ন উইন্ডো (দিন)</Label>
              <Input id="s-return" type="number" inputMode="numeric" min="0" step="1" value={form.returnWindowDays} onChange={(e) => set("returnWindowDays", e.target.value)} className="min-h-[44px]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-about">আমাদের কথা (পাতার লেখা)</Label>
            <Textarea id="s-about" rows={5} value={form.aboutText} onChange={(e) => set("aboutText", e.target.value)} />
          </div>
        </div>
      </Panel>

      <div className="flex justify-end">
        <Button type="submit" className="min-h-[44px]" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          {save.isPending ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
        </Button>
      </div>
    </form>
  );
}
