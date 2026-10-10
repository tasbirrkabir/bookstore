import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <div className="rounded-lg border border-hairline bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">অর্ডার পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          এই অর্ডার নম্বরে কোনো অর্ডার খুঁজে পাওয়া যায়নি। নম্বরটি যাচাই করুন অথবা ইমেইল/মোবাইল দিয়ে ট্র্যাক করুন।
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button asChild className="h-11">
            <Link href="/track">অর্ডার ট্র্যাক করুন</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/">হোমে ফিরুন</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
