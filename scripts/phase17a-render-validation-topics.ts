/**
 * Phase 17A: Render Validation Topics with Knowledge Package Loader
 *
 * Trigger rendering for the 5 validation topics using the new Knowledge Package Loader
 * which loads the 176 newly added high-quality knowledge facts.
 */

const VALIDATION_TOPICS = [
  'python-programming-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'travel-planning-fundamentals',
  'marketing-fundamentals',
];

// Set environment variables before importing the renderer
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.ALLOW_RENDER = "true";

import { createClient } from '@supabase/supabase-js';
import { render } from '@/services/renderer/orchestrator';

async function main() {
  console.log('========================================');
  console.log('Phase 17A: Render Validation Topics');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: {
    topic: string;
    packageId: string;
    outputId: string | null;
    status: string;
    wordCount: number;
    qualityScore: number;
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
        packageId: '',
        outputId: null,
        status: 'failed',
        wordCount: 0,
        qualityScore: 0,
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
        packageId: '',
        outputId: null,
        status: 'failed',
        wordCount: 0,
        qualityScore: 0,
        error: 'Package not found',
      });
      continue;
    }

    console.log(`Package ID: ${packageData.id}`);
    console.log(`Rendering with Knowledge Package Loader...`);

    try {
      const renderResult = await render({
        packageId: packageData.id,
        format: 'markdown',
        rendererId: 'long-article-v2',
        style: ['intermediate'],
        forceRerender: true,
      });

      console.log(`Output ID: ${renderResult.outputId}`);
      console.log(`Status: ${renderResult.status}`);
      console.log(`Quality Score: ${renderResult.qualityScore.overall}`);
      console.log(`Word Count: ${renderResult.qualityScore.wordCount}`);
      console.log(`\n✓ Render successful for ${topicSlug}\n`);

      results.push({
        topic: topicSlug,
        packageId: packageData.id,
        outputId: renderResult.outputId,
        status: renderResult.status,
        wordCount: renderResult.qualityScore.wordCount,
        qualityScore: renderResult.qualityScore.overall,
        error: null,
      });
    } catch (error: any) {
      console.log(`✗ Render failed: ${error.message}\n`);
      results.push({
        topic: topicSlug,
        packageId: packageData.id,
        outputId: null,
        status: 'failed',
        wordCount: 0,
        qualityScore: 0,
        error: error.message,
      });
    }
  }

  console.log('========================================');
  console.log('Summary:');
  console.log(`Total topics: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.status === 'published' || r.status === 'draft').length}`);
  console.log(`Failed: ${results.filter(r => r.status === 'failed').length}`);

  console.log('\nDetailed Results:');
  for (const result of results) {
    console.log(`  ${result.topic}: ${result.status} (Quality: ${result.qualityScore}, Words: ${result.wordCount})`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }

  console.log('\nNext step: Publish via Publication Pipeline');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
