/**
 * Create knowledge packages for 10 topics and render with v2
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.ALLOW_RENDER = "true";

const topics = [
  {
    slug: "machine-learning-basics",
    title: "Machine Learning Fundamentals",
    facts: [
      { statement: "Machine learning is a subset of artificial intelligence that enables computers to learn from data without explicit programming.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
      { statement: "Supervised learning uses labeled data to train models for prediction tasks like classification and regression.", factType: "property", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
      { statement: "To implement supervised learning, collect labeled data, split into training and test sets, train the model, and evaluate performance.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
      { statement: "For example, email spam filters use supervised learning to classify messages as spam or not based on labeled training data.", factType: "property", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
      { statement: "Overfitting occurs when a model learns noise in training data and performs poorly on new data.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
    ],
  },
  {
    slug: "docker-containers",
    title: "Docker Containers",
    facts: [
      { statement: "Docker containers are lightweight, standalone packages that include everything needed to run an application.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
      { statement: "Containers share the host OS kernel, making them more efficient than virtual machines which require full OS instances.", factType: "property", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
      { statement: "To create a container, write a Dockerfile with instructions, build an image, and run it with docker run command.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
      { statement: "For example, a web application container can run consistently across development, testing, and production environments.", factType: "property", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
      { statement: "Containers should not store persistent data; use volumes or external storage for data that must survive container restarts.", factType: "rule", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
    ],
  },
  {
    slug: "css-fundamentals",
    title: "CSS Fundamentals",
    facts: [
      { statement: "CSS (Cascading Style Sheets) is a style sheet language used to describe the presentation of HTML documents.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
      { statement: "CSS selectors target HTML elements based on tags, classes, IDs, or attributes to apply styles.", factType: "property", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
      { statement: "To apply styles, create a CSS file, link it in HTML with link tag, and write rules with selectors and declarations.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
      { statement: "For example, .header { background: blue; } applies a blue background to all elements with class header.", factType: "property", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
      { statement: "Avoid using !important as it breaks the cascade and makes maintenance difficult.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
    ],
  },
  {
    slug: "retirement-planning-fundamentals",
    title: "Retirement Planning Fundamentals",
    facts: [
      { statement: "Retirement planning is the process of determining retirement income goals and the actions to achieve them.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
      { statement: "The 4% rule suggests withdrawing 4% of retirement savings annually to make savings last 30 years.", factType: "property", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
      { statement: "To plan for retirement, calculate needed savings, maximize employer 401k match, open IRA, and invest in diversified portfolio.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
      { statement: "For example, someone needing $50,000 annually in retirement needs approximately $1.25 million saved following the 4% rule.", factType: "property", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
      { statement: "Failing to account for inflation can significantly reduce purchasing power in retirement.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
    ],
  },
  {
    slug: "business-strategy-fundamentals",
    title: "Business Strategy Fundamentals",
    facts: [
      { statement: "Business strategy is a long-term plan of action designed to achieve competitive advantage and meet organizational goals.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
      { statement: "SWOT analysis evaluates strengths, weaknesses, opportunities, and threats to inform strategic decisions.", factType: "property", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
      { statement: "To develop strategy, conduct market analysis, identify competitive advantage, set objectives, and create implementation roadmap.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
      { statement: "For example, Apple's strategy focuses on premium products, ecosystem integration, and brand differentiation.", factType: "property", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
      { statement: "Strategy without execution is worthless; implementation is often where strategies fail.", factType: "rule", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
    ],
  },
  {
    slug: "nutrition-fundamentals",
    title: "Nutrition Fundamentals",
    facts: [
      { statement: "Nutrition is the science of how food affects the body and provides nutrients for health and growth.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
      { statement: "Macronutrients include carbohydrates for energy, proteins for tissue repair, and fats for hormone production and nutrient absorption.", factType: "property", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
      { statement: "To eat nutritiously, focus on whole foods, balance macronutrients, stay hydrated, and limit processed foods and added sugars.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
      { statement: "For example, a balanced meal might include grilled chicken (protein), quinoa (carbs), and avocado (healthy fats).", factType: "property", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
      { statement: "Crash diets often lead to muscle loss and metabolic slowdown, making long-term weight maintenance difficult.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
    ],
  },
  {
    slug: "japan-travel-guide",
    title: "Japan Travel Guide",
    facts: [
      { statement: "Japan is an island nation in East Asia known for its blend of ancient traditions and modern technology.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
      { statement: "The Japan Rail Pass offers unlimited travel on JR trains for 7, 14, or 21 days and is cost-effective for long-distance travel.", factType: "property", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
      { statement: "To visit Japan, apply for visa if required, book flights, reserve accommodation with JR Pass delivery, and research seasonal attractions.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
      { statement: "For example, cherry blossom season in late March to early April attracts millions of visitors to parks and temples.", factType: "property", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
      { statement: "Cash is still widely used in Japan; many small businesses do not accept credit cards.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    ],
  },
  {
    slug: "cybersecurity-fundamentals",
    title: "Cybersecurity Fundamentals",
    facts: [
      { statement: "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
      { statement: "Multi-factor authentication requires multiple forms of verification, significantly reducing unauthorized access risk.", factType: "property", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
      { statement: "To improve security, use strong unique passwords, enable MFA, keep software updated, and be cautious of phishing attempts.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
      { statement: "For example, a phishing email might appear to be from your bank requesting login credentials to steal your account.", factType: "property", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
      { statement: "Using the same password across multiple sites creates a single point of failure for all accounts.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
    ],
  },
  {
    slug: "cloud-computing-fundamentals",
    title: "Cloud Computing Fundamentals",
    facts: [
      { statement: "Cloud computing is the delivery of computing services over the internet including servers, storage, databases, and software.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
      { statement: "Cloud service models include IaaS for infrastructure, PaaS for platforms, and SaaS for complete software solutions.", factType: "property", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
      { statement: "To migrate to cloud, assess workloads, choose appropriate service model, plan migration strategy, and implement monitoring.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
      { statement: "For example, Netflix uses AWS cloud services to stream content to millions of users globally with high availability.", factType: "property", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
      { statement: "Cloud costs can quickly escalate without proper monitoring and resource management.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
    ],
  },
  {
    slug: "project-management-fundamentals",
    title: "Project Management Fundamentals",
    facts: [
      { statement: "Project management is the practice of initiating, planning, executing, and closing projects to achieve specific goals.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
      { statement: "The triple constraint balances scope, time, and cost—changing one affects the others.", factType: "property", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
      { statement: "To manage projects effectively, define objectives, create work breakdown structure, schedule tasks, monitor progress, and manage risks.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
      { statement: "For example, building a house requires coordinating architects, contractors, materials, and timelines within budget constraints.", factType: "property", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
      { statement: "Poor communication is a leading cause of project failure; stakeholders must be kept informed throughout the project lifecycle.", factType: "rule", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
    ],
  },
];

async function main() {
  console.log("=== Creating Knowledge Packages and Rendering with v2 ===\n");

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const results: Array<{ topic: string; packageId: string | null; rendered: boolean; error?: string }> = [];

  for (const topic of topics) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Topic: ${topic.title}`);
    console.log(`${"=".repeat(60)}`);

    try {
      // Check if package already exists
      const { data: existing } = await sb
        .from("knowledge_packages")
        .select("id")
        .eq("slug", topic.slug)
        .maybeSingle();

      let packageId: string;

      if (existing) {
        console.log(`  ✓ Package already exists: ${existing.id}`);
        packageId = existing.id;
      } else {
        // Create new package
        const pkgId = randomUUID();
        const knowledgeHash = randomUUID().replace(/-/g, "").substring(0, 64);

        const { error: pkgError } = await sb.from("knowledge_packages").insert({
          id: pkgId,
          slug: topic.slug,
          title: topic.title,
          status: "ready",
          knowledge_hash: knowledgeHash,
          discovery_run_ids: [],
        });

        if (pkgError) throw pkgError;

        console.log(`  ✓ Package created: ${pkgId}`);
        packageId = pkgId;

        // Insert facts
        for (const fact of topic.facts) {
          const { error: factError } = await sb.from("knowledge_facts").insert({
            id: randomUUID(),
            package_id: packageId,
            statement: fact.statement,
            fact_type: fact.factType,
            confidence: fact.confidence,
            scope: fact.scope,
            tags: fact.tags,
            domain: fact.domain,
          });

          if (factError) throw factError;
        }

        console.log(`  ✓ Inserted ${topic.facts.length} facts`);
      }

      // Render with v2
      const { render } = await import("@/services/renderer/orchestrator");
      const renderResult = await render({
        packageId,
        rendererId: "long-article-v2",
        format: "html",
        forceRerender: true,
      });

      console.log(`  ✓ Rendered successfully`);
      console.log(`    Output ID: ${renderResult.outputId}`);
      console.log(`    Status: ${renderResult.status}`);
      console.log(`    Word Count: ${renderResult.content.split(/\s+/).length}`);

      results.push({ topic: topic.title, packageId, rendered: true });
    } catch (error) {
      console.log(`  ✗ Failed: ${(error as Error).message}`);
      results.push({ topic: topic.title, packageId: null, rendered: false, error: (error as Error).message });
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Total Topics: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.rendered).length}`);
  console.log(`Failed: ${results.filter(r => !r.rendered).length}`);

  if (results.filter(r => !r.rendered).length > 0) {
    console.log("\nFailed Topics:");
    results.filter(r => !r.rendered).forEach(r => {
      console.log(`  - ${r.topic}: ${r.error}`);
    });
  }
}

main().catch(console.error);
