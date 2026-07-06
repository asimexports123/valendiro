import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") || "updated_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  try {
    let query = supabase
      .from("articles")
      .select(`
        *,
        article_translations(title, excerpt, content, language_code),
        topics(slug, topic_translations(title))
      `, { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.ilike("slug", `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(sortBy as any, { ascending: sortOrder === "asc" }).range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > to + 1,
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
