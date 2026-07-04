/**
 * Verify knowledge packages are loaded correctly
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  { slug: "python-programming-fundamentals" },
  { slug: "git-version-control" },
  { slug: "investing-basics" },
  { slug: "data-structures" },
];

async function verifyPackages() {
  for (const topic of TOPICS) {
    console.log(`\n=== ${topic.slug} ===`);
    
    const { data: topicData } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", topic.slug)
      .single();
    
    if (!topicData) {
      console.log("Topic not found");
      continue;
    }
    
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id, version, status, fact_count, created_at")
      .eq("topic_id", topicData.id)
      .eq("slug", topic.slug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!pkg) {
      console.log("No package found");
      continue;
    }
    
    console.log(`Package: v${pkg.version}, status=${pkg.status}, facts=${pkg.fact_count}`);
    
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("statement, fact_type")
      .eq("package_id", pkg.id)
      .limit(5);
    
    console.log("Sample facts:");
    facts?.forEach((f: any, i: number) => {
      console.log(`  ${i+1}. [${f.fact_type}] ${f.statement.substring(0, 60)}...`);
    });
  }
}

verifyPackages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
