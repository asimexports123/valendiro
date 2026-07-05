/**
 * Force creates knowledge packages for all low-quality topics
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

// Low-quality topics identified by evaluation
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

async function main() {
  console.log("=== Force Creating Knowledge Packages for Low-Quality Topics ===\n");

  let created = 0;
  let failed = 0;
  const failedTopics: string[] = [];

  for (const slug of LOW_QUALITY_SLUGS) {
    console.log(`Processing: ${slug}`);
    
    // Get topic ID
    const { data: topic } = await sb
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!topic) {
      console.log(`  ⚠ Topic not found, skipping`);
      failed++;
      failedTopics.push(slug);
      continue;
    }

    // Check if package already exists
    const { data: existingPackage } = await sb
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (existingPackage) {
      console.log(`  ✓ Package already exists`);
      continue;
    }

    // Create knowledge package
    const { error: pkgError } = await sb
      .from("knowledge_packages")
      .insert({
        slug: slug,
        topic_id: topic.id,
        status: "draft"
      });

    if (pkgError) {
      console.log(`  ✗ Failed: ${pkgError.message}`);
      failed++;
      failedTopics.push(slug);
    } else {
      console.log(`  ✓ Created`);
      created++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Total processed: ${LOW_QUALITY_SLUGS.length}`);
  console.log(`  Packages created: ${created}`);
  console.log(`  Failed: ${failed}`);

  if (failedTopics.length > 0) {
    console.log(`\nFailed topics: ${failedTopics.join(', ')}`);
  }

  console.log(`\n=== Package Creation Complete ===`);
}

main().catch(console.error);
