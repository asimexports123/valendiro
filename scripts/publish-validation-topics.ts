/**
 * Publish Validation Topics Script
 *
 * This script publishes the 5 validation topics to the live website:
 * 1. Python Programming Fundamentals
 * 2. Investing Basics
 * 3. Nutrition Fundamentals
 * 4. Travel Planning Fundamentals
 * 5. Marketing Fundamentals
 *
 * Usage:
 * npm run publish-validation-topics
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { PublicationPipeline } from '../services/publication/publicationPipeline';

const VALIDATION_TOPICS = [
  'python-programming-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'travel-planning-fundamentals',
  'marketing-fundamentals',
];

async function main() {
  console.log('========================================');
  console.log('Publication Pipeline - Validation Topics');
  console.log('========================================\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Initialize Publication Pipeline
  const pipeline = new PublicationPipeline({
    qualityThreshold: 0.8,
    requiredRendererVersion: '4.0.0', // Updated to match actual rendered outputs
    allowedOutputFormats: ['html'],
    enableCacheRevalidation: true,
    dryRun: false, // Real publication
  });

  console.log('Configuration:');
  console.log(`  Quality Threshold: ${0.8}`);
  console.log(`  Required Renderer Version: 4.0.0`);
  console.log(`  Allowed Formats: html`);
  console.log(`  Cache Revalidation: enabled`);
  console.log(`  Dry Run: false\n`);

  // Publish each topic
  const results = [];

  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`\n--- Publishing: ${topicSlug} ---`);
    
    const result = await pipeline.publishByTopicSlug(topicSlug, 'en');
    results.push({ topicSlug, result });

    if (result.success) {
      console.log(`✓ Success`);
      console.log(`  Topic ID: ${result.topicId}`);
      console.log(`  Rendered Output ID: ${result.renderedOutputId}`);
      console.log(`  Published At: ${result.publishedAt}`);
      console.log(`  Cache Invalidated: ${result.cacheInvalidated}`);
      console.log(`  Validation Checks Passed: ${Object.values(result.validation.checks).filter(Boolean).length}/9`);
      
      if (result.validation.warnings.length > 0) {
        console.log(`  Warnings:`);
        result.validation.warnings.forEach(w => console.log(`    - ${w}`));
      }
    } else {
      console.log(`✗ Failed`);
      console.log(`  Error: ${result.error}`);
      console.log(`  Validation Errors:`);
      result.validation.errors.forEach(e => console.log(`    - ${e}`));
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('Publication Summary');
  console.log('========================================\n');

  const successCount = results.filter(r => r.result.success).length;
  const failureCount = results.filter(r => !r.result.success).length;

  console.log(`Total Topics: ${results.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failureCount}\n`);

  if (failureCount > 0) {
    console.log('Failed Topics:');
    results
      .filter(r => !r.result.success)
      .forEach(r => {
        console.log(`  - ${r.topicSlug}: ${r.result.error}`);
      });
  }

  if (successCount === results.length) {
    console.log('\n✓ All topics published successfully!');
    console.log('\nLive URLs:');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://valendiro.com';
    VALIDATION_TOPICS.forEach(topic => {
      console.log(`  - ${siteUrl}/en/topics/${topic}`);
    });
  } else {
    console.log('\n✗ Some topics failed to publish. Check errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
