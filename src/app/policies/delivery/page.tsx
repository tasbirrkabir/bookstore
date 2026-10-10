import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { formatBdt } from "@/lib/money";
import { bnNumber } from "@/components/bn-format";
import { PolicyPage, PolicySection } from "@/components/policy-page";

export const metadata: Metadata = {
  title: "ডেলিভারি নীতি",
  description: "ডেলিভারি জোন, ফি, সময়সীমা, প্যাকেজিং ও কুরিয়ার প্রক্রিয়া, পাতার ডেলিভারি নীতি।",
};

export default async function DeliveryPolicyPage() {
  const s = await getSettings();

  return (
    <PolicyPage
      section="নীতিমালা"
      title="ডেলিভারি নীতি"
      subtitle="কোথায় পাঠাই, কত খরচ, কত সময়, এক নজরে, কোনো লুকানো শর্ত ছাড়া।"
      updated="ফেব্রুয়ারি ২০২৫"
    >
      <PolicySection title="জোন ও ফি">
        <div className="overflow-hidden rounded-lg border border-hairline">
          <table className="w-full text-sm">
            <tbody>
              <tr className="hairline-b bg-card">
                <th scope="row" className="px-4 py-3 text-left font-semibold">ঢাকার ভিতরে</th>
                <td className="px-4 py-3 text-right font-medium">{formatBdt(s.shippingInsideDhaka)}</td>
              </tr>
              <tr className="bg-card">
                <th scope="row" className="px-4 py-3 text-left font-semibold">ঢাকার বাইরে</th>
                <td className="px-4 py-3 text-right font-medium">{formatBdt(s.shippingOutsideDhaka)}</td>
              </tr>
              {s.freeShippingThreshold ? (
                <tr className="hairline-t bg-sage-soft/50">
                  <th scope="row" className="px-4 py-3 text-left font-semibold">
                    {formatBdt(s.freeShippingThreshold)} বা তার বেশি কেনাকাটায়
                  </th>
                  <td className="px-4 py-3 text-right font-medium text-success">ফ্রি ডেলিভারি</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          ফি প্রতি অর্ডারে একবার যোগ হয় (আইটেম সংখ্যা যা-ই হোক)। চেকআউটে জোন বেছে নিলে ফি হিসাবে দেখা যায়;
          কার্ট পেজেও জোন নির্বাচন করে আনুমানিক ফি দেখা যায়। চূড়ান্ত ফি অর্ডার তৈরির সময় সার্ভারে হিসাব হয়।
        </p>
      </PolicySection>

      <PolicySection title="কত সময় লাগে">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>ঢাকার ভিতরে: {s.deliveryEstimateInside}</li>
          <li>ঢাকার বাইরে: {s.deliveryEstimateOutside}</li>
        </ul>
        <p>
          সময়সীমা কুরিয়ার সার্ভিসের স্বাভাবিক গতির উপর নির্ভরশীল, ছুটি, ধর্মঘট বা দুর্যোগে দেরি হলে অর্ডার
          পেজের ইতিহাসে জানানো হয়। অর্ডার পাঠানোর পর কুরিয়ারের নাম ও ট্র্যাকিং নম্বর (যদি থাকে) অর্ডার পেজে
          যোগ করা হয়।
        </p>
      </PolicySection>

      <PolicySection title="প্যাকেজিং">
        <p>
          প্রতিটি কাগজের বই প্লাস্টিক মোড়ানো এবং শক্ত কার্টনের খামে বা বাবল-লেয়ারে মোড়ে পাঠানো হয়, যাতে
          বৃষ্টি ও চাপে বই যেন ক্ষতিগ্রস্ত না হয়। একাধিক বই হলে এক প্যাকেজে সুরক্ষিতভাবে পাঠানো হয়, ফি একবারই
          লাগে। প্যাকেজ খুলে দেখে সমস্যা থাকলে{" "}
          <Link href="/policies/returns" className="text-primary underline underline-offset-4">রিটার্ন নীতি</Link> অনুযায়ী
          {bnNumber(s.returnWindowDays)} দিনের মধ্যে জানান।
        </p>
      </PolicySection>

      <PolicySection title="কুরিয়ার ও হাতে-কলমে প্রক্রিয়া">
        <p>
          আমরা পরিচিত কুরিয়ার সার্ভিসের মাধ্যমে হাতে-কলমে পাঠাই, প্রতিটি অর্ডার ম্যানুয়ালি প্যাক ও বুক করা হয়,
          তাই অর্ডার নিশ্চিত হওয়ার পর পাঠানো হওয়া পর্যন্ত অবস্থা অর্ডার পেজে ধাপে ধাপে দেখা যায় (নিশ্চিত →
          প্রস্তুত হচ্ছে → পাঠানো হয়েছে → ডেলিভারি সম্পন্ন)। ট্র্যাকিং নম্বর কুরিয়ার থেকে পেতে পেতেই অর্ডার পেজে
          যোগ করা হয়।
        </p>
        <p>
          ডেলিভারিম্যান বই বুঝিয়ে দেওয়ার সময় ক্যাশ অন ডেলিভারির টাকা (যদি COD অর্ডার হয়) নেবেন। ডিজিটাল বইয়ের
          কোনো ডেলিভারি নেই, পেমেন্ট যাচাইয়ের পরই অর্ডার পেজ থেকে ডাউনলোড করুন।
        </p>
      </PolicySection>

      <PolicySection title="ঠিকানা ভুল হলে">
        <p>
          চেকআউটের আগে ঠিকানা দুবার দেখে নিন। ভুল বা অসম্পূর্ণ ঠিকানায় ফেরত আসা প্যাকেজ পুনরায় পাঠাতে সঠিক
          ঠিকানা দিয়ে আবার ডেলিভারি ফি লাগতে পারে। অর্ডার পাঠানোর আগে ঠিকানা ঠিক করতে হলে দ্রুত{" "}
          <a href={`mailto:${s.supportEmail}`} className="text-primary underline underline-offset-4">{s.supportEmail}</a>-এ
          অর্ডার নম্বর উল্লেখ করে লিখুন, পাঠানোর আগে পর্যন্ত হালনাগাদ করা যায়।
        </p>
      </PolicySection>

      <PolicySection title="ডেমো নোট">
        <p>
          এটি ডেমো বিল্ড, জোন, ফি ও সময়সীমাগুলো দোকান সেটিংস থেকে আসা নমুনা মান। আসল দোকানে এগুলো অ্যাডমিন
          প্যানেল থেকে যেকোনো সময় হালনাগাদযোগ্য।
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
