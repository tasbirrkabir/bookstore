import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";
import { upsertProduct, type ProductInput } from "@/lib/admin-service";
import { isEmailConfigured } from "@/lib/notifications";
import { isOnlinePaymentAvailable } from "@/lib/payments";

export const dynamic = "force-dynamic";

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ ok: false, error: e.message }, { status: e.status });
  console.error("[admin]", e);
  return NextResponse.json({ ok: false, error: "সার্ভার সমস্যা।" }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") ?? "stats";

    if (resource === "stats") {
      const [productCount, publishedCount, orderCount, pendingOrders, paidRevenue, codDue, lowStock, outboxPending] = await Promise.all([
        db.product.count(),
        db.product.count({ where: { status: "published" } }),
        db.order.count(),
        db.order.count({ where: { status: { in: ["pending_payment", "confirmed", "processing"] } } }),
        db.payment.aggregate({ where: { status: "paid" }, _sum: { amountMinor: true } }),
        db.order.count({ where: { paymentStatus: "cod_due" } }),
        db.productVariant.findMany({ where: { formatType: { in: ["physical", "bundle"] }, stockOnHand: { lte: 3 } }, include: { product: true }, take: 8 }),
        db.notificationOutbox.count({ where: { status: { in: ["pending", "skipped_no_provider"] } } }),
      ]);
      return NextResponse.json({
        ok: true,
        stats: {
          productCount,
          publishedCount,
          orderCount,
          pendingOrders,
          paidRevenueMinor: paidRevenue._sum.amountMinor ?? 0,
          codDueOrders: codDue,
          lowStock: lowStock.map((v) => ({ id: v.id, title: v.product.title, formatType: v.formatType, stockOnHand: v.stockOnHand })),
          outboxPending,
        },
        config: {
          emailConfigured: isEmailConfigured(),
          paymentProvider: isOnlinePaymentAvailable() ? "mock" : "disabled",
        },
      });
    }

    if (resource === "products") {
      const q = url.searchParams.get("q")?.trim();
      const status = url.searchParams.get("status");
      const rows = await db.product.findMany({
        where: {
          ...(q ? { OR: [{ title: { contains: q } }, { authorDisplay: { contains: q } }, { slug: { contains: q } }] } : {}),
          ...(status && ["draft", "published", "archived"].includes(status) ? { status } : {}),
        },
        include: { variants: true, categories: { include: { category: true } } },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      return NextResponse.json({
        ok: true,
        products: rows.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          authorDisplay: p.authorDisplay,
          status: p.status,
          featured: p.featured,
          newArrival: p.newArrival,
          editorPick: p.editorPick,
          coverImage: p.coverImage,
          coverPattern: p.coverPattern,
          updatedAt: p.updatedAt.toISOString(),
          categories: p.categories.map((pc) => pc.category.name),
          variants: p.variants.map((v) => ({ id: v.id, formatType: v.formatType, priceMinor: v.priceMinor, isActive: v.isActive, stockOnHand: v.stockOnHand })),
        })),
      });
    }

    if (resource === "product") {
      const id = url.searchParams.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "id প্রয়োজন।" }, { status: 400 });
      const { getProductForAdmin } = await import("@/lib/admin-service");
      const product = await getProductForAdmin(id);
      if (!product) return NextResponse.json({ ok: false, error: "পাওয়া যায়নি।" }, { status: 404 });
      return NextResponse.json({ ok: true, product });
    }

    if (resource === "orders") {
      const q = url.searchParams.get("q")?.trim();
      const status = url.searchParams.get("status");
      const paymentStatus = url.searchParams.get("paymentStatus");
      const rows = await db.order.findMany({
        where: {
          ...(q ? { OR: [{ orderNumber: { contains: q } }, { contactName: { contains: q } }, { contactPhone: { contains: q } }] } : {}),
          ...(status ? { status } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
        },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({
        ok: true,
        orders: rows.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentStatus,
          totalMinor: o.totalMinor,
          contactName: o.contactName,
          contactPhone: o.contactPhone,
          createdAt: o.createdAt.toISOString(),
          itemCount: o.items.length,
          hasDigital: o.items.some((i) => i.digitalAssetId),
        })),
      });
    }

    if (resource === "order") {
      const id = url.searchParams.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "id প্রয়োজন।" }, { status: 400 });
      const order = await db.order.findUnique({
        where: { id },
        include: {
          items: { include: { entitlements: true } },
          payments: { orderBy: { createdAt: "desc" } },
          events: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!order) return NextResponse.json({ ok: false, error: "পাওয়া যায়নি।" }, { status: 404 });
      return NextResponse.json({ ok: true, order: { ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(), guestTokenHash: undefined, events: order.events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })), items: order.items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), entitlements: i.entitlements.map((en) => ({ id: en.id, status: en.status, downloadCount: en.downloadCount, maxDownloads: en.maxDownloads, grantedBy: en.grantedBy })), })), payments: order.payments.map((p) => ({ id: p.id, provider: p.provider, providerTxnId: p.providerTxnId, amountMinor: p.amountMinor, status: p.status, method: p.method, verifiedAt: p.verifiedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() })) } });
    }

    if (resource === "categories") {
      const rows = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
      return NextResponse.json({ ok: true, categories: rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name, nameEn: c.nameEn, description: c.description, sortOrder: c.sortOrder, isActive: c.isActive, productCount: c._count.products })) });
    }

    if (resource === "collections") {
      const rows = await db.collection.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
      return NextResponse.json({ ok: true, collections: rows.map((c) => ({ id: c.id, slug: c.slug, title: c.title, description: c.description, sortOrder: c.sortOrder, isActive: c.isActive, productCount: c._count.products })) });
    }

    if (resource === "coupons") {
      const rows = await db.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { redemptions: true } } } });
      return NextResponse.json({ ok: true, coupons: rows.map((c) => ({ id: c.id, code: c.code, description: c.description, discountType: c.discountType, discountValue: c.discountValue, minSpendMinor: c.minSpendMinor, maxDiscountMinor: c.maxDiscountMinor, appliesToFormat: c.appliesToFormat, startsAt: c.startsAt?.toISOString() ?? null, endsAt: c.endsAt?.toISOString() ?? null, usageLimit: c.usageLimit, usageCount: c.usageCount, isActive: c.isActive, redemptions: c._count.redemptions })) });
    }

    if (resource === "settings") {
      const { getSettings } = await import("@/lib/settings");
      const s = await getSettings();
      return NextResponse.json({ ok: true, settings: s, emailConfigured: isEmailConfigured(), paymentProvider: isOnlinePaymentAvailable() ? "mock" : "disabled" });
    }

    if (resource === "audit") {
      const rows = await db.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
      return NextResponse.json({ ok: true, entries: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
    }

    if (resource === "outbox") {
      const rows = await db.notificationOutbox.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { order: { select: { orderNumber: true } } } });
      return NextResponse.json({ ok: true, messages: rows.map((r) => ({ id: r.id, kind: r.kind, toEmail: r.toEmail, subject: r.subject, status: r.status, statusDetail: r.statusDetail, orderNumber: r.order?.orderNumber ?? null, createdAt: r.createdAt.toISOString() })) });
    }

    if (resource === "private_assets") {
      const rows = await db.asset.findMany({ where: { kind: "private_pdf" }, orderBy: { createdAt: "desc" }, take: 50 });
      return NextResponse.json({ ok: true, assets: rows.map((a) => ({ id: a.id, originalFilename: a.originalFilename, sizeBytes: a.sizeBytes, rightsConfirmedAt: a.rightsConfirmedAt?.toISOString() ?? null, usedByVariants: 0, createdAt: a.createdAt.toISOString() })) });
    }

    return NextResponse.json({ ok: false, error: "অজানা রিসোর্স।" }, { status: 400 });
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (action === "product_upsert") {
      const res = await upsertProduct(body.product as ProductInput, body.id || undefined, admin.email);
      if (!res.ok) return NextResponse.json(res, { status: 400 });
      return NextResponse.json(res);
    }
    if (action === "product_delete") {
      const { deleteProduct } = await import("@/lib/admin-service");
      const res = await deleteProduct(body.id, admin.email);
      if (!res.ok) return NextResponse.json(res, { status: 400 });
      return NextResponse.json(res);
    }
    if (action === "category_upsert") {
      const { upsertCategory } = await import("@/lib/admin-service");
      const res = await upsertCategory(body.category);
      if (!res.ok) return NextResponse.json(res, { status: 400 });
      return NextResponse.json(res);
    }
    if (action === "category_delete") {
      const { deleteCategory } = await import("@/lib/admin-service");
      return NextResponse.json(await deleteCategory(body.id));
    }
    if (action === "collection_upsert") {
      const { upsertCollection } = await import("@/lib/admin-service");
      const res = await upsertCollection(body.collection);
      if (!res.ok) return NextResponse.json(res, { status: 400 });
      return NextResponse.json(res);
    }
    if (action === "collection_delete") {
      const { deleteCollection } = await import("@/lib/admin-service");
      return NextResponse.json(await deleteCollection(body.id));
    }
    if (action === "coupon_upsert") {
      const { upsertCoupon } = await import("@/lib/admin-service");
      const res = await upsertCoupon(body.coupon);
      if (!res.ok) return NextResponse.json(res, { status: 400 });
      return NextResponse.json(res);
    }
    if (action === "coupon_delete") {
      const { deleteCoupon } = await import("@/lib/admin-service");
      return NextResponse.json(await deleteCoupon(body.id));
    }
    if (action === "order_status") {
      const { updateOrderStatus } = await import("@/lib/admin-service");
      const res = await updateOrderStatus({ orderId: body.orderId, toStatus: body.toStatus, note: body.note, trackingId: body.trackingId, courierProvider: body.courierProvider }, admin.email);
      if (!res.ok) return NextResponse.json(res, { status: 400 });
      return NextResponse.json(res);
    }
    if (action === "order_payment") {
      const { updateOrderPaymentStatus } = await import("@/lib/admin-service");
      const res = await updateOrderPaymentStatus({ orderId: body.orderId, action: body.paymentAction }, admin.email);
      if (!res.ok) return NextResponse.json(res, { status: 400 });
      return NextResponse.json(res);
    }
    if (action === "order_admin_note") {
      const note = String(body.note ?? "").trim().slice(0, 1000);
      if (!note) return NextResponse.json({ ok: false, error: "নোট লিখুন।" }, { status: 400 });
      const order = await db.order.findUnique({ where: { id: body.orderId } });
      if (!order) return NextResponse.json({ ok: false, error: "অর্ডার পাওয়া যায়নি।" }, { status: 404 });
      await db.$transaction([
        db.order.update({ where: { id: order.id }, data: { adminNote: note } }),
        db.orderEvent.create({ data: { orderId: order.id, type: "note", message: "প্রাইভেট অ্যাডমিন নোট আপডেট হয়েছে", actor: `admin:${admin.email}` } }),
      ]);
      await (await import("@/lib/audit")).logAudit({ actorEmail: admin.email, action: "order_admin_note", targetType: "order", targetId: order.id });
      return NextResponse.json({ ok: true });
    }
    if (action === "entitlement_comp") {
      const { compEntitlement } = await import("@/lib/admin-service");
      const res = await compEntitlement(body.orderItemId, String(body.reason ?? ""), admin.email);
      if (!res.ok) return NextResponse.json(res, { status: 400 });
      return NextResponse.json(res);
    }
    if (action === "settings_update") {
      const { updateSettings } = await import("@/lib/settings");
      const allowed = [
        "storeName", "storeNameEn", "tagline", "supportEmail", "supportPhone", "addressLine", "facebookUrl",
        "announcement", "announcementEnabled", "shippingInsideDhaka", "shippingOutsideDhaka", "freeShippingThreshold",
        "deliveryEstimateInside", "deliveryEstimateOutside", "downloadLimitDefault", "downloadExpiryDays", "codEnabled", "returnWindowDays", "aboutText",
      ] as const;
      const patch: Record<string, unknown> = {};
      for (const key of allowed) {
        if (body.settings?.[key] !== undefined) patch[key] = body.settings[key];
      }
      if (typeof patch.shippingInsideDhaka === "number") patch.shippingInsideDhaka = Math.max(0, Math.round(patch.shippingInsideDhaka));
      if (typeof patch.shippingOutsideDhaka === "number") patch.shippingOutsideDhaka = Math.max(0, Math.round(patch.shippingOutsideDhaka));
      const s = await updateSettings(patch);
      await (await import("@/lib/audit")).logAudit({ actorEmail: admin.email, action: "settings_update", targetType: "storeSetting", targetId: "main" });
      return NextResponse.json({ ok: true, settings: s });
    }

    return NextResponse.json({ ok: false, error: "অজানা অ্যাকশন।" }, { status: 400 });
  } catch (e) {
    return err(e);
  }
}
