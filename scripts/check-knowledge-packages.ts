/**
 * Check if knowledge packages exist for topics
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  { slug: "python-programming-fundamentals", name: "Python Programming Fundamentals" },
  { slug: "git-version-control", name: "Git Version Control" },
  { slug: "investing-basics", name: "Investing Basics" },
  { slug: "data-structures", name: "Data Structures" },
];

async function checkKnowledgePackage(slug: string, name: string) {
  console.log(`\n=== Checking ${name} (${slug}) ===`);

  try {
    // Get topic ID
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("Topic not found");
      return;
    }

    console.log(`Topic ID: ${topic.id}`);

    // Check knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id, fact_count, source_count, last_updated")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!pkg) {
      console.log("❌ No knowledge package found");
    } else {
      console.log(`✓ Knowledge package found:`);
      console.log(`  - Package ID: ${pkg.id}`);
      console.log(`  - Fact count: ${pkg.fact_count}`);
      console.log(`  - Source count: ${pkg.source_count}`);
      console.log(`  - Last updated: ${pkg.last_updated}`);

      // Check facts in package
      const { data: facts } = await supabase
        .from("knowledge_facts")
        .select("id, fact_type, statement, confidence")
        .eq("package_id", pkg.id)
        .limit(5);

      console.log(`  - Sample facts (${facts?.length || 0}):`);
      if (facts && facts.length > 0) {
        facts.forEach((f, i) => {
          console.log(`    ${i + 1}. [${f.fact_type}] ${f.statement.substring(0, 80)}...`);
        });
      }
    }

    // Check if there are any rendered outputs
    const { data: renderedOutputs } = await supabase
      .from("rendered_outputs")
      .select("id, renderer_id, updated_at")
      .eq("package_id", pkg?.id || topic.id);

    if (!renderedOutputs || renderedOutputs.length === 0) {
      console.log("❌ No rendered outputs found");
    } else {
      console.log(`✓ Rendered outputs found (${renderedOutputs.length}):`);
      renderedOutputs.forEach((r) => {
        console.log(`  - ${r.renderer_id} (updated: ${r.updated_at})`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

async function checkAllTopics() {
  console.log("=== Knowledge Package Diagnostic ===");
  
  for (const topic of TOPICS) {
    await checkKnowledgePackage(topic.slug, topic.name);
  }
}

checkAllTopics()
  .then(() => {
    console.log("\n=== Diagnostic Complete ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
