/**
 * Check publication_logs table
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

  console.log('Checking publication_logs table...');

  // Try to select from publication_logs
  const { data, error } = await supabase
    .from('publication_logs')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error querying publication_logs:', error);
  } else {
    console.log(`Found ${data?.length || 0} publication logs`);
    if (data && data.length > 0) {
      console.log('Sample log:', JSON.stringify(data[0], null, 2));
    }
  }

  // Check if table exists
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables'); // This might not exist, just trying

  console.log('\nChecking if publication_logs table exists via information_schema...');

  const { data: schemaData, error: schemaError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'publication_logs')
    .eq('table_schema', 'public');

  if (schemaError) {
    console.error('Error checking schema:', schemaError);
  } else {
    console.log('publication_logs table exists:', schemaData && schemaData.length > 0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
