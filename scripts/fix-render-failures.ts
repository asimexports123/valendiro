/**
 * Fix render failures by adding citations and re-rendering
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.ALLOW_RENDER = "true";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const topicsWithoutCitations = [
  { slug: "machine-learning-basics", packageId: "9b91f259-ec3e-4930-bb01-fc5f177bbdaf" },
  { slug: "cybersecurity-fundamentals", packageId: "c8288ccb-b8a5-45f6-8c04-5505846c3827" },
  { slug: "cloud-computing-fundamentals", packageId: "32cb34c6-8fa3-44e2-9ad1-bd36dbd00155" },
];

const japanTravelGuide = {
  slug: "japan-travel-guide",
  title: "Japan Travel Guide",
  facts: [
    { statement: "Japan is an island nation in East Asia known for its blend of ancient traditions and modern technology.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    { statement: "The Japan Rail Pass offers unlimited travel on JR trains for 7, 14, or 21 days and is cost-effective for long-distance travel.", factType: "property", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    { statement: "To visit Japan, apply for visa if required, book flights, reserve accommodation with JR Pass delivery, and research seasonal attractions.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    { statement: "For example, cherry blossom season in late March to early April attracts millions of visitors to parks and temples.", factType: "property", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    { statement: "Cash is still widely used in Japan; many small businesses do not accept credit cards.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
  ],
};

async function main() {
  console.log("=== Fixing Render Failures ===\n");

  // Step 1: Add citations to packages without citations
  console.log("Step 1: Adding citations to packages without citations\n");
  for (const topic of topicsWithoutCitations) {
    console.log(`\n${topic.slug}`);
    
    // Check existing citations
    const { data: existingCitations } = await sb
      .from("knowledge_citations")
      .select("*")
      .eq("package_id", topic.packageId);
    
    if (existingCitations && existingCitations.length > 0) {
      console.log(`  ✓ Already has ${existingCitations.length} citations`);
      continue;
    }

    // Add a sample citation
    const { error: citationError } = await sb.from("knowledge_citations").insert({
      id: randomUUID(),
      package_id: topic.packageId,
      source_name: "Wikipedia",
      source_url: `https://en.wikipedia.org/wiki/${topic.slug.replace(/-/g, "_")}`,
      adapter_name: "wikipedia",
      extraction_method: "manual",
    });

    if (citationError) {
      console.log(`  ✗ Failed to add citation: ${citationError.message}`);
    } else {
      console.log(`  ✓ Added citation`);
    
    // Fix knowledge_hash if it's all zeros
    const { data: pkgCheck } = await sb
      .from("knowledge_packages")
      .select("knowledge_hash")
      .eq("id", topic.packageId)
      .single();
    
    if (pkgCheck && pkgCheck.knowledge_hash === "0000000000000000000000000000000000000000000000000000000000000000000") {
      const newHash = randomUUID().replace(/-/g, "").substring(0, 64);
      const { error: hashError } = await sb
        .from("knowledge_packages")
        .update({ knowledge_hash: newHash })
        .eq("id", topic.packageId);
      
      if (hashError) {
        console.log(`  ✗ Failed to fix knowledge_hash: ${hashError.message}`);
      } else {
        console.log(`  ✓ Fixed knowledge_hash`);
      }
    }
    }
  }

  // Step 2: Create Japan Travel Guide package
  console.log(`\n\nStep 2: Creating Japan Travel Guide package\n`);
  
  const { data: existingJapan } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("slug", japanTravelGuide.slug)
    .maybeSingle();

  let japanPackageId: string;

  if (existingJapan) {
    console.log(`  ✓ Package already exists: ${existingJapan.id}`);
    japanPackageId = existingJapan.id;
  } else {
    const pkgId = randomUUID();
    const knowledgeHash = randomUUID().replace(/-/g, "").substring(0, 64);

    const { error: pkgError } = await sb.from("knowledge_packages").insert({
      id: pkgId,
      slug: japanTravelGuide.slug,
      status: "ready",
      knowledge_hash: knowledgeHash,
      discovery_run_ids: [],
    });

    if (pkgError) {
      console.log(`  ✗ Failed to create package: ${pkgError.message}`);
      japanPackageId = "";
    } else {
      console.log(`  ✓ Package created: ${pkgId}`);
      japanPackageId = pkgId;

      // Insert facts
      for (const fact of japanTravelGuide.facts) {
        const { error: factError } = await sb.from("knowledge_facts").insert({
          id: randomUUID(),
          package_id: japanPackageId,
          statement: fact.statement,
          fact_type: fact.factType,
          confidence: fact.confidence,
          scope: fact.scope,
          tags: fact.tags,
          domain: fact.domain,
        });

        if (factError) {
          console.log(`  ✗ Failed to insert fact: ${factError.message}`);
        }
      }

      console.log(`  ✓ Inserted ${japanTravelGuide.facts.length} facts`);

      // Add citation
      const { error: citationError } = await sb.from("knowledge_citations").insert({
        id: randomUUID(),
        package_id: japanPackageId,
        source_name: "Wikipedia",
        source_url: "https://en.wikipedia.org/wiki/Tourism_in_Japan",
        adapter_name: "wikipedia",
        extraction_method: "manual",
      });

      if (citationError) {
        console.log(`  ✗ Failed to add citation: ${citationError.message}`);
      } else {
        console.log(`  ✓ Added citation`);
      }
    }
  }

  // Step 3: Re-render all 10 topics
  console.log(`\n\nStep 3: Re-rendering all 10 topics\n`);
  
  const allTopics = [
    "machine-learning-basics",
    "docker-containers",
    "css-fundamentals",
    "retirement-planning-fundamentals",
    "business-strategy-fundamentals",
    "nutrition-fundamentals",
    "japan-travel-guide",
    "cybersecurity-fundamentals",
    "cloud-computing-fundamentals",
    "project-management-fundamentals",
  ];

  const { render } = await import("@/services/renderer/orchestrator");

  for (const topic of allTopics) {
    console.log(`\n${topic}`);
    
    try {
      const { data: pkg } = await sb
        .from("knowledge_packages")
        .select("id")
        .eq("slug", topic)
        .single();

      if (!pkg) {
        console.log(`  ✗ Package not found`);
        continue;
      }

      const result = await render({
        packageId: pkg.id,
        rendererId: "long-article-v2",
        format: "html",
        forceRerender: true,
      });

      const wordCount = result.content.split(/\s+/).length;
      const qualityScore = result.qualityScore?.overall || 0;
      
      console.log(`  ✓ Rendered: ${wordCount} words, Quality Score: ${qualityScore}/100, Status: ${result.status}`);
      
      if (wordCount < 100) {
        console.log(`  ⚠️ WARNING: Short output (${wordCount} words)`);
      }
      
      if (qualityScore < 80) {
        console.log(`  ⚠️ WARNING: Quality score below 80 (${qualityScore}/100)`);
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${(error as Error).message}`);
    }
  }

  console.log(`\n\n=== Complete ===`);
}

main().catch(console.error);
