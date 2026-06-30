import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCategoryConfig,
  updateCategoryConfig,
  setCategoryEnabled,
  seedDefaultCategoryConfig,
  type CategoryConfig,
} from "@/services/demand/categoryConfig";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getCategoryConfig();
  return NextResponse.json({ success: true, config });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  // Toggle single category
  if (typeof body.slug === "string" && typeof body.enabled === "boolean") {
    await setCategoryEnabled(body.slug, body.enabled);
    return NextResponse.json({ success: true, message: `Category '${body.slug}' ${body.enabled ? "enabled" : "disabled"}` });
  }

  // Full config update
  if (body.config) {
    await updateCategoryConfig(body.config as CategoryConfig);
    return NextResponse.json({ success: true, message: "Category config updated" });
  }

  // Seed defaults
  if (body.action === "seed") {
    await seedDefaultCategoryConfig();
    return NextResponse.json({ success: true, message: "Default V1 category config seeded" });
  }

  return NextResponse.json({ error: "Invalid body" }, { status: 400 });
}
