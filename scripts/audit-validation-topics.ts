/**
 * Audit the 6 validation topics for Phase 16 Iteration 2
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
  console.log("Phase 16 Iteration 2: Knowledge Package Audit");
  console.log("==============================================\n");

  for (const slug of validationTopics) {
    console.log(`\n📚 ${slug.toUpperCase().replace(/-/g, " ")}`);
    console.log("─".repeat(70));

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id, status, difficulty")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("❌ Topic not found");
      continue;
    }

    console.log(`Status: ${topic.status} | Difficulty: ${topic.difficulty}`);

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log("❌ No knowledge package");
      continue;
    }

    // Get facts by type
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("fact_type, statement, confidence")
      .eq("package_id", pkg.id);

    if (!facts || facts.length === 0) {
      console.log("❌ No facts");
      continue;
    }

    // Group by type
    const byType: Record<string, {count: number, statements: string[]}> = {};
    facts.forEach(f => {
      if (!byType[f.fact_type]) {
        byType[f.fact_type] = {count: 0, statements: []};
      }
      byType[f.fact_type].count++;
      byType[f.fact_type].statements.push(f.statement);
    });

    console.log(`\nTotal Facts: ${facts.length}`);
    console.log("\nFact Types:");
    Object.entries(byType).sort((a, b) => b[1].count - a[1].count).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count}`);
      data.statements.slice(0, 2).forEach(s => {
        console.log(`    - ${s.substring(0, 80)}...`);
      });
    });

    // Check for essential educational components
    const essential = {
      "definition": byType["definition"]?.count || 0,
      "property": byType["property"]?.count || 0,
      "procedural": byType["procedural"]?.count || 0,
      "historical": byType["historical"]?.count || 0,
      "warning": byType["warning"]?.count || 0,
      "rule": byType["rule"]?.count || 0,
      "comparison": byType["comparison"]?.count || 0,
      "measurement": byType["measurement"]?.count || 0,
      "causal": byType["causal"]?.count || 0,
    };

    console.log("\nEducational Components:");
    console.log(`  Definitions: ${essential.definition} ${essential.definition >= 2 ? '✅' : essential.definition > 0 ? '⚠️' : '❌'}`);
    console.log(`  Properties: ${essential.property} ${essential.property >= 3 ? '✅' : essential.property > 0 ? '⚠️' : '❌'}`);
    console.log(`  Procedures: ${essential.procedural} ${essential.procedural >= 2 ? '✅' : essential.procedural > 0 ? '⚠️' : '❌'}`);
    console.log(`  Historical: ${essential.historical} ${essential.historical > 0 ? '✅' : '❌'}`);
    console.log(`  Warnings: ${essential.warning} ${essential.warning > 0 ? '✅' : '❌'}`);
    console.log(`  Rules/Best Practices: ${essential.rule} ${essential.rule >= 2 ? '✅' : essential.rule > 0 ? '⚠️' : '❌'}`);
    console.log(`  Comparisons: ${essential.comparison} ${essential.comparison > 0 ? '✅' : '❌'}`);
    console.log(`  Measurements: ${essential.measurement} ${essential.measurement > 0 ? '✅' : '❌'}`);
    console.log(`  Causal (Why/How): ${essential.causal} ${essential.causal >= 2 ? '✅' : essential.causal > 0 ? '⚠️' : '❌'}`);

    // Check for Knowledge Graph relationships
    const { data: relationships } = await supabase
      .from("knowledge_relationships")
      .select("relationship_type, related_topic_id")
      .eq("package_id", pkg.id);

    const relCount = relationships?.length || 0;
    console.log(`\nKnowledge Graph: ${relCount} relationships ${relCount >= 3 ? '✅' : relCount > 0 ? '⚠️' : '❌'}`);

    // Check for FAQs
    const { data: faqs } = await supabase
      .from("topic_faqs")
      .select("id")
      .eq("topic_id", topic.id);

    console.log(`FAQs: ${faqs?.length || 0} ${(faqs?.length || 0) >= 3 ? '✅' : (faqs?.length || 0) > 0 ? '⚠️' : '❌'}`);

    // Overall assessment
    const score = [
      essential.definition >= 2 ? 1 : 0,
      essential.property >= 3 ? 1 : 0,
      essential.procedural >= 2 ? 1 : 0,
      essential.historical > 0 ? 1 : 0,
      essential.warning > 0 ? 1 : 0,
      essential.rule >= 2 ? 1 : 0,
      essential.comparison > 0 ? 1 : 0,
      relCount >= 3 ? 1 : 0,
      (faqs?.length || 0) >= 3 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    console.log(`\nPackage Quality: ${score}/9 components ${score >= 7 ? '✅ Strong' : score >= 4 ? '⚠️ Moderate' : '❌ Weak'}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("Audit complete");
}

main().catch(console.error);
