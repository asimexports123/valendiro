/**
 * Check facts table directly
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  "python-programming-fundamentals",
  "git-version-control",
  "investing-basics",
  "data-structures",
];

async function checkFacts() {
  for (const slug of TOPICS) {
    console.log(`\n=== ${slug} ===`);
    
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("slug", slug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!pkg) {
      console.log("No package found");
      continue;
    }
    
    console.log(`Package ID: ${pkg.id}`);
    
    const { data: facts, count } = await supabase
      .from("knowledge_facts")
      .select("*", { count: "exact" })
      .eq("package_id", pkg.id);
    
    console.log(`Facts count: ${count}`);
    
    if (count && count > 0) {
      console.log("First 3 facts:");
      facts?.slice(0, 3).forEach((f: any, i: number) => {
        console.log(`  ${i+1}. ${f.statement}`);
      });
    }
  }
}

checkFacts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
