import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function groupSources(rows: Record<string, unknown>[]) {
  const buckets: Record<string, Record<string, unknown>[]> = {
    rssSources: [],
    feedlySources: [],
    officialSources: [],
    governmentSources: [],
    universitySources: [],
  };

  for (const row of rows) {
    const type = String(row.source_type ?? "rss").toLowerCase();
    const mapped = {
      id: row.id,
      name: row.name,
      url: row.url,
      source_type: type,
      status: row.status,
      trust_score: row.trust_score ?? 0,
      last_fetch: row.last_fetched_at ?? row.created_at,
      next_fetch: null,
      articles_discovered: row.articles_discovered ?? 0,
      articles_accepted: row.articles_accepted ?? 0,
      articles_rejected: row.articles_rejected ?? 0,
      failure_count: row.failure_count ?? 0,
    };

    if (type.includes("feedly")) buckets.feedlySources.push(mapped);
    else if (type.includes("official")) buckets.officialSources.push(mapped);
    else if (type.includes("government")) buckets.governmentSources.push(mapped);
    else if (type.includes("university") || type.includes("edu")) buckets.universitySources.push(mapped);
    else buckets.rssSources.push(mapped);
  }

  return buckets;
}

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .order("last_fetched_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    return NextResponse.json(groupSources(data ?? []));
  } catch (error) {
    console.error("Error fetching discovery sources:", error);
    return NextResponse.json({ error: "Failed to fetch discovery sources" }, { status: 500 });
  }
}
