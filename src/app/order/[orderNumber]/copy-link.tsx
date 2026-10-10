"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Copies the (guest-capable) order link to the clipboard so customers can save it.
 */
export function CopyOrderLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("অর্ডার লিঙ্ক কপি হয়েছে — এটি সংরক্ষণ করুন।");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("কপি করা যায়নি — ব্রাউজারের ঠিকানা বার থেকে লিঙ্কটি কপি করুন।");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-10 gap-1.5"
      onClick={() => void copy()}
    >
      {copied ? <Check className="size-4 text-success" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      {copied ? "কপি হয়েছে" : "লিঙ্ক কপি করুন"}
    </Button>
  );
}
