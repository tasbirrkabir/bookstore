import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "অ্যাকাউন্ট খুলুন",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <RegisterForm next={safeNext(sp.next)} />;
}

/** Only allow same-site relative paths — blocks open redirects. */
function safeNext(raw: string | string[] | undefined): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  return "/account";
}
