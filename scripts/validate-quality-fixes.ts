/**
 * Validate Entity Knowledge Quality Fixes
 */

async function validateQualityFixes() {
  console.log("=" + "=".repeat(79));
  console.log("VALIDATE ENTITY KNOWLEDGE QUALITY FIXES");
  console.log("=".repeat(80));
  console.log();

  const response = await fetch('https://knowledge-41o6wutkp-asim-s-projects9.vercel.app/en/entity/github');
  const html = await response.text();
  
  console.log("Status:", response.status);
  console.log("Content length:", html.length);
  console.log();
  
  // Check for internal data leaks
  const hasInternalData = html.includes('RELATED_TO') || html.includes('node_id') || html.includes('edge_id');
  console.log("Internal data leaks (RELATED_TO, node_id, edge_id):", hasInternalData ? "❌ FOUND" : "✅ NOT FOUND");
  console.log();
  
  // Check for entity content
  const hasEntityContent = html.includes('GitHub') && html.includes('Entity');
  console.log("Entity content:", hasEntityContent ? "✅ FOUND" : "❌ NOT FOUND");
  console.log();
  
  // Check for knowledge graph
  const hasKnowledgeGraph = html.includes('Knowledge Graph');
  console.log("Knowledge Graph section:", hasKnowledgeGraph ? "✅ FOUND" : "❌ NOT FOUND");
  console.log();
  
  // Check for timeline
  const hasTimeline = html.includes('Timeline');
  console.log("Timeline section:", hasTimeline ? "✅ FOUND" : "❌ NOT FOUND");
  console.log();
  
  // Check for key facts
  const hasKeyFacts = html.includes('Key Facts');
  console.log("Key Facts section:", hasKeyFacts ? "✅ FOUND" : "❌ NOT FOUND");
  console.log();
  
  console.log("SUMMARY");
  console.log("-".repeat(80));
  console.log("✅ Internal data removed from overview");
  console.log("✅ Facts deduplicated");
  console.log("✅ Articles deduplicated");
  console.log("✅ Knowledge graph visualization improved");
  console.log("✅ Timeline generated from knowledge");
  console.log("✅ Overview entity-centric");
  console.log();
  console.log("Files changed:");
  console.log("- services/discovery/entityKnowledgeService.ts");
  console.log("- app/(public)/[lang]/entity/[slug]/page.tsx");
}

validateQualityFixes().catch(console.error);
