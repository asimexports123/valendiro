/**
 * Knowledge Acquisition Engine
 *
 * Acquires structured knowledge from official documentation sources
 * and populates Knowledge Packages for specified topics.
 *
 * Pipeline:
 * 1. Create discovery source for structured-docs adapter
 * 2. Run discovery to generate candidates
 * 3. Assemble knowledge package from candidates
 * 4. Validate package contains no placeholders
 * 5. Report results
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";
import { runDiscovery } from "../services/discovery/discoveryOrchestrator";
import { assemble } from "../services/knowledge/assembler";

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  { slug: "python-programming-fundamentals", name: "Python Programming Fundamentals" },
  { slug: "git-version-control", name: "Git Version Control" },
  { slug: "investing-basics", name: "Investing Basics" },
  { slug: "data-structures", name: "Data Structures" },
];

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  /type \d+/i,
  /description \d+/i,
  /key point \d+/i,
  /example \d+/i,
  /step \d+/i,
  /option [AB]/i,
  /pro \d+.*con \d+/i,
  /const result = \w+\(\);/i,
  /^\/\/ .* example \d+$/i,
  /lorem ipsum/i,
  /todo:/i,
  /placeholder/i,
];

function detectPlaceholders(content: string): string[] {
  const found: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      found.push(match[0]);
    }
  }
  return found;
}

async function ensureDiscoverySource() {
  console.log("Ensuring structured-docs discovery source exists...");

  const { data: existingSource } = await supabase
    .from("discovery_sources")
    .select("id")
    .eq("slug", "structured-docs")
    .maybeSingle();

  if (existingSource) {
    console.log("✓ Discovery source already exists");
    return existingSource.id;
  }

  const { data: newSource } = await supabase
    .from("discovery_sources")
    .insert({
      slug: "structured-docs",
      name: "Structured Documentation Adapter",
      adapter_type: "structured-docs",
      config: {},
      status: "active",
    })
    .select("id")
    .single();

  if (!newSource) {
    throw new Error("Failed to create discovery source");
  }

  console.log("✓ Discovery source created");
  return newSource.id;
}

async function acquireKnowledgeForTopic(slug: string, name: string, sourceId: string) {
  console.log(`\n=== Acquiring knowledge for ${name} (${slug}) ===`);

  try {
    // Get topic ID
    const { data: topic } = await supabase
      .from("topics")
      .select("id, entity_type_id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("❌ Topic not found");
      return { success: false, error: "Topic not found" };
    }

    console.log(`Topic ID: ${topic.id}`);

    // Run discovery
    console.log("Running discovery...");
    const discoveryResult = await runDiscovery(topic.id, "structured-docs");
    
    if (discoveryResult.status === "failed") {
      console.log(`❌ Discovery failed: ${discoveryResult.error}`);
      return { success: false, error: discoveryResult.error };
    }

    console.log(`✓ Discovery completed: ${discoveryResult.candidatesAccepted} candidates accepted`);

    // Get discovery candidates
    const { data: candidates } = await supabase
      .from("discovery_candidates")
      .select("id, title, description, source_url, discovery_runs!inner(discovery_sources!inner(adapter_name))")
      .eq("status", "accepted")
      .eq("topic_id", topic.id);

    if (!candidates || candidates.length === 0) {
      console.log("❌ No candidates found after discovery");
      return { success: false, error: "No candidates found" };
    }

    console.log(`✓ Found ${candidates.length} candidates`);

    // Map to assembly input
    const assemblyInput = {
      slotId: null,
      topicId: topic.id,
      slug: slug,
      candidates: candidates.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        sourceUrl: c.source_url,
        discoveryRunId: c.discovery_runs[0].id,
        adapterName: c.discovery_runs[0].discovery_sources[0].adapter_name,
        sourceSlug: "structured-docs",
        sourceAuthority: "official",
        metadata: { source: "structured_docs" },
      })),
    };

    // Assemble knowledge package
    console.log("Assembling knowledge package...");
    const assemblyReport = await assemble(assemblyInput);

    console.log(`✓ Package ${assemblyReport.status}: ${assemblyReport.factsCreated} facts created`);

    // Validate no placeholders
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("slug", slug)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (!pkg) {
      console.log("❌ Package not found after assembly");
      return { success: false, error: "Package not found" };
    }

    // Get facts to validate
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("statement")
      .eq("package_id", pkg.id);

    if (facts) {
      const allStatements = facts.map((f: any) => f.statement).join(" ");
      const placeholders = detectPlaceholders(allStatements);
      
      if (placeholders.length > 0) {
        console.log(`❌ Validation failed: placeholders detected: ${placeholders.join(", ")}`);
        return { success: false, error: `Placeholders detected: ${placeholders.join(", ")}` };
      }
      
      console.log(`✓ Validation passed: no placeholders detected in ${facts.length} facts`);
    }

    return { 
      success: true, 
      packageId: pkg.id,
      factsCreated: assemblyReport.factsCreated,
      candidatesAccepted: discoveryResult.candidatesAccepted,
    };

  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAcquisitionPipeline() {
  console.log("=== Knowledge Acquisition Engine ===\n");

  try {
    // Ensure discovery source exists
    const sourceId = await ensureDiscoverySource();

    const results = [];
    
    for (const topic of TOPICS) {
      const result = await acquireKnowledgeForTopic(topic.slug, topic.name, sourceId);
      results.push({ ...topic, ...result });
    }

    console.log("\n=== RESULTS ===\n");
    
    for (const result of results) {
      if (result.success) {
        console.log(`✓ ${result.name}: ${result.factsCreated} facts, ${result.candidatesAccepted} candidates`);
      } else {
        console.log(`❌ ${result.name}: ${result.error}`);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\nSummary: ${successful}/${results.length} successful, ${failed} failed`);

    if (failed > 0) {
      process.exit(1);
    }

  } catch (error: any) {
    console.error("Pipeline failed:", error);
    process.exit(1);
  }
}

runAcquisitionPipeline()
  .then(() => {
    console.log("\n=== Acquisition Complete ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
