import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { PolicyPage, PolicySection } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "যোগাযোগ",
  description: "পাতা সাপোর্টে যোগাযোগ করুন — ইমেইল ও ফোনে আমরা সাধারণত ২৪–৪৮ ঘণ্টার মধ্যে উত্তর দিই।",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <PolicyPage
      section="সহায়তা"
      title="যোগাযোগ"
      subtitle="অর্ডার, ডেলিভারি, ডাউনলোড বা ফেরত — যেকোনো বিষয়ে সরাসরি লিখুন বা ডাকুন।"
    >
      <PolicySection title="যোগাযোগের চ্যানেল">
        <ul className="space-y-3">
          <li className="flex items-start gap-3 rounded-lg border border-hairline bg-card p-4">
            <Mail className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
            <div>
              <p className="text-sm font-semibold">ইমেইল (সবচেয়ে দ্রুত)</p>
              <a href={`mailto:${settings.supportEmail}`} className="mt-0.5 block text-sm text-primary underline underline-offset-4">
                {settings.supportEmail}
              </a>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                অর্ডার নম্বরটি চিঠিতে উল্লেখ করলে সমাধান আরও দ্রুত হয়।
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-hairline bg-card p-4">
            <Phone className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
            <div>
              <p className="text-sm font-semibold">ফোন</p>
              <a href={`tel:${settings.supportPhone.replace(/[^+\d]/g, "")}`} className="mt-0.5 block text-sm text-primary underline underline-offset-4">
                {settings.supportPhone}
              </a>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">শনি–বৃহস্পতি, সকাল ১০টা – সন্ধ্যা ৭টা (ঢাকা সময়)।</p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-hairline bg-card p-4">
            <MapPin className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
            <div>
              <p className="text-sm font-semibold">ঠিকানা</p>
              <p className="mt-0.5 text-sm text-foreground/85">{settings.addressLine}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                আমরা অনলাইন দোকান — সরাসরি ওয়াক-ইন কেনাকাটার শোরুম নেই।
              </p>
            </div>
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="কখন উত্তর পাবেন">
        <p>
          ইমেইলে আমরা সাধারণত <strong>২৪–৪৮ ঘণ্টার মধ্যে</strong> (কর্মদিবসের হিসাবে) উত্তর দিই। অর্ডার প্রস্তুতি
          ও ডেলিভারির সময়সীমা{" "}
          <Link href="/policies/delivery" className="text-primary underline underline-offset-4">ডেলিভারি নীতিতে</Link> আলাদা
          করে লেখা আছে। জরুরি প্রয়োজনে (যেমন ডাউনলোড সমস্যা) ইমেইলের বিষয় লাইনে &ldquo;ডাউনলোড&rdquo; লিখলে দ্রুত
          র‍্যাক করা হয়।
        </p>
      </PolicySection>

      <PolicySection title="যে তথ্যগুলো সাথে দিলে কাজ দ্রুত হয়">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>অর্ডার নম্বর (যেমন PATA-XXXXXX)</li>
          <li>অর্ডার করার সময় ব্যবহৃত ইমেইল বা মোবাইল</li>
          <li>সমস্যার সংক্ষিপ্ত বর্ণনা — স্ক্রিনশট থাকলে আরও ভালো</li>
        </ul>
      </PolicySection>

      <PolicySection title="একটি স্বচ্ছ কথা">
        <p className="flex items-start gap-2">
          <Clock className="mt-1 size-4 shrink-0 text-sage" aria-hidden />
          <span>
            এই পেজে কোনো ফর্ম ইচ্ছাকৃতভাবে রাখা হয়নি — আমরা এমন কোনো ফর্ম দেখাতে চাই না যা বার্তা পাঠিয়েছে
            ভেবে ধোঁকা দেয়। ডেমো বিল্ডে ইনবক্স নেই, তাই প্রকৃত যোগাযোগের জন্য উপরের চ্যানেলগুলোই ব্যবহার করুন।
          </span>
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
