import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = {
  title: "অর্ডার ট্র্যাক করুন",
  description: "অর্ডার নম্বর ও আপনার ইমেইল বা মোবাইল নম্বর দিয়ে অর্ডারের সর্বশেষ অবস্থা দেখুন।",
  robots: { index: false, follow: true },
};

export default function TrackPage() {
  return <TrackForm />;
}
