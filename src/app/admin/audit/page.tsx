"use client";

// Audit log + notification outbox, in two tabs with max-height scroll areas.

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminApi,
  EmptyState,
  fmtDateTime,
  OutboxStatusBadge,
  PageHeader,
  Spinner,
  type AuditResponse,
  type OutboxResponse,
} from "@/components/admin/admin-shared";

function AuditTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => adminApi<AuditResponse>("/api/admin?resource=audit"),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-card">
      {isLoading ? (
        <Spinner label="অডিট লগ লোড হচ্ছে…" />
      ) : isError ? (
        <p className="p-6 text-sm text-destructive">{error.message}</p>
      ) : (
        <div className="scroll-slim max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>সময়</TableHead>
                <TableHead>অ্যাক্টর</TableHead>
                <TableHead>অ্যাকশন</TableHead>
                <TableHead>টার্গেট</TableHead>
                <TableHead>ডিটেইল</TableHead>
              </TableRow>
            </TableHeader>
            {(data?.entries.length ?? 0) === 0 ? (
              <TableBody>
                <EmptyState colSpan={5} title="অডিট লগ খালি" hint="অ্যাডমিন কাজ করলে এখানে জমা হবে।" />
              </TableBody>
            ) : (
              <TableBody>
                {data!.entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</TableCell>
                    <TableCell className="text-sm">{e.actorEmail}</TableCell>
                    <TableCell>
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">{e.action}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.targetType ? `${e.targetType}${e.targetId ? `:${e.targetId.slice(0, 8)}` : ""}` : "-"}
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-sm text-muted-foreground" title={e.detail ?? undefined}>
                      {e.detail ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>
      )}
    </div>
  );
}

function OutboxTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-outbox"],
    queryFn: () => adminApi<OutboxResponse>("/api/admin?resource=outbox"),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-card">
      {isLoading ? (
        <Spinner label="আউটবক্স লোড হচ্ছে…" />
      ) : isError ? (
        <p className="p-6 text-sm text-destructive">{error.message}</p>
      ) : (
        <div className="scroll-slim max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>সময়</TableHead>
                <TableHead>ধরন</TableHead>
                <TableHead>প্রাপক</TableHead>
                <TableHead>বিষয়</TableHead>
                <TableHead>অর্ডার</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
              </TableRow>
            </TableHeader>
            {(data?.messages.length ?? 0) === 0 ? (
              <TableBody>
                <EmptyState colSpan={6} title="আউটবক্স খালি" hint="অর্ডার হলে নোটিফিকেশন এখানে জমা হবে।" />
              </TableBody>
            ) : (
              <TableBody>
                {data!.messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(m.createdAt)}</TableCell>
                    <TableCell>
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">{m.kind}</span>
                    </TableCell>
                    <TableCell className="text-sm">{m.toEmail}</TableCell>
                    <TableCell className="max-w-64 truncate text-sm" title={m.subject}>
                      {m.subject}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.orderNumber ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-0.5">
                        <OutboxStatusBadge status={m.status} />
                        {m.statusDetail ? (
                          <span className="max-w-52 truncate text-[11px] text-muted-foreground" title={m.statusDetail}>
                            {m.statusDetail}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>
      )}
    </div>
  );
}

export default function AdminAuditPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="অডিট ও নোটিফিকেশন"
        description="অ্যাডমিন কাজের অডিট ট্রেইল এবং ইমেইল আউটবক্স।"
      />
      <Tabs defaultValue="audit">
        <TabsList className="min-h-[44px]">
          <TabsTrigger value="audit" className="min-h-[44px] px-4">অডিট লগ</TabsTrigger>
          <TabsTrigger value="outbox" className="min-h-[44px] px-4">নোটিফিকেশন আউটবক্স</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
        <TabsContent value="outbox" className="mt-4">
          <OutboxTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
