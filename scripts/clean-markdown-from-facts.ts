/**
 * Clean markdown markers from fact statements in knowledge packages
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOPICS_TO_CLEAN = [
  "sql-fundamentals",
  "nutrition-fundamentals",
  "docker-containers",
  "css-fundamentals",
  "cybersecurity-fundamentals",
  "machine-learning-basics",
  "retirement-planning-fundamentals"
];

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")  // Remove **bold**
    .replace(/\*([^*]+)\*/g, "$1");     // Remove *italic*
}

async function main() {
  console.log("Cleaning markdown from fact statements");
  console.log("======================================\n");

  for (const slug of TOPICS_TO_CLEAN) {
    console.log(`Processing: ${slug}`);

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!topic) {
      console.log(`  ❌ Topic not found\n`);
      continue;
    }

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!pkg) {
      console.log(`  ❌ No knowledge package found\n`);
      continue;
    }

    // Get facts
    const { data: facts } = await supabase
      .from("facts")
      .select("id, statement")
      .eq("package_id", pkg.id);

    if (!facts || facts.length === 0) {
      console.log(`  ❌ No facts found\n`);
      continue;
    }

    let cleanedCount = 0;
    for (const fact of facts) {
      const cleanedStatement = cleanMarkdown(fact.statement);
      if (cleanedStatement !== fact.statement) {
        const { error } = await supabase
          .from("facts")
          .update({ statement: cleanedStatement })
          .eq("id", fact.id);
        
        if (!error) {
          cleanedCount++;
        }
      }
    }

    console.log(`  ✅ Cleaned ${cleanedCount} facts\n`);
  }

  console.log("======================================");
  console.log("Cleaning complete");
}

main().catch(console.error);
