/**
 * Database Verification Script
 *
 * Verifies the publication pipeline results in the database:
 * - topic_translations has been updated
 * - Correct language records exist
 * - Publication logs were created
 * - Published content matches the rendered output
 */

import { createClient } from '@supabase/supabase-js';

const VALIDATION_TOPICS = [
  'python-programming-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'travel-planning-fundamentals',
  'marketing-fundamentals',
];

async function main() {
  console.log('========================================');
  console.log('Database Verification');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verify topic_translations
  console.log('--- Verifying topic_translations ---\n');
  
  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`Topic: ${topicSlug}`);
    
    // Get topic ID
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, slug, status, published_at')
      .eq('slug', topicSlug)
      .single();

    if (topicError || !topic) {
      console.log(`  ✗ Topic not found`);
      continue;
    }

    console.log(`  Topic ID: ${topic.id}`);
    console.log(`  Status: ${topic.status}`);
    console.log(`  Published At: ${topic.published_at}`);

    // Get translation
    const { data: translation, error: translationError } = await supabase
      .from('topic_translations')
      .select('*')
      .eq('topic_id', topic.id)
      .eq('language_code', 'en')
      .single();

    if (translationError || !translation) {
      console.log(`  ✗ Translation not found`);
    } else {
      console.log(`  ✓ Translation found`);
      console.log(`  Language: ${translation.language_code}`);
      console.log(`  Title: ${translation.title}`);
      console.log(`  Content Length: ${translation.content?.length || 0} chars`);
      console.log(`  Updated At: ${translation.updated_at}`);
    }

    console.log('');
  }

  // 2. Verify publication_logs
  console.log('--- Verifying publication_logs ---\n');

  const { data: logs, error: logsError } = await supabase
    .from('publication_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (logsError || !logs || logs.length === 0) {
    console.log('✗ No publication logs found');
  } else {
    console.log(`✓ Found ${logs.length} publication logs\n`);
    
    for (const log of logs) {
      console.log(`Log ID: ${log.id}`);
      console.log(`  Topic ID: ${log.topic_id}`);
      console.log(`  Language: ${log.language_code}`);
      console.log(`  Success: ${log.success}`);
      console.log(`  Published At: ${log.published_at}`);
      console.log(`  Cache Invalidated: ${log.cache_invalidated}`);
      console.log(`  Created At: ${log.created_at}`);
      
      if (log.validation_result) {
        const checks = log.validation_result.checks || {};
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;
        console.log(`  Validation Checks: ${passed}/${total}`);
      }
      
      console.log('');
    }
  }

  // 3. Verify rendered outputs match published content
  console.log('--- Verifying content integrity ---\n');

  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`Topic: ${topicSlug}`);
    
    // Get topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', topicSlug)
      .single();

    if (topicError || !topic) {
      console.log(`  ✗ Topic not found\n`);
      continue;
    }

    // Get package
    const { data: packageData, error: packageError } = await supabase
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topic.id)
      .single();

    if (packageError || !packageData) {
      console.log(`  ✗ Package not found\n`);
      continue;
    }

    // Get rendered output
    const { data: renderedOutput, error: renderedError } = await supabase
      .from('rendered_outputs')
      .select('content, updated_at')
      .eq('package_id', packageData.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (renderedError || !renderedOutput) {
      console.log(`  ✗ Rendered output not found\n`);
      continue;
    }

    // Get translation
    const { data: translation, error: translationError } = await supabase
      .from('topic_translations')
      .select('content, updated_at')
      .eq('topic_id', topic.id)
      .eq('language_code', 'en')
      .single();

    if (translationError || !translation) {
      console.log(`  ✗ Translation not found\n`);
      continue;
    }

    // Compare content
    if (renderedOutput.content === translation.content) {
      console.log(`  ✓ Content matches rendered output`);
      console.log(`  Content Length: ${renderedOutput.content.length} chars`);
    } else {
      console.log(`  ✗ Content does NOT match rendered output`);
      console.log(`  Rendered Length: ${renderedOutput.content.length} chars`);
      console.log(`  Translation Length: ${translation.content.length} chars`);
    }

    console.log('');
  }

  console.log('========================================');
  console.log('Database Verification Complete');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
