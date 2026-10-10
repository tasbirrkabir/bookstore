import "server-only";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { sha256, safeEqual } from "@/lib/tokens";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

// Original PDFs live OUTSIDE the public directory. Nothing here ever returns
// a storage path or a permanent public URL — files stream through this module only.
const PRIVATE_ROOT = path.join(process.cwd(), "private-assets");

function resolvePrivatePath(relativePath: string): string | null {
  const full = path.resolve(PRIVATE_ROOT, relativePath);
  if (!full.startsWith(PRIVATE_ROOT + path.sep) && full !== PRIVATE_ROOT) return null; // path traversal guard
  return full;
}

/**
 * Grant download entitlements for every digital line of a paid order.
 * Idempotent: unique(orderItemId, assetId) + upsert — repeated calls (webhook retries,
 * reconciliation) never duplicate grants or counts.
 */
export async function grantEntitlementsForOrder(orderId: string, grantedBy: string = "payment", reason?: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  // Only paid/collected orders may receive entitlements. A browser redirect alone
  // can never reach here — callers must have verified payment server-side.
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "cod_collected") {
    throw new Error("ORDER_NOT_PAID");
  }

  const settings = await getSettings();
  for (const item of order.items) {
    if (!item.digitalAssetId) continue;
    const asset = await db.asset.findUnique({ where: { id: item.digitalAssetId } });
    if (!asset || !asset.isPrivate) continue;

    const variant = item.variantId ? await db.productVariant.findUnique({ where: { id: item.variantId } }) : null;
    const maxDownloads = variant?.downloadLimit ?? settings.downloadLimitDefault;
    const expiryDays = variant?.downloadExpiryDays ?? settings.downloadExpiryDays;

    await db.downloadEntitlement.upsert({
      where: { orderItemId_assetId: { orderItemId: item.id, assetId: item.digitalAssetId } },
      update: {}, // already exists — do not touch counts/expiry
      create: {
        orderItemId: item.id,
        userId: order.userId,
        assetId: item.digitalAssetId,
        status: "active",
        maxDownloads,
        expiresAt: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null,
        grantedBy,
        grantReason: reason ?? null,
      },
    });
  }
}

/** Admin comp grant (audited, permission-checked by caller). */
export async function adminGrantEntitlement(orderItemId: string, actorEmail: string, reason: string) {
  if (!reason.trim()) throw new Error("REASON_REQUIRED");
  const item = await db.orderItem.findUnique({ where: { id: orderItemId }, include: { order: true } });
  if (!item?.digitalAssetId) throw new Error("NO_DIGITAL_ASSET");
  const settings = await getSettings();
  await db.downloadEntitlement.upsert({
    where: { orderItemId_assetId: { orderItemId, assetId: item.digitalAssetId } },
    update: { status: "active", grantedBy: "admin_comp", grantReason: reason },
    create: {
      orderItemId,
      userId: item.order.userId,
      assetId: item.digitalAssetId,
      status: "active",
      maxDownloads: settings.downloadLimitDefault,
      expiresAt: new Date(Date.now() + settings.downloadExpiryDays * 24 * 60 * 60 * 1000),
      grantedBy: "admin_comp",
      grantReason: reason,
    },
  });
  await logAudit({ actorEmail, action: "entitlement_grant", targetType: "orderItem", targetId: orderItemId, detail: `admin_comp: ${reason}` });
}

export type DownloadAuthorization =
  | { ok: true; entitlement: { id: string }; filePath: string; filename: string; mimeType: string }
  | { ok: false; reasonCode: string; message: string };

/**
 * Full download authorization:
 *  - ownership via customer session, or guest capability token (hash compared in constant time)
 *  - paid state, active entitlement, expiry, download count, revocation
 *  - race-safe count increment + audit events
 * Returns the private file path ONLY on success — never a public URL.
 */
