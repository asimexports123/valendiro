/**
 * Check if knowledge packages have citations and required fact types
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPackages() {
  const topics = ["python-programming-fundamentals", "git-version-control", "401k-fundamentals"];

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

    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pkg) {
      console.log("No package found");
      continue;
    }

    // Check facts
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("fact_type")
      .eq("package_id", pkg.id);

    const factTypes: Record<string, number> = {};
    facts?.forEach((f: any) => {
      factTypes[f.fact_type] = (factTypes[f.fact_type] || 0) + 1;
    });

    console.log(`Facts: ${facts?.length || 0}`);
    console.log(`Fact types: ${JSON.stringify(factTypes)}`);
    console.log(`Has definition: ${!!factTypes['definition']}`);

    // Check citations
    const { data: citations } = await supabase
      .from("knowledge_citations")
      .select("id")
      .eq("package_id", pkg.id);

    console.log(`Citations: ${citations?.length || 0}`);
  }
}

checkPackages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
