/**
 * Examine Current Rendered Content
 *
 * Examines the currently published content for the 5 validation topics
 * to understand what needs to be improved.
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
  console.log('Rendered Content Examination');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`--- ${topicSlug} ---\n`);

    // Get topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, slug')
      .eq('slug', topicSlug)
      .single();

    if (topicError || !topic) {
      console.log(`✗ Topic not found\n`);
      continue;
    }

    // Get package
    const { data: packageData, error: packageError } = await supabase
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topic.id)
      .single();

    if (packageError || !packageData) {
      console.log(`✗ Package not found\n`);
      continue;
    }

    // Get rendered output
    const { data: renderedOutput, error: renderedError } = await supabase
      .from('rendered_outputs')
      .select('id, content, document_tree, quality_score, renderer_version, created_at')
      .eq('package_id', packageData.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (renderedError || !renderedOutput) {
      console.log(`✗ Rendered output not found\n`);
      continue;
    }

    console.log(`Rendered Output ID: ${renderedOutput.id}`);
    console.log(`Content Length: ${renderedOutput.content.length} chars`);
    console.log(`Renderer Version: ${renderedOutput.renderer_version}`);
    console.log(`Created At: ${renderedOutput.created_at}\n`);

    console.log(`Content Preview:`);
    const preview = renderedOutput.content.substring(0, 500).replace(/\n/g, ' ');
    console.log(`${preview}...\n`);

    console.log(`Document Tree:`);
    console.log(JSON.stringify(renderedOutput.document_tree, null, 2));
    console.log('\n---\n');
  }

  console.log('========================================');
  console.log('Examination Complete');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