export async function authorizeDownload(entitlementId: string, guestToken?: string | null): Promise<DownloadAuthorization> {
  const ent = await db.downloadEntitlement.findUnique({
    where: { id: entitlementId },
    include: { asset: true, orderItem: { include: { order: true } } },
  });
  if (!ent) return { ok: false, reasonCode: "not_found", message: "ডাউনলোড অনুমতি পাওয়া যায়নি।" };

  const order = ent.orderItem.order;
  const session = await getSession();
  let authorized = false;

  if (session && ent.userId === session.uid) authorized = true;
  if (!authorized && session?.role === "admin") authorized = true;
  if (!authorized && guestToken && order.guestTokenHash) {
    if (safeEqual(sha256(guestToken), order.guestTokenHash)) authorized = true;
  }
  if (!authorized) {
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "unauthorized" } });
    return { ok: false, reasonCode: "unauthorized", message: "এই ফাইল ডাউনলোডের অনুমতি আপনার নেই।" };
  }

  // Rate limit per entitlement.
  const rl = rateLimit(`download:${ent.id}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "rate_limited" } });
    return { ok: false, reasonCode: "rate_limited", message: "অনেকবার চেষ্টা হয়েছে। এক ঘণ্টা পর আবার চেষ্টা করুন।" };
  }

  if (order.paymentStatus !== "paid" && order.paymentStatus !== "cod_collected") {
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "payment_pending" } });
    return { ok: false, reasonCode: "payment_pending", message: "পেমেন্ট নিশ্চিত হওয়ার পর ডাউনলোড চালু হবে।" };
  }
  if (ent.status === "revoked") {
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "revoked" } });
    return { ok: false, reasonCode: "revoked", message: "এই ডাউনলোড অনুমতিটি বাতিল করা হয়েছে।" };
  }
  if (ent.status === "expired" || (ent.expiresAt && ent.expiresAt < new Date())) {
    if (ent.status !== "expired") await db.downloadEntitlement.update({ where: { id: ent.id }, data: { status: "expired" } });
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "expired" } });
    return { ok: false, reasonCode: "expired", message: "ডাউনলোডের মেয়াদ শেষ হয়ে গেছে।" };
  }
  if (ent.downloadCount >= ent.maxDownloads) {
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "limit_reached" } });
    return { ok: false, reasonCode: "limit_reached", message: "ডাউনলোড সীমা শেষ হয়ে গেছে।" };
  }

  const filePath = resolvePrivatePath(ent.asset.storagePath);
  if (!filePath) {
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "invalid_path" } });
    return { ok: false, reasonCode: "invalid_path", message: "ফাইল পাওয়া যায়নি। সাপোর্টে যোগাযোগ করুন।" };
  }
  try {
    await stat(filePath);
  } catch {
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "file_missing" } });
    return { ok: false, reasonCode: "file_missing", message: "ফাইল পাওয়া যায়নি। সাপোর্টে যোগাযোগ করুন।" };
  }

  // Race-safe count increment: conditional update guards against over-limit races.
  const res = await db.downloadEntitlement.updateMany({
    where: { id: ent.id, downloadCount: { lt: ent.maxDownloads }, status: "active" },
    data: { downloadCount: { increment: 1 } },
  });
  if (res.count === 0) {
    await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "denied", reasonCode: "limit_reached" } });
    return { ok: false, reasonCode: "limit_reached", message: "ডাউনলোড সীমা শেষ হয়ে গেছে।" };
  }

  await db.downloadEvent.create({ data: { entitlementId: ent.id, result: "authorized", reasonCode: "ok" } });
  const title = ent.orderItem.productTitle;

  return {
    ok: true,
    entitlement: { id: ent.id },
    filePath,
    filename: `${title.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 60) || "ebook"}.pdf`,
    mimeType: ent.asset.mimeType ?? "application/pdf",
  };
}

export async function readPrivateFile(filePath: string): Promise<Buffer> {
  return readFile(filePath);
}

export type LibraryItem = {
  entitlementId: string;
  title: string;
  author: string;
  slug: string | null;
  coverImage: string | null;
  coverPattern: string;
  orderNumber: string;
  status: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string | null;
  downloadable: boolean;
  reasonCode: string | null;
  paymentStatus: string;
};

/** Build the customer's digital library (session-based). */
export async function getLibraryForSession(): Promise<LibraryItem[]> {
  const session = await getSession();
  if (!session) return [];
  const ents = await db.downloadEntitlement.findMany({
    where: { userId: session.uid },
    include: { orderItem: { include: { order: true } }, asset: true },
    orderBy: { createdAt: "desc" },
  });
  return ents.map((e) => {
    const order = e.orderItem.order;
    let reasonCode: string | null = null;
    const paid = order.paymentStatus === "paid" || order.paymentStatus === "cod_collected";
    if (!paid) reasonCode = "payment_pending";
    else if (e.status === "revoked") reasonCode = "revoked";
    else if (e.status === "expired" || (e.expiresAt && e.expiresAt < new Date())) reasonCode = "expired";
    else if (e.downloadCount >= e.maxDownloads) reasonCode = "limit_reached";
    return {
      entitlementId: e.id,
      title: e.orderItem.productTitle,
      author: e.orderItem.authorDisplay,
      slug: e.orderItem.productSlug,
      coverImage: e.orderItem.coverImage,
      coverPattern: e.orderItem.coverPattern ?? "oxblood",
      orderNumber: order.orderNumber,
      status: e.status,
      downloadCount: e.downloadCount,
      maxDownloads: e.maxDownloads,
      expiresAt: e.expiresAt?.toISOString() ?? null,
      downloadable: reasonCode === null,
      reasonCode,
      paymentStatus: order.paymentStatus,
    };
  });
}
