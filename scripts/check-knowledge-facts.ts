import "dotenv/config";
import { createAdminClient } from "../lib/supabase/admin";

const TOPICS = [
  "python-programming-fundamentals",
  "git-version-control", 
  "investing-basics",
  "data-structures"
];

async function checkKnowledgeFacts() {
  const sb = createAdminClient();

  for (const slug of TOPICS) {
    console.log(`\n=== ${slug} ===\n`);

    const { data: topic } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
    if (!topic) {
      console.log("Topic not found");
      continue;
    }

    const { data: pkg } = await sb.from("knowledge_packages").select("*").eq("topic_id", topic.id).maybeSingle();
    if (!pkg) {
      console.log("Knowledge package not found");
      continue;
    }

    const { data: facts } = await sb.from("knowledge_facts").select("*").eq("package_id", pkg.id).order("created_at");
    
    if (!facts || facts.length === 0) {
      console.log("No facts found");
      continue;
    }

    console.log(`Total facts: ${facts.length}\n`);
    console.log("Sample facts:");
    for (let i = 0; i < Math.min(5, facts.length); i++) {
      const fact = facts[i];
      console.log(`- ${fact.fact_type}: ${fact.statement.substring(0, 100)}...`);
    }
  }
}

checkKnowledgeFacts();
