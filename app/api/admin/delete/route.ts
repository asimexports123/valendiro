import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, isSecretAuthorized } from "@/lib/api/admin-auth";

const ALLOWED_TABLES = ["topics", "articles", "questions", "subcategories", "entities"] as const;
type AllowedTable = typeof ALLOWED_TABLES[number];

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { table, id, secret } = body;

  const isLocalDev = process.env.NODE_ENV === "development" &&
    isSecretAuthorized(secret);

  if (!isLocalDev) {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);
    if (!auth.allowed) return auth.response;
  }

  if (!table || !ALLOWED_TABLES.includes(table as AllowedTable)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from(table as AllowedTable).delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
