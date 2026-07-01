import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  autoGenerateTopics,
  batchAutoGenerate,
  expandSubcategory,
} from "@/services/demand/topicAutoGenerator";

/**
 * POST /api/admin/topic-auto-generate
 *
 * Body options:
 *   { mode: "single", subcategorySlug: "programming" }
 *   { mode: "single", subcategoryId: "uuid" }
 *   { mode: "batch", maxTopicsPerSubcategory?: 30, limitSubcategories?: 10 }
 *   { mode: "dry-run", subcategorySlug: "programming" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode || "single";

    if (mode === "batch") {
      const result = await batchAutoGenerate({
        maxTopicsPerSubcategory: body.maxTopicsPerSubcategory ?? 30,
        strategies: body.strategies ?? ["decomposition", "long-tail"],
        dryRun: body.dryRun ?? false,
        limitSubcategories: body.limitSubcategories ?? 10,
      });
      return NextResponse.json({ success: true, mode: "batch", result });
    }

    if (mode === "dry-run") {
      const slug = body.subcategorySlug;
      if (!slug) {
        return NextResponse.json({ error: "subcategorySlug is required for dry-run mode" }, { status: 400 });
      }
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("subcategories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) {
        return NextResponse.json({ error: `Subcategory not found: ${slug}` }, { status: 404 });
      }
      const result = await autoGenerateTopics(data.id, {
        maxTopics: body.maxTopics ?? 30,
        strategies: body.strategies ?? ["decomposition", "long-tail"],
        dryRun: true,
      });
      return NextResponse.json({ success: true, mode: "dry-run", result });
    }

    // Single mode
    if (body.subcategorySlug) {
      const result = await expandSubcategory(body.subcategorySlug);
      return NextResponse.json({ success: true, mode: "single", result });
    }

    if (body.subcategoryId) {
      const result = await autoGenerateTopics(body.subcategoryId, {
        maxTopics: body.maxTopics ?? 50,
        strategies: body.strategies ?? ["decomposition", "long-tail", "depth"],
      });
      return NextResponse.json({ success: true, mode: "single", result });
    }

    return NextResponse.json(
      { error: "Provide subcategorySlug, subcategoryId, or mode='batch'" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[topic-auto-generate] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
