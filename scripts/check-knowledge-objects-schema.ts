/**
 * Check knowledge_objects table schema
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
  console.log('Knowledge Objects Table Schema');
  console.log('========================================\n');

  const { data, error } = await supabase
    .from('knowledge_objects')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching knowledge objects:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No knowledge objects found');
    return;
  }

  console.log('Sample knowledge object structure:');
  console.log(JSON.stringify(data[0], null, 2));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
