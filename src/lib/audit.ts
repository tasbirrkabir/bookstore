import "server-only";
import { db } from "@/lib/db";

/** Append an admin audit entry. Never log secrets — only actions and references. */
export async function logAudit(entry: { actorEmail: string; action: string; targetType?: string; targetId?: string; detail?: string }) {
  try {
    await db.adminAuditLog.create({
      data: {
        actorEmail: entry.actorEmail,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        detail: entry.detail?.slice(0, 500) ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] failed to write entry", e);
  }
}
