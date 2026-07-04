/**
 * Phase 25: Render Validation Topics with Knowledge Experience Excellence Improvements
 *
 * Render the 5 validation topics with the new Knowledge Experience Excellence improvements:
 * - Engaging intro headings based on category and intent
 * - Category-specific opening hooks and motivation paragraphs
 * - Improved reading experience with better typography
 * - Category-specific section types
 * - Intelligent learning progression
 */

const VALIDATION_TOPICS = [
  'javascript-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'budget-travel-strategies',
  'business-strategy-fundamentals',
];

// Set environment variables before importing the renderer
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.ALLOW_RENDER = "true";

import { createClient } from '@supabase/supabase-js';
import { render } from '@/services/renderer/orchestrator';

async function main() {
  console.log('========================================');
  console.log('Phase 25: Render Validation Topics');
  console.log('Knowledge Experience Excellence Improvements');
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
    console.log(`Rendering with Knowledge Experience Excellence improvements...`);

    try {
      const renderResult = await render({
        packageId: packageData.id,
        format: 'markdown',
        rendererId: 'long-article-v2',
        style: ['intermediate'],
        forceRerender: true,
      });

      console.log(`Output ID: ${renderResult.outputId}`);
      console.log(`Word Count: ${renderResult.wordCount}`);
      console.log(`Quality Score: ${renderResult.qualityScore?.overall || 'N/A'}`);
      console.log(`✓ Render successful\n`);

      results.push({
        topic: topicSlug,
        packageId: packageData.id,
        outputId: renderResult.outputId,
        status: 'success',
        wordCount: renderResult.wordCount,
        qualityScore: renderResult.qualityScore?.overall || 0,
        error: null,
      });
    } catch (error) {
      console.log(`✗ Render failed: ${error}\n`);
      results.push({
        topic: topicSlug,
        packageId: packageData.id,
        outputId: null,
        status: 'failed',
        wordCount: 0,
        qualityScore: 0,
        error: String(error),
      });
    }
  }

  console.log('========================================');
  console.log('Summary');
  console.log('========================================\n');

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    console.log('Successful Renders:');
    successful.forEach(r => {
      console.log(`  - ${r.topic}: ${r.wordCount} words, Quality: ${r.qualityScore}/100`);
    });
  }

  if (failed.length > 0) {
    console.log('\nFailed Renders:');
    failed.forEach(r => {
      console.log(`  - ${r.topic}: ${r.error}`);
    });
  }

  // Save results to file
  const fs = require('fs');
  fs.writeFileSync(
    'scripts/output/phase25-render-results.json',
    JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2)
  );
  console.log('\nResults saved to scripts/output/phase25-render-results.json');
}

main().catch(console.error);
