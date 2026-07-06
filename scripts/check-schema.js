require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Check topics table structure
  console.log('=== Topics Table ===');
  const { data: topics, error: topicsError } = await sb
    .from('topics')
    .select('*')
    .limit(1);
  
  if (topicsError) {
    console.error('Error:', topicsError);
  } else if (topics && topics.length > 0) {
    console.log('Sample topic:', Object.keys(topics[0]));
  }
  
  // Check topic_translations table structure
  console.log('\n=== Topic Translations Table ===');
  const { data: translations, error: transError } = await sb
    .from('topic_translations')
    .select('*')
    .limit(1);
  
  if (transError) {
    console.error('Error:', transError);
  } else if (translations && translations.length > 0) {
    console.log('Sample translation:', Object.keys(translations[0]));
  }
  
  // Try to get some articles with their topics
  console.log('\n=== Sample Articles ===');
  const { data: articles, error: articlesError } = await sb
    .from('topic_translations')
    .select('topic_id, title, slug')
    .eq('language_code', 'en')
    .limit(10);
  
  if (articlesError) {
    console.error('Error:', articlesError);
  } else {
    articles.forEach(art => {
      console.log(`  - ${art.slug} (topicId: ${art.topic_id})`);
    });
  }
}

main();
