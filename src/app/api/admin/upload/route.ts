import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { saveUploadedAsset, deleteAsset } from "@/lib/admin-service";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ ok: false, error: e.message }, { status: e.status });
  console.error("[admin/upload]", e);
  return NextResponse.json({ ok: false, error: "আপলোড ব্যর্থ হয়েছে।" }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const rl = rateLimit(`upload:${admin.email}`, 20, 60_000);
    if (!rl.ok) return NextResponse.json({ ok: false, error: "অনেক দ্রুত আপলোড।" }, { status: 429 });

    const form = await req.formData();
    const file = form.get("file");
    const kind = form.get("kind");
    const rights = form.get("rightsConfirmed") === "true";
    const productId = typeof form.get("productId") === "string" && form.get("productId") ? String(form.get("productId")) : null;

    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "ফাইল পাওয়া যায়নি।" }, { status: 400 });
    if (kind !== "cover" && kind !== "private_pdf") return NextResponse.json({ ok: false, error: "অবৈধ ধরন।" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const res = await saveUploadedAsset({
      file: buffer,
      originalFilename: file.name || "upload",
      mimeType: file.type || (kind === "private_pdf" ? "application/pdf" : "application/octet-stream"),
      kind,
      productId,
      rightsConfirmed: rights,
    });
    if (!res.ok) return NextResponse.json(res, { status: 400 });
    return NextResponse.json(res);
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id প্রয়োজন।" }, { status: 400 });
    return NextResponse.json(await deleteAsset(id));
  } catch (e) {
    return err(e);
  }
}
