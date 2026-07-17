/**
 * Check test topics in database and publish one for verification
 */

import { createAdminClient } from '@/lib/supabase/admin';

async function checkAndPublishTestTopic() {
  const supabase = createAdminClient();
  
  // Get test topics
  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, slug, status')
    .like('slug', '%-guide-%')
    .limit(5);
  
  if (error) {
    console.error('Error fetching topics:', error);
    return;
  }
  
  console.log(`Found ${topics?.length || 0} test topics`);
  
  if (!topics || topics.length === 0) {
    console.log('No test topics found');
    return;
  }
  
  const testTopic = topics[0];
  console.log('Test topic:', testTopic.slug, 'Status:', testTopic.status);
  
  // Publish the test topic
  const { error: updateError } = await supabase
    .from('topics')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', testTopic.id);
  
  if (updateError) {
    console.error('Error publishing topic:', updateError);
  } else {
    console.log('Successfully published topic:', testTopic.slug);
  }
}

checkAndPublishTestTopic().catch(console.error);
