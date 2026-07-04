/**
 * Phase 25: Publish Validation Topics
 *
 * Publish the 5 rendered validation topics to the topics table via the Publication Pipeline
 */

const VALIDATION_TOPICS = [
  'javascript-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'budget-travel-strategies',
  'business-strategy-fundamentals',
];

// Set environment variables before importing
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { PublicationPipeline } from '../services/publication/publicationPipeline';

async function main() {
  console.log('========================================');
  console.log('Phase 25: Publish Validation Topics');
  console.log('========================================\n');

  // Initialize Publication Pipeline
  const pipeline = new PublicationPipeline({
    qualityThreshold: 0.6,
    requiredRendererVersion: '5.0.0',
    allowedOutputFormats: ['markdown'],
    enableCacheRevalidation: true,
    dryRun: false,
  });

  console.log('Configuration:');
  console.log(`  Quality Threshold: ${0.6}`);
  console.log(`  Required Renderer Version: 5.0.0`);
  console.log(`  Allowed Formats: markdown`);
  console.log(`  Cache Revalidation: enabled`);
  console.log(`  Dry Run: false\n`);

  const results: {
    topic: string;
    success: boolean;
    error: string | null;
  }[] = [];

  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`--- ${topicSlug} ---\n`);
    console.log(`Publishing via Publication Pipeline...`);

    try {
      const result = await pipeline.publishByTopicSlug(topicSlug, 'en');
      results.push({
        topic: topicSlug,
        success: result.success,
        error: result.error || null,
      });

      if (result.success) {
        console.log(`✓ Success\n`);
      } else {
        console.log(`✗ Failed: ${result.error}\n`);
      }
    } catch (error) {
      console.log(`✗ Failed: ${error}\n`);
      results.push({
        topic: topicSlug,
        success: false,
        error: String(error),
      });
    }
  }

  console.log('========================================');
  console.log('Summary');
  console.log('========================================\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    console.log('Successful Publishes:');
    successful.forEach(r => {
      console.log(`  - ${r.topic}`);
    });
  }

  if (failed.length > 0) {
    console.log('\nFailed Publishes:');
    failed.forEach(r => {
      console.log(`  - ${r.topic}: ${r.error}`);
    });
  }

  // Save results to file
  const fs = require('fs');
  fs.writeFileSync(
    'scripts/output/phase25-publish-results.json',
    JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2)
  );
  console.log('\nResults saved to scripts/output/phase25-publish-results.json');
}

main().catch(console.error);
