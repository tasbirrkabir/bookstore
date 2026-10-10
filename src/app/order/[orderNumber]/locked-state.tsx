import Link from "next/link";
import { Lock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Calm access-denied state for orders. Deliberately does not reveal whether the
 * order exists, the same message applies to wrong tokens and wrong numbers.
 */
export function OrderLockedState({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <div className="rounded-lg border border-hairline bg-card p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sage-soft">
          <Lock className="size-6 text-sage" aria-hidden />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold">অর্ডার দেখতে অনুমতি প্রয়োজন</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          এই অর্ডারটি (<span className="font-mono">{orderNumber}</span>) দেখতে লগইন করুন, অথবা অর্ডার নম্বর ও
          আপনার ইমেইল/মোবাইল দিয়ে ট্র্যাকিং লিঙ্ক নিন।
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button asChild className="h-11">
            <Link href={`/login?next=${encodeURIComponent(`/order/${orderNumber}`)}`}>লগইন করুন</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/track">
              <Search className="size-4" aria-hidden /> অর্ডার ট্র্যাক করুন
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
