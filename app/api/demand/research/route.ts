import { NextResponse } from "next/server";
import { runKeywordResearch } from "@/services/demand/keywordResearchEngine";
import { getActiveCategories } from "@/services/demand/categoryConfig";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const keywords: string[] = Array.isArray(body.keywords)
    ? body.keywords.slice(0, 50)
    : typeof body.keyword === "string"
    ? [body.keyword]
    : [];

  if (keywords.length === 0) {
    return NextResponse.json({ error: "Provide 'keyword' or 'keywords' array" }, { status: 400 });
  }

  const activeCategories = await getActiveCategories();
  const results = keywords.map((kw) => runKeywordResearch(kw, activeCategories));

  return NextResponse.json({ success: true, count: results.length, results });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword");
  if (!keyword) {
    return NextResponse.json({ error: "keyword query parameter required" }, { status: 400 });
  }

  const jobSecret = process.env.CRON_SECRET || process.env.JOB_SECRET;
  const provided = request.headers.get("x-job-secret") || url.searchParams.get("secret");
  if (jobSecret && provided !== jobSecret) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeCategories = await getActiveCategories();
  const result = runKeywordResearch(keyword, activeCategories);
  return NextResponse.json({ success: true, result });
}
