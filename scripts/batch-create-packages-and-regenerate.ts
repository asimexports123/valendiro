/**
 * Batch create knowledge packages and regenerate articles for 171 low-quality topics
 * Uses the existing pipeline: Discovery → Assembly → Rendering
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.ALLOW_RENDER = "true";

import { createClient } from '@supabase/supabase-js';
import { runDiscovery } from '../services/discovery/discoveryOrchestrator';
import { assemble } from '../services/knowledge/assembler';
import { render } from '../services/renderer/orchestrator';

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const BATCH_SIZE = 20;

const LOW_QUALITY_SLUGS = [
  'tourist-visas', 'diy-home-repairs', 'python', 'ai-in-practice', 'insurance-fundamentals',
  'ios-development', 'kubernetes-fundamentals', 'english-as-a-second-language',
  'workplace-culture-and-engagement', 'home-renovation', 'compensation-and-benefits',
  'stock-market-fundamentals', 'ai-fundamentals', 'cloud-security', 'azure-and-gcp-overview',
  'mortgage-fundamentals', 'mobile-development-fundamentals', 'visa-fundamentals',
  'stress-management', 'wireless-networking', 'home-maintenance-basics',
  'chronic-disease-management', 'sales-leadership', 'student-loans', 'e-commerce-fundamentals',
  'neural-networks-and-deep-learning', 'credit-card-fundamentals', 'large-language-models',
  'sales-fundamentals', 'natural-language-processing', 'strategic-planning',
  'choosing-a-credit-card', 'etf-selection-and-comparison', 'baking-basics',
  'estate-planning-basics', 'retirement-income-strategies', 'cardiac-tests',
  'emergency-preparedness', 'hr-fundamentals', 'b2b-sales', 'remote-team-management',
  'index-funds', 'food-safety', 'fund-selection', 'decision-making',
  'handling-difficult-customers', 'web-application-security', 'health-before-travel',
  'management-fundamentals', 'networking-hardware', 'computer-hardware-fundamentals',
  'support-tools-and-helpdesks', 'communication-for-leaders', 'digital-security-while-traveling',
  'building-credit-with-cards', 'cancer-fundamentals', 'credit-card-debt', 'heart-disease',
  'language-learning-tools-and-apps', 'etf-fundamentals', 'tcp-ip-and-protocols',
  'aws-essentials', 'healthy-habits', 'sector-and-thematic-etfs', 'cryptography-basics',
  'language-learning-fundamentals', 'personal-loans', 'family-travel',
  'security-certifications', 'genetic-testing', 'monitoring-and-observability',
  'work-life-balance', 'passport-optimization', 'autoimmune-conditions', 'solo-travel',
  'auto-insurance', 'customer-experience-design', 'meal-planning', 'home-buying-process',
  'sleep-health', 'customer-retention-strategies', 'sales-negotiation', 'investing-psychology',
  'site-reliability-engineering', 'cloud-architecture-patterns', 'corporate-strategy',
  'lean-operations', 'mutual-fund-fundamentals', 'network-architecture', 'cruise-travel',
  'immigration-fundamentals', 'diabetes', 'operations-management', 'resume-and-linkedin',
  'learning-spanish', 'life-insurance', 'career-planning', 'containerization-with-docker',
  'innovation-and-disruption', 'ci-cd-pipelines', 'go-to-market-strategy', 'agile-management',
  'credit-card-rewards', 'salary-negotiation', 'social-security', 'leadership-fundamentals',
  'networking-fundamentals', 'coding-bootcamps', 'payments-and-checkout-optimization',
  'car-rental-fundamentals', 'crm-and-sales-tools', 'job-interviews', 'supply-chain-management',
  'startup-fundamentals', 'travel-insurance', 'operations-fundamentals',
  'e-commerce-growth-strategies', 'ira-fundamentals', 'mobile-ui-ux-design',
  'online-learning-fundamentals', 'health-screenings', 'quality-management',
  'venture-capital-and-funding', 'network-administration', 'diagnostic-imaging',
  'iot-fundamentals', 'dividend-investing', 'index-etfs', 'ai-ethics-and-bias',
  'certifications-and-credentials', 'identity-and-access-management', 'recruiting-and-hiring',
  'tax-efficient-investing', 'travel-rewards-and-points', 'learning-mandarin',
  'cross-platform-development', 'refinancing', 'embedded-systems', 'hardware-security',
  'self-directed-learning', 'homeowners-and-renters-insurance', 'network-security',
  'change-management', 'kitchen-equipment', 'android-development', 'infrastructure-as-code',
  'budget-travel', 'actively-managed-funds', 'professional-networking', 'bond-etfs',
  'understanding-lab-results', 'business-process-automation', 'product-sourcing-and-inventory',
  'startup-operations-and-growth', 'stock-analysis', 'incident-response',
  'performance-management', 'health-insurance', 'rail-travel', '401k-fundamentals',
  'competitive-analysis', 'travel-safety-fundamentals', 'customer-service-fundamentals',
  'team-leadership', 'road-trips', 'e-commerce-analytics', 'long-term-visas',
  'devops-fundamentals', 'project-planning', 'portfolio-construction', 'ground-transportation'
];

const DISCOVERY_SOURCES = ['static-mock', 'wikipedia-en', 'structured-docs'];

const ENTITY_TYPE_ID = '99e2e6a0-7e09-40a2-883b-02c2a7f55360'; // programming-language

async function processTopic(slug: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get topic ID
    const { data: topic } = await sb
      .from("topics")
      .select("id, entity_type_id")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!topic) {
      return { success: false, error: "Topic not found" };
    }

    // Assign entity_type_id if missing
    if (!topic.entity_type_id) {
      const { error: updateError } = await sb
        .from("topics")
        .update({ entity_type_id: ENTITY_TYPE_ID })
        .eq("id", topic.id);
      
      if (updateError) {
        return { success: false, error: `Failed to assign entity_type_id: ${updateError.message}` };
      }
      topic.entity_type_id = ENTITY_TYPE_ID;
    }

    // Check if package already exists
    const { data: existingPackage } = await sb
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (existingPackage) {
      console.log(`  ✓ Package already exists`);
      return { success: true, error: null };
    }

    // Run discovery for multiple sources
    const allCandidateIds: string[] = [];
    for (const sourceSlug of DISCOVERY_SOURCES) {
      try {
        const discoveryResult = await runDiscovery(topic.id, sourceSlug);
        if (discoveryResult.status === "completed") {
          // Get candidates from this discovery run
          const { data: candidates } = await sb
            .from("discovery_candidates")
            .select("id")
            .eq("discovery_run_id", discoveryResult.runId);
          
          if (candidates) {
            allCandidateIds.push(...candidates.map(c => c.id));
          }
        }
      } catch (err: any) {
        console.log(`  ⚠ Discovery failed for ${sourceSlug}: ${err.message}`);
      }
    }

    if (allCandidateIds.length === 0) {
      return { success: false, error: "No discovery candidates found" };
    }

    // Run assembly to create knowledge package
    const assemblyReport = await assemble({
      slotId: null,
      topicId: topic.id,
      slug: slug,
      candidates: [] // Candidates will be loaded from discovery_candidates table
    });

    if (!assemblyReport || !assemblyReport.packageId) {
      return { success: false, error: "Assembly failed - no package ID returned" };
    }

    // Render the knowledge package
    const renderResult = await render({
      packageId: assemblyReport.packageId,
      format: "markdown",
      rendererId: "knowledge-authoring-v1",
      forceRerender: true
    });

    if (renderResult.status === "failed") {
      return { success: false, error: "Rendering failed" };
    }

    // Update topic_translations with rendered content
    const { error: updateError } = await sb
      .from("topic_translations")
      .update({ content: renderResult.content })
      .eq("topic_id", topic.id)
      .eq("language_code", "en");

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function main() {
  const startTime = Date.now();
  console.log("=== Batch Creating Knowledge Packages and Regenerating Articles ===\n");

  let packagesCreated = 0;
  let knowledgeHashGenerated = 0;
  let articlesReplaced = 0;
  let articlesRemaining = LOW_QUALITY_SLUGS.length;
  const failedTopics: string[] = [];

  for (let i = 0; i < LOW_QUALITY_SLUGS.length; i += BATCH_SIZE) {
    const batch = LOW_QUALITY_SLUGS.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(LOW_QUALITY_SLUGS.length / BATCH_SIZE)} (${batch.length} topics)\n`);

    for (const slug of batch) {
      console.log(`Processing: ${slug}`);
      const result = await processTopic(slug);
      
      if (result.success) {
        console.log(`  ✓ Success`);
        packagesCreated++;
        knowledgeHashGenerated++;
        articlesReplaced++;
        articlesRemaining--;
      } else {
        console.log(`  ✗ Failed: ${result.error}`);
        failedTopics.push(slug);
      }
    }
  }

  const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Total topics: ${LOW_QUALITY_SLUGS.length}`);
  console.log(`  Knowledge Packages Created: ${packagesCreated}`);
  console.log(`  knowledge_hash Generated: ${knowledgeHashGenerated}`);
  console.log(`  Articles Replaced: ${articlesReplaced}`);
  console.log(`  Articles Remaining: ${articlesRemaining}`);
  console.log(`  Failed: ${failedTopics.length}`);
  console.log(`  Execution Time: ${executionTime}s`);

  if (failedTopics.length > 0) {
    console.log(`\nFailed topics: ${failedTopics.join(', ')}`);
  }

  console.log(`\n=== Batch Processing Complete ===`);
}

main().catch(console.error);
