/**
 * Check which renderer was used for successfully regenerated topics
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRenderer() {
  const topics = ["python-programming-fundamentals", "git-version-control", "investing-basics", "data-structures"];

  for (const slug of topics) {
    console.log(`\n=== ${slug} ===`);
    
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("Topic not found");
      continue;
    }

    const { data: outputs } = await supabase
      .from("rendered_outputs")
      .select("renderer_id, updated_at, quality_score")
      .eq("package_id", topic.id)
      .order("updated_at", { ascending: false });

    console.log("Rendered outputs:");
    outputs?.forEach((o: any) => {
      console.log(`  - ${o.renderer_id} (quality: ${o.quality_score}, updated: ${o.updated_at})`);
    });
  }
}

checkRenderer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
