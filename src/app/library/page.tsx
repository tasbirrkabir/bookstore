import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getLibraryForSession } from "@/lib/entitlements";
import { LibraryView } from "./library-view";

export const metadata: Metadata = {
  title: "ডিজিটাল লাইব্রেরি",
  robots: { index: false, follow: false },
};

export default async function LibraryPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
        <div className="rounded-lg border border-hairline bg-card p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sage-soft">
            <BookMarked className="size-6 text-sage" aria-hidden />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">আপনার ডিজিটাল লাইব্রেরি</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            কেনা PDF/ই-বুকগুলো এখানে জমা থাকবে। দেখতে লগইন করুন — গেস্ট অর্ডারের বই অর্ডার পেজের লিঙ্ক থেকেই ডাউনলোড করা যায়।
          </p>
          <Button asChild size="lg" className="mt-6 h-11">
            <Link href="/login?next=/library">
              <LogIn className="size-4" aria-hidden /> লগইন করুন
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const items = await getLibraryForSession();
  return <LibraryView items={items} userName={session.name ?? session.email} />;
}
