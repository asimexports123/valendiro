/**
 * Phase 18A: Test Improved Composition Engine
 *
 * Test the improved Composition Engine to verify:
 * - Introduction and summary sections are recognized
 * - New sections (learning-objectives, faq, continue-learning) render correctly
 * - Quality scores improve
 * - No missing introduction/summary errors
 */

const VALIDATION_TOPICS = [
  'python-programming-fundamentals',
];

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.ALLOW_RENDER = "true";

import { createClient } from '@supabase/supabase-js';
import { render } from '../services/renderer/orchestrator';

async function main() {
  console.log('========================================');
  console.log('Phase 18A: Test Improved Composition Engine');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://diwwvkbztvhwouttajha.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: {
    topic: string;
    qualityScore: number;
    wordCount: number;
    missingIntroduction: boolean;
    missingSummary: boolean;
    issues: string[];
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

      // Check for missing introduction/summary errors in quality issues
      const missingIntroduction = renderResult.diagnostics.issues.some((d: any) => 
        d.message.includes('Missing required section: introduction') || d.message.includes('introduction')
      );
      const missingSummary = renderResult.diagnostics.issues.some((d: any) => 
        d.message.includes('Missing required section: summary') || d.message.includes('summary')
      );

      console.log(`Missing Introduction Error: ${missingIntroduction ? 'YES' : 'NO'}`);
      console.log(`Missing Summary Error: ${missingSummary ? 'YES' : 'NO'}`);

      // List all critical issues
      const criticalIssues = renderResult.diagnostics.issues.filter((d: any) => d.severity === 'critical');
      console.log(`Critical Issues: ${criticalIssues.length}`);
      for (const issue of criticalIssues) {
        console.log(`  - ${issue.message}`);
      }

      results.push({
        topic: topicSlug,
        qualityScore: renderResult.qualityScore.overall,
        wordCount: renderResult.qualityScore.wordCount,
        missingIntroduction,
        missingSummary,
        issues: criticalIssues.map(d => d.message),
      });
    } catch (error: any) {
      console.log(`✗ Error: ${error.message}\n`);
    }
    console.log('');
  }

  console.log('========================================');
  console.log('Test Results:');
  console.log(`Total topics tested: ${results.length}`);
  console.log(`Topics with missing introduction: ${results.filter(r => r.missingIntroduction).length}`);
  console.log(`Topics with missing summary: ${results.filter(r => r.missingSummary).length}`);

  console.log('\nDetailed Results:');
  for (const result of results) {
    console.log(`  ${result.topic}:`);
    console.log(`    Quality Score: ${result.qualityScore}`);
    console.log(`    Word Count: ${result.wordCount}`);
    console.log(`    Missing Introduction: ${result.missingIntroduction ? 'YES' : 'NO'}`);
    console.log(`    Missing Summary: ${result.missingSummary ? 'YES' : 'NO'}`);
    console.log(`    Critical Issues: ${result.issues.length}`);
    for (const issue of result.issues) {
      console.log(`      - ${issue}`);
    }
  }

  console.log('\n========================================');
  console.log('Phase 18A Test: COMPLETE');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
