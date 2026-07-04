/**
 * Phase 17A: Publish Validation Topics via Publication Pipeline
 *
 * Publish the newly rendered outputs (with 176 new facts) to the live website
 * using the Publication Pipeline.
 */

const VALIDATION_TOPICS = [
  'python-programming-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'travel-planning-fundamentals',
  'marketing-fundamentals',
];

import { PublicationPipeline } from '../services/publication/publicationPipeline';

async function main() {
  console.log('========================================');
  console.log('Phase 17A: Publish Validation Topics');
  console.log('========================================\n');

  // Initialize Publication Pipeline
  const pipeline = new PublicationPipeline({
    qualityThreshold: 0.6, // Lower threshold for Phase 17A
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

  const results = [];

  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`--- ${topicSlug} ---\n`);
    console.log(`Publishing via Publication Pipeline...`);

    try {
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
    } catch (error: any) {
      console.log(`✗ Failed: ${error.message}`);
      results.push({ topicSlug, result: { success: false, error: error.message, validation: { errors: [error.message], warnings: [], checks: {} } } });
    }
    console.log('');
  }

  console.log('========================================');
  console.log('Summary:');
  console.log(`Total topics: ${results.length}`);
  console.log(`Published: ${results.filter(r => r.result.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.result.success).length}`);

  console.log('\nDetailed Results:');
  for (const result of results) {
    console.log(`  ${result.topicSlug}: ${result.result.success ? 'PUBLISHED' : 'FAILED'}`);
  }

  console.log('\nNext step: Verify improvements on live website');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
