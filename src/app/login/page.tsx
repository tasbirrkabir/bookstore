import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "লগইন",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <LoginForm next={safeNext(sp.next)} />;
}

/** Only allow same-site relative paths, blocks open redirects. */
function safeNext(raw: string | string[] | undefined): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  return "/account";
}
