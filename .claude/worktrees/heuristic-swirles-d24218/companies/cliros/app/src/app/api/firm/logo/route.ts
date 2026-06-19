/* POST /api/firm/logo — upload firm letterhead logo (multipart form field: logo) */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadFirmLogo, getDocumentUrl } from "@/lib/document-storage";

async function getUserId(request: NextRequest): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const c = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data } = await c.auth.getUser();
    if (data?.user) return data.user.id;
  }
  const ref = url.match(/https:\/\/([^.]+)/)?.[1] || "";
  const ck = request.headers.get("cookie") || "";
  const m = ck.match(new RegExp(`sb-${ref}-auth-token(?:\\.0)?=([^;]+)`));
  if (m) {
    try {
      const parsed = JSON.parse(decodeURIComponent(m[1]));
      if (parsed?.access_token) {
        const c = createClient(url, anon, {
          global: { headers: { Authorization: `Bearer ${parsed.access_token}` } },
        });
        const { data } = await c.auth.getUser();
        return data?.user?.id || null;
      }
    } catch { /* */ }
  }
  return null;
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("logo");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing logo file" }, { status: 400 });
  }

  const name = file instanceof File ? file.name : "logo.png";
  const ext = name.split(".").pop()?.toLowerCase() || "png";
  if (!["png", "jpg", "jpeg", "webp"].includes(ext)) {
    return NextResponse.json({ error: "Logo must be PNG, JPG, or WebP" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Logo must be under 2 MB" }, { status: 400 });
  }

  const d = db();
  const { data: user } = await d.from("users").select("default_firm_id").eq("id", userId).single();
  let firmId = user?.default_firm_id as string | null;

  if (!firmId) {
    const { data: newFirm } = await d
      .from("firms")
      .insert({ owner_user_id: userId, firm_name: "My Firm", updated_at: new Date().toISOString() })
      .select("id")
      .single();
    if (!newFirm) {
      return NextResponse.json({ error: "Could not create firm" }, { status: 500 });
    }
    firmId = newFirm.id;
    await d.from("users").update({ default_firm_id: firmId }).eq("id", userId);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const { storagePath } = await uploadFirmLogo(firmId!, buf, ext);
  await d.from("firms").update({ firm_logo_path: storagePath, updated_at: new Date().toISOString() }).eq("id", firmId);

  const previewUrl = await getDocumentUrl(storagePath, 3600);
  return NextResponse.json({ ok: true, firm_logo_path: storagePath, preview_url: previewUrl });
}
