/**
 * Phase 17: Re-render all topics with raw Markdown artifacts
 */

process.env.ALLOW_RENDER = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
import { render } from "../services/renderer/orchestrator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOPICS_WITH_MARKDOWN = [
  "python-programming-fundamentals",
  "javascript-fundamentals",
  "typescript-language",
  "rust-programming-language",
  "go-programming-language",
  "sql-fundamentals",
  "react-library",
  "nextjs-framework",
  "restful-apis",
  "html-fundamentals",
  "machine-learning-fundamentals",
  "pandas-data-analysis",
  "neural-networks",
  "data-visualization",
  "statistics-fundamentals",
  "algorithms-fundamentals",
  "data-structures",
  "operating-systems",
  "computer-networks",
  "git-version-control",
  "software-testing",
  "design-patterns",
  "agile-development",
  "database-design",
  "budgeting-fundamentals",
  "investing-basics",
  "cryptocurrency-fundamentals",
  "effective-study-techniques",
  "online-learning-strategies",
  "career-development-fundamentals",
  "entrepreneurship-fundamentals",
  "marketing-fundamentals",
  "fitness-fundamentals",
  "mental-health-fundamentals",
  "cooking-fundamentals",
  "home-organization-fundamentals",
  "travel-planning-fundamentals",
  "budget-travel-strategies"
];

async function main() {
  console.log("Phase 17: Re-rendering topics with raw Markdown artifacts");
  console.log("=========================================================\n");

  for (const slug of TOPICS_WITH_MARKDOWN) {
    console.log(`Processing: ${slug}`);

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!topic) {
      console.log(`  ❌ Topic not found or not published\n`);
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

    // Trigger re-render
    try {
      const result = await render({
        packageId: pkg.id,
        format: "html",
        rendererId: "long-article-v2",
        style: ["intermediate"],
        forceRerender: true,
      });

      console.log(`  ✅ Re-rendered successfully`);
      console.log(`     Quality Score: ${result.quality?.overall || "N/A"}/100`);
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }

    console.log();
  }

  console.log("=========================================================");
  console.log("Re-rendering complete");
}

main().catch(console.error);
