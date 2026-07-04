/**
 * Check topics table schema
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
  console.log('Topics Table Schema');
  console.log('========================================\n');

  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching topics:', error);
    return;
  }

  if (!topics || topics.length === 0) {
    console.log('No topics found');
    return;
  }

  console.log('Sample topic structure:');
  console.log(JSON.stringify(topics[0], null, 2));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
