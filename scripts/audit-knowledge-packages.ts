/**
 * Audit Knowledge Packages for Phase 16 Iteration 2
 * Check what educational content exists in each package
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const validationTopics = [
  "cybersecurity-fundamentals",
  "machine-learning-basics",
  "css-fundamentals",
  "docker-containers",
  "nutrition-fundamentals",
  "retirement-planning-fundamentals"
];

async function main() {
  console.log("Knowledge Package Audit for Phase 16 Iteration 2");
  console.log("===============================================\n");

  for (const slug of validationTopics) {
    console.log(`\n📚 ${slug.toUpperCase()}`);
    console.log("─".repeat(60));

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id, title")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("❌ Topic not found");
      continue;
    }

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log("❌ No knowledge package found");
      continue;
    }

    // Get facts by type
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("fact_type, statement")
      .eq("package_id", pkg.id);

    if (!facts || facts.length === 0) {
      console.log("❌ No facts found");
      continue;
    }

    // Group by type
    const byType: Record<string, number> = {};
    facts.forEach(f => {
      byType[f.fact_type] = (byType[f.fact_type] || 0) + 1;
    });

    console.log(`\nTotal Facts: ${facts.length}`);
    console.log("\nFact Types:");
    Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Check for essential components
    const essential = {
      "definition": byType["definition"] || 0,
      "property": byType["property"] || 0,
      "procedural": byType["procedural"] || 0,
      "historical": byType["historical"] || 0,
      "warning": byType["warning"] || 0,
      "rule": byType["rule"] || 0,
      "comparison": byType["comparison"] || 0,
      "measurement": byType["measurement"] || 0,
    };

    console.log("\nEssential Components:");
    console.log(`  Definitions: ${essential.definition} ${essential.definition > 0 ? '✅' : '❌'}`);
    console.log(`  Properties: ${essential.property} ${essential.property > 0 ? '✅' : '❌'}`);
    console.log(`  Procedures: ${essential.procedural} ${essential.procedural > 0 ? '✅' : '❌'}`);
    console.log(`  Historical Context: ${essential.historical} ${essential.historical > 0 ? '✅' : '❌'}`);
    console.log(`  Warnings: ${essential.warning} ${essential.warning > 0 ? '✅' : '❌'}`);
    console.log(`  Rules/Best Practices: ${essential.rule} ${essential.rule > 0 ? '✅' : '❌'}`);
    console.log(`  Comparisons: ${essential.comparison} ${essential.comparison > 0 ? '✅' : '❌'}`);
    console.log(`  Measurements: ${essential.measurement} ${essential.measurement > 0 ? '✅' : '❌'}`);

    // Check for relationships
    const { data: relationships } = await supabase
      .from("knowledge_relationships")
      .select("relationship_type")
      .eq("package_id", pkg.id);

    const relCount = relationships?.length || 0;
    console.log(`\nKnowledge Graph Relationships: ${relCount} ${relCount > 0 ? '✅' : '❌'}`);

    if (relationships && relationships.length > 0) {
      const relTypes: Record<string, number> = {};
      relationships.forEach(r => {
        relTypes[r.relationship_type] = (relTypes[r.relationship_type] || 0) + 1;
      });
      console.log("  Relationship Types:");
      Object.entries(relTypes).forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });
    }

    // Check for FAQs
    const { data: faqs } = await supabase
      .from("topic_faqs")
      .select("id")
      .eq("topic_id", topic.id);

    console.log(`\nFAQs: ${faqs?.length || 0} ${(faqs?.length || 0) > 0 ? '✅' : '❌'}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Audit complete");
}

main().catch(console.error);
