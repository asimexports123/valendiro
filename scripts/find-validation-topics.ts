/**
 * Find the 5 validation topics by slug
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('========================================');
  console.log('Finding Validation Topics');
  console.log('========================================\n');

  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`Looking for: ${topicSlug}`);

    const { data: topic, error } = await supabase
      .from('topics')
      .select('*')
      .eq('slug', topicSlug)
      .single();

    if (error || !topic) {
      console.log(`  ✗ Not found\n`);
      continue;
    }

    console.log(`  ✓ Found`);
    console.log(`  ID: ${topic.id}`);
    console.log(`  Slug: ${topic.slug}`);
    console.log(`  Status: ${topic.status}`);
    console.log(`  Published At: ${topic.published_at}`);
    console.log('');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
