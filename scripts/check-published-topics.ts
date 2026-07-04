/**
 * Check published topics from publication logs
 */

import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('========================================');
  console.log('Published Topics from Publication Logs');
  console.log('========================================\n');

  const { data: logs, error } = await supabase
    .from('publication_logs')
    .select('topic_id, success, published_at')
    .eq('success', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching publication logs:', error);
    process.exit(1);
  }

  if (!logs || logs.length === 0) {
    console.log('No publication logs found');
    return;
  }

  console.log(`Publication Logs: ${logs.length}\n`);

  // Get unique topic IDs
  const topicIds = [...new Set(logs.map(log => log.topic_id))];
  console.log(`Unique Topic IDs: ${topicIds.length}\n`);

  // Query topics by IDs
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, slug, title, status')
    .in('id', topicIds);

  if (topicsError) {
    console.error('Error fetching topics:', topicsError);
    process.exit(1);
  }

  if (!topics || topics.length === 0) {
    console.log('No topics found by IDs');
    return;
  }

  console.log(`Topics Found: ${topics.length}\n`);

  for (const topic of topics) {
    console.log(`Slug: ${topic.slug}`);
    console.log(`Title: ${topic.title}`);
    console.log(`ID: ${topic.id}`);
    console.log(`Status: ${topic.status}`);
    console.log('');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
