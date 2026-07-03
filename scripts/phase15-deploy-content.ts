/**
 * Phase 15 Content Deployment
 * 
 * Re-render articles to apply Phase 15 renderer changes:
 * - Remove Sources section
 * - Add Knowledge Graph semantic recommendations
 * - Add Learning Journey
 * - Improve examples and explanations
 */

process.env.ALLOW_RENDER = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { render } from "../services/renderer/orchestrator";

const TOPICS_TO_RENDER = [
  "machine-learning-basics",
  "css-fundamentals",
  "docker-containers",
  "nutrition-fundamentals",
  "retirement-planning-fundamentals",
];

async function main() {
  console.log("Phase 15 Content Deployment");
  console.log("==========================\n");

  for (const slug of TOPICS_TO_RENDER) {
    console.log(`Processing: ${slug}`);
    
    // Get topic from database
    const topicResponse = await fetch(`https://diwwvkbztvhwouttajha.supabase.co/rest/v1/topics?slug=eq.${slug}&select=id,knowledge_packages(id)`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY',
        'Content-Type': 'application/json'
      }
    });

    const topic = await topicResponse.json();

    if (!topic || topic.length === 0) {
      console.log(`  ❌ Topic not found\n`);
      continue;
    }

    const pkg = topic[0].knowledge_packages?.[0];
    if (!pkg) {
      console.log(`  ❌ No knowledge package found\n`);
      continue;
    }

    console.log(`  Package ID: ${pkg.id}`);

    // Trigger re-render directly using orchestrator
    try {
      const result = await render({
        packageId: pkg.id,
        format: "html",
        rendererId: "long-article-v2-v5.0.0",
        style: ["intermediate"],
        forceRerender: true,
      });

      console.log(`  ✅ Re-rendered successfully`);
      console.log(`     Quality Score: ${result.qualityScore.overall}/100`);
      console.log(`     Status: ${result.status}`);
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }

    console.log();
  }

  console.log("==========================");
  console.log("Deployment complete");
}

main().catch(console.error);
