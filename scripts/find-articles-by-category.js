require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findArticlesByCategory(categoryId) {
  const { data, error } = await sb
    .from('topics')
    .select('id, slug, category_id, topic_translations(title)')
    .eq('category_id', categoryId)
    .limit(5);
  
  if (error) {
    console.error(`Error for category_id ${categoryId}:`, error);
    return [];
  }
  
  return data;
}

async function main() {
  // Get some sample articles to see what exists
  console.log('=== Sample Articles from Topics Table ===');
  const { data: topics, error: topicsError } = await sb
    .from('topics')
    .select('id, slug, category_id')
    .limit(20);
  
  if (topicsError) {
    console.error('Error:', topicsError);
  } else {
    topics.forEach(topic => {
      console.log(`  - ${topic.slug} (topicId: ${topic.id}, categoryId: ${topic.category_id})`);
    });
  }
  
  // Group by category_id
  const byCategory = {};
  topics.forEach(topic => {
    if (!byCategory[topic.category_id]) {
      byCategory[topic.category_id] = [];
    }
    byCategory[topic.category_id].push(topic);
  });
  
  console.log('\n=== Articles by Category ID ===');
  Object.keys(byCategory).forEach(catId => {
    console.log(`\nCategory ${catId}:`);
    byCategory[catId].forEach(topic => {
      console.log(`  - ${topic.slug}`);
    });
  });
}

main();
