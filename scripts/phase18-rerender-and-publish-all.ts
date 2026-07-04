/**
 * Phase 18: Re-render and Publish All Improved Topics
 *
 * Re-render and publish the 5 validation topics with world-class knowledge facts
 */

const VALIDATION_TOPICS = [
  'python-programming-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'travel-planning-fundamentals',
  'marketing-fundamentals',
];

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.ALLOW_RENDER = "true";

import { createClient } from '@supabase/supabase-js';
import { render } from '../services/renderer/orchestrator';
import { PublicationPipeline } from '../services/publication/publicationPipeline';

async function main() {
  console.log('========================================');
  console.log('Phase 18: Re-render and Publish All Topics');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://diwwvkbztvhwouttajha.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const pipeline = new PublicationPipeline({
    qualityThreshold: 0.6,
    requiredRendererVersion: '5.0.0',
    allowedOutputFormats: ['markdown'],
    enableCacheRevalidation: true,
    dryRun: false,
  });

  const results: {
    topic: string;
    rendered: boolean;
    published: boolean;
    qualityScore: number;
    wordCount: number;
    error: string | null;
  }[] = [];

  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`--- ${topicSlug} ---\n`);

    // Get topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', topicSlug)
      .single();

    if (topicError || !topic) {
      console.log(`✗ Topic not found\n`);
      results.push({
        topic: topicSlug,
        rendered: false,
        published: false,
        qualityScore: 0,
        wordCount: 0,
        error: 'Topic not found',
      });
      continue;
    }

    // Get knowledge package
    const { data: packageData, error: packageError } = await supabase
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topic.id)
      .single();

    if (packageError || !packageData) {
      console.log(`✗ Package not found\n`);
      results.push({
        topic: topicSlug,
        rendered: false,
        published: false,
        qualityScore: 0,
        wordCount: 0,
        error: 'Package not found',
      });
      continue;
    }

    // Get fact count
    const { data: facts } = await supabase
      .from('knowledge_facts')
      .select('id')
      .eq('package_id', packageData.id);

    console.log(`Facts: ${facts?.length || 0}`);
    console.log(`Rendering...`);

    try {
      // Render
      const renderResult = await render({
        packageId: packageData.id,
        format: 'markdown',
        rendererId: 'long-article-v2',
        style: ['intermediate'],
        forceRerender: true,
      });

      console.log(`Render Quality Score: ${renderResult.qualityScore.overall}`);
      console.log(`Word Count: ${renderResult.qualityScore.wordCount}`);

      // Publish
      console.log(`Publishing...`);
      const publishResult = await pipeline.publishByTopicSlug(topicSlug, 'en');

      if (publishResult.success) {
        console.log(`✓ Published successfully`);
      } else {
        console.log(`✗ Publish failed: ${publishResult.error}`);
      }

      results.push({
        topic: topicSlug,
        rendered: true,
        published: publishResult.success,
        qualityScore: renderResult.qualityScore.overall,
        wordCount: renderResult.qualityScore.wordCount,
        error: null,
      });
    } catch (error: any) {
      console.log(`✗ Error: ${error.message}\n`);
      results.push({
        topic: topicSlug,
        rendered: false,
        published: false,
        qualityScore: 0,
        wordCount: 0,
        error: error.message,
      });
    }
    console.log('');
  }

  console.log('========================================');
  console.log('Summary:');
  console.log(`Total topics: ${results.length}`);
  console.log(`Rendered: ${results.filter(r => r.rendered).length}`);
  console.log(`Published: ${results.filter(r => r.published).length}`);
  console.log(`Failed: ${results.filter(r => !r.published).length}`);

  console.log('\nDetailed Results:');
  for (const result of results) {
    console.log(`  ${result.topic}:`);
    console.log(`    Quality Score: ${result.qualityScore}`);
    console.log(`    Word Count: ${result.wordCount}`);
    console.log(`    Status: ${result.published ? 'PUBLISHED' : 'FAILED'}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }

  console.log('\n========================================');
  console.log('Phase 18 Re-render and Publish: COMPLETE');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
