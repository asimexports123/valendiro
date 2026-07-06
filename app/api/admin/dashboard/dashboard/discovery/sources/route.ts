import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  try {
    // Get RSS sources
    const { data: rssSources } = await supabase
      .from("rss_sources")
      .select("*")
      .eq("source_type", "rss")
      .order("created_at", { ascending: false });

    // Get Feedly sources
    const { data: feedlySources } = await supabase
      .from("rss_sources")
      .select("*")
      .eq("source_type", "feedly")
      .order("created_at", { ascending: false });

    // Get other sources
    const { data: officialSources } = await supabase
      .from("sources")
      .select("*")
      .eq("source_type", "official")
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: governmentSources } = await supabase
      .from("sources")
      .select("*")
      .eq("source_type", "government")
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: universitySources } = await supabase
      .from("sources")
      .select("*")
      .eq("source_type", "university")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      rssSources: rssSources || [],
      feedlySources: feedlySources || [],
      officialSources: officialSources || [],
      governmentSources: governmentSources || [],
      universitySources: universitySources || [],
    });
  } catch (error) {
    console.error("Error fetching discovery sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch discovery sources" },
      { status: 500 }
    );
  }
}
