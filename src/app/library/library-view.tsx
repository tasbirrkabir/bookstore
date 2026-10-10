"use client";

import Link from "next/link";
import { toast } from "sonner";
import { BookMarked, Download, FileText, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/components/book-cover";
import { ToastHost } from "@/components/toast-host";
import { bnDate, bnNumber } from "@/components/bn-format";

export type LibraryItem = {
  entitlementId: string;
  title: string;
  author: string;
  slug: string | null;
  coverImage: string | null;
  coverPattern: string;
  orderNumber: string;
  status: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string | null;
  downloadable: boolean;
  reasonCode: string | null;
  paymentStatus: string;
};

const REASON_TEXT: Record<string, string> = {
  payment_pending: "পেমেন্ট যাচাইয়ের অপেক্ষায়",
  expired: "মেয়াদ শেষ",
  limit_reached: "ডাউনলোড সীমা শেষ",
  revoked: "অ্যাক্সেস বাতিল",
  unauthorized: "অনুমতি নেই",
  not_found: "পাওয়া যায়নি",
};

export function LibraryView({ items, userName }: { items: LibraryItem[]; userName: string }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <ToastHost />

      <header className="hairline-b pb-5">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">ডিজিটাল লাইব্রেরি</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          স্বাগতম, {userName}, আপনার কেনা PDF/ই-বুকগুলো এখানে। প্রতিটি ফাইল পেমেন্ট যাচাইয়ের পর থেকে ডাউনলোডযোগ্য।
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-lg border border-dashed border-hairline bg-card px-6 py-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-sage-soft">
            <BookMarked className="size-6 text-sage" aria-hidden />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold">লাইব্রেরি এখনো খালি</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            ডিজিটাল বই কিনলে এখানে দেখা যাবে, পেমেন্ট যাচাইয়ের পরই ডাউনলোড চালু হয়ে যাবে।
          </p>
          <Button asChild size="lg" className="mt-6 h-11">
            <Link href="/shop?format=digital">ডিজিটাল বই দেখুন</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="লাইব্রেরির বইসমূহ">
          {items.map((item) => (
            <li key={item.entitlementId} className="flex flex-col rounded-lg border border-hairline bg-card p-4">
              <div className="flex gap-4">
                <div className="w-20 shrink-0">
                  <BookCover
                    title={item.title}
                    author={item.author}
                    coverImage={item.coverImage}
                    coverPattern={item.coverPattern}
                    size="sm"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.author}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    অর্ডার: <Link href={`/order/${item.orderNumber}`} className="font-mono underline-offset-4 hover:underline">{item.orderNumber}</Link>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {item.status === "active" ? (
                      <Badge className="border-transparent bg-sage-soft text-sage hover:bg-sage-soft">
                        <FileText className="size-3" aria-hidden /> সক্রিয়
                      </Badge>
                    ) : (
                      <Badge variant="destructive">{item.status === "expired" ? "মেয়াদ শেষ" : "বাতিল"}</Badge>
                    )}
                    <Badge variant="outline" className="font-normal">
                      ডাউনলোড {bnNumber(item.downloadCount)}/{bnNumber(item.maxDownloads)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
                {item.expiresAt ? (
                  <p className="text-xs text-muted-foreground">মেয়াদ: {bnDate(item.expiresAt)}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">মেয়াদ: নির্দিষ্ট সীমা নেই</p>
                )}

                {item.downloadable ? (
                  <Button asChild className="h-11 w-full">
                    <a
                      href={`/api/download/${item.entitlementId}`}
                      download
                      onClick={() => toast.success(`“${item.title}” ডাউনলোড শুরু হয়েছে।`)}
                    >
                      <Download className="size-4" aria-hidden /> ডাউনলোড করুন
                    </a>
                  </Button>
                ) : (
                  <>
                    <Button className="h-11 w-full" disabled>
                      <Download className="size-4" aria-hidden /> ডাউনলোড করুন
                    </Button>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Info className="size-3.5 shrink-0" aria-hidden />
                      {REASON_TEXT[item.reasonCode ?? ""] ?? "এই মুহূর্তে ডাউনলোড করা যাচ্ছে না"}
                    </p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs leading-5 text-muted-foreground">
        ডাউনলোড ফাইলগুলো শুধুমাত্র আপনার জন্য, অন্যকে শেয়ার করা শর্তাবলির লঙ্ঘন। বিস্তারিত:{" "}
        <Link href="/policies/terms" className="underline underline-offset-4">শর্তাবলি</Link>।
      </p>
    </div>
  );
}
