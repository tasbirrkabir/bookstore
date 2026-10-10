import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { formatBdt } from "@/lib/money";
import { bnNumber } from "@/components/bn-format";
import { PolicyPage, PolicySection } from "@/components/policy-page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "সাধারণ প্রশ্ন",
  description: "অর্ডার, ক্যাশ অন ডেলিভারি, ডিজিটাল ডাউনলোড, ডেলিভারি ফি ও রিটার্ন নিয়ে সাধারণ প্রশ্নের উত্তর।",
};

export default async function FaqPage() {
  const s = await getSettings();

  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: "অ্যাকাউন্ট ছাড়া কি অর্ডার করা যায়?",
      a: (
        <>
          যায়। চেকআউটে শুধু নাম, মোবাইল ও ঠিকানা দিলেই অর্ডার সম্পন্ন হয়। অর্ডারের পর একটি ব্যক্তিগত অর্ডার
          লিঙ্ক পাবেন, লিঙ্কটি সংরক্ষণ করুন। হারালে অর্ডার নম্বর ও ইমেইল/মোবাইল দিয়ে{" "}
          <Link href="/track" className="text-primary underline underline-offset-4">ট্র্যাক পেজ</Link> থেকে নতুন
          লিঙ্ক নেওয়া যায়। অ্যাকাউন্ট খুললে সব অর্ডার ও ই-বুক একসাথে গুছিয়ে থাকে।
        </>
      ),
    },
    {
      q: "ক্যাশ অন ডেলিভারি (COD) কি সব অর্ডারে পাওয়া যায়?",
      a: (
        <>
          না, COD শুধু <strong>শারীরিক বইয়ের</strong> অর্ডারে প্রযোজ্য। কার্টে PDF/ই-বুক থাকলে অনলাইন পেমেন্ট
          করতে হয়, কারণ ডিজিটাল অ্যাক্সেস পেমেন্ট যাচাইয়ের পরই চালু হয়, ডেলিভারিম্যান যেভাবে টাকা নেয় সেভাবে
          ডিজিটাল ফাইলের পেমেন্ট নেওয়া সম্ভব নয়।
        </>
      ),
    },
    {
      q: "ডিজিটাল বই কিনলে কীভাবে ও কখন পাব?",
      a: (
        <>
          পেমেন্ট যাচাই হওয়ার সাথে সাথে (সাধারণত কয়েক সেকেন্ডে) অর্ডার পেজে ডাউনলোড বাটন চালু হয়ে যায়।
          লগইন করা থাকলে সব কেনা ই-বুক{" "}
          <Link href="/library" className="text-primary underline underline-offset-4">ডিজিটাল লাইব্রেরিতে</Link>{" "}
          জমা থাকে। ডাউনলোড ফাইল শুধু আপনার জন্য, অন্যকে বিতরণ করা যায় না।
        </>
      ),
    },
    {
      q: "ডাউনলোড কতবার এবং কত দিন করা যায়?",
      a: (
        <>
          সাধারণভাবে প্রতি ই-বুকে <strong>{bnNumber(s.downloadLimitDefault)} বার</strong> ডাউনলোড করা যায় এবং
          অনুমতি <strong>{bnNumber(s.downloadExpiryDays)} দিন</strong> পর্যন্ত সক্রিয় থাকে। কোনো বইয়ের পাতায়
          আলাদা সীমা লেখা থাকলে সেটিই প্রযোজ্য। সীমা শেষ হয়ে গেলে বা মেয়াদ পার হলে{" "}
          <a href={`mailto:${s.supportEmail}`} className="text-primary underline underline-offset-4">{s.supportEmail}</a>-এ
          লিখুন, প্রয়োজনে অ্যাডমিন অনুমতি নবায়ন করে দিতে পারেন।
        </>
      ),
    },
    {
      q: `ডেলিভারি ফি কত এবং বই পৌঁছায় কত দিনে?`,
      a: (
        <>
          ঢাকার ভিতরে ডেলিভারি ফি {formatBdt(s.shippingInsideDhaka)}, {s.deliveryEstimateInside}; ঢাকার বাইরে{" "}
          {formatBdt(s.shippingOutsideDhaka)}, {s.deliveryEstimateOutside}।
          {s.freeShippingThreshold
            ? ` সাবটোটাল ${formatBdt(s.freeShippingThreshold)} ছাড়ালে ডেলিভারি ফ্রি।`
            : ""}{" "}
          ফি চেকআউটে জোন অনুযায়ী হিসাব হয়। বিস্তারিত{" "}
          <Link href="/policies/delivery" className="text-primary underline underline-offset-4">ডেলিভারি নীতিতে</Link>।
        </>
      ),
    },
    {
      q: "বই ক্ষতিগ্রস্ত বা ভুল এলে কী করব?",
      a: (
        <>
          ডেলিভারির {bnNumber(s.returnWindowDays)} দিনের মধ্যে আমাদের জানালে ক্ষতিগ্রস্ত বা ভুল বই ফেরত নিয়ে
          বদলে দেওয়া হয় বা রিফান্ড করা হয়। নিয়মকানুন{" "}
          <Link href="/policies/returns" className="text-primary underline underline-offset-4">রিটার্ন ও রিফান্ড নীতিতে</Link>।
        </>
      ),
    },
    {
      q: "অর্ডারের অবস্থা কীভাবে দেখব?",
      a: (
        <>
          প্রতিটি অর্ডারের নিজস্ব পেজ আছে, সেখানে অবস্থা, পেমেন্ট, ইতিহাস ও ট্র্যাকিং তথ্য (থাকলে) দেখা যায়।
          লগইন করা থাকলে <Link href="/account" className="text-primary underline underline-offset-4">আমার অর্ডারসমূহ</Link> থেকে,
          গেস্ট হলে সংরক্ষিত লিঙ্ক অথবা{" "}
          <Link href="/track" className="text-primary underline underline-offset-4">ট্র্যাক পেজ</Link> থেকে ঢুকুন।
        </>
      ),
    },
    {
      q: "কুপন কোড কোথায় বসাব?",
      a: (
        <>
          কার্ট পেজের ডানদিকে &ldquo;কুপন কোড&rdquo; বক্সে কোডটি লিখে প্রয়োগ করুন, ছাড় সাথে সাথে হিসাবে দেখা
          যাবে। ডেমো হিসেবে <span className="font-mono">WELCOME10</span> কুপনটি চেষ্টা করে দেখতে পারেন। কুপনের
          শর্ত (সর্বনিম্ন ব্যয়, প্রযোজ্য ফরম্যাট, মেয়াদ) না মিললে সার্ভার কুপনটি গ্রহণ করবে না।
        </>
      ),
    },
    {
      q: "পেমেন্টের জন্য কি পিন বা ওটিপি দিতে হয়?",
      a: (
        <>
          <strong>কখনো না।</strong> আমাদের কোনো পেজেই পিন/ওটিপি চাওয়া হয় না, পেমেন্ট হয় গেটওয়ের নিজস্ব পেজে,
          আর ফলাফল সার্ভারে যাচাই হয়। এই ডেমো বিল্ডে গেটওয়েটি সিমুলেটেড: কোনো তথ্য চাওয়া হয় না, শুধু ফলাফল
          বাটন আছে। পিন/ওটিপি চাইলে সেটি আমাদের পেজ নয়, সতর্ক হোন।
        </>
      ),
    },
    {
      q: "দাম ও বইগুলো কি আসল?",
      a: (
        <>
          এটি একটি ডেমো বিল্ড, বই, লেখক ও দামগুলো নমুনা হিসেবে দেখানো হচ্ছে, পেমেন্টও সিমুলেটেড। সব মূল্য
          বাংলাদেশি টাকায় (৳) দেখানো হয় এবং অর্ডার তৈরির সময় সার্ভারে সর্বশেষ দাম ও স্টক যাচাই হয়, ব্রাউজারে
          দেখা হিসাবের চেয়ে সার্ভারের হিসাবই চূড়ান্ত।
        </>
      ),
    },
    {
      q: "বান্ডেল মানে কী?",
      a: (
        <>
          বান্ডেল = একই বইয়ের হার্ড কপি + PDF একসাথে, আলাদা করে কেনার চেয়ে সাশ্রয়ী দামে। কাগজের বই কুরিয়ারে
          যাবে, PDF পেমেন্ট যাচাইয়ের পরই অর্ডার পেজে চালু হয়ে যাবে, অর্থাৎ বই পৌঁছানোর আগেই পড়া শুরু করতে
          পারবেন।
        </>
      ),
    },
  ];

  return (
    <PolicyPage
      section="সহায়তা"
      title="সাধারণ প্রশ্ন"
      subtitle="অর্ডার, পেমেন্ট, ডাউনলোড ও ডেলিভারি নিয়ে যা সবচেয়ে বেশি জানতে চাওয়া হয়।"
    >
      <PolicySection title="প্রশ্নোত্তর">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-hairline">
              <AccordionTrigger className="text-left text-[15px] font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-7 text-foreground/90">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </PolicySection>

      <PolicySection title="উত্তর পাননি?">
        <p>
          <Link href="/contact" className="text-primary underline underline-offset-4">যোগাযোগ পেজে</Link> আমাদের
          ইমেইল ও ফোন পাবেন, যেকোনো প্রশ্নে লিখুন।
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
