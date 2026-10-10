import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "কার্ট",
  description: "আপনার কার্টে থাকা বইগুলো দেখুন, পরিমাণ ঠিক করুন এবং চেকআউটে এগিয়ে যান।",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return <CartView />;
}
