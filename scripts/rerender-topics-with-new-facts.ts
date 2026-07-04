/**
 * Re-render Topics with New Knowledge Facts
 *
 * This script triggers re-rendering of the 5 validation topics
 * using the newly created high-quality knowledge facts.
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
  console.log('Re-rendering Topics with New Facts');
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

    // Get knowledge facts
    const { data: facts, error: factsError } = await supabase
      .from('knowledge_facts')
      .select('*')
      .eq('package_id', packageData.id);

    if (factsError || !facts) {
      console.log(`✗ Knowledge facts not found\n`);
      continue;
    }

    console.log(`Found ${facts.length} knowledge facts`);
    console.log(`Fact types: ${[...new Set(facts.map(f => f.fact_type))].join(', ')}`);
    console.log(`\nTo re-render this topic, you need to trigger the rendering pipeline.`);
    console.log(`The rendering system should use these knowledge facts to generate improved content.`);
    console.log(`\n---\n`);
  }

  console.log('========================================');
  console.log('Next Steps:');
  console.log('1. Trigger the rendering pipeline for each topic');
  console.log('2. The renderer will use the new knowledge facts');
  console.log('3. New rendered_outputs will be created');
  console.log('4. Use the Publication Pipeline to publish the improved content');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
