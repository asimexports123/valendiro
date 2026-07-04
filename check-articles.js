const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkArticles() {
  // Try different table names
  console.log('Checking different table names...\n');
  
  const tables = ['articles', 'article', 'Article', 'Articles', 'public.articles'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`${table}: Error - ${error.message}`);
      } else {
        console.log(`${table}: ${count} rows`);
      }
    } catch (e) {
      console.log(`${table}: Exception - ${e.message}`);
    }
  }
  
  // Check topics table
  console.log('\n\nChecking topics table...');
  const { count: topicCount, error: topicError } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true });
  console.log('Topics count:', topicCount || 0);
  
  // Get sample topics
  const { data: topics } = await supabase
    .from('topics')
    .select('id, slug, status')
    .limit(5);
  console.log('Sample topics:', JSON.stringify(topics, null, 2));
}

checkArticles().catch(console.error);
