import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminProviders } from "@/components/admin/admin-providers";
import { AdminShell } from "@/components/admin/admin-shell";

// UX guard only — every admin API re-checks permissions server-side.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "অ্যাডমিন প্যানেল",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?next=/admin");
  }

  return (
    <AdminProviders>
      <AdminShell email={session.email}>{children}</AdminShell>
    </AdminProviders>
  );
}
