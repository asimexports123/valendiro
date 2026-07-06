const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAllCategories() {
  const { data: categories, error } = await supabase
    .from('category_translations')
    .select('category_id, name')
    .eq('language_code', 'en');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  
  console.log('\n=== ALL CATEGORIES IN DATABASE ===');
  categories.forEach(cat => {
    console.log(`- ${cat.name} (ID: ${cat.category_id})`);
  });
  
  return categories;
}

const categoryMap = {
  'Technology': 'technology',
  'Business': 'business',
  'Personal Finance': 'personal finance',
  'Education & Learning': 'education',
  'Health & Wellness': 'health & wellness',
  'Home & Lifestyle': 'home & lifestyle',
  'Travel & Transportation': 'travel'
};

async function queryProductionArticles() {
  const results = [];
  
  for (const [dbName, mappedName] of Object.entries(categoryMap)) {
    console.log(`\nQuerying ${dbName}...`);
    
    // First get the category_id for this category name
    const { data: categoryData, error: categoryError } = await supabase
      .from('category_translations')
      .select('category_id')
      .eq('name', dbName)
      .eq('language_code', 'en')
      .single();
    
    if (categoryError || !categoryData) {
      console.error(`Error finding category ${dbName}:`, categoryError);
      continue;
    }
    
    const categoryId = categoryData.category_id;
    
    // Now query topics with this category_id
    const { data: topics, error } = await supabase
      .from('topics')
      .select(`
        id,
        slug,
        status,
        published_at,
        category_id,
        subcategory_id,
        topic_translations(
          title,
          subtitle,
          content,
          language_code,
          meta_description
        )
      `)
      .eq('status', 'published')
      .eq('category_id', categoryId)
      .eq('topic_translations.language_code', 'en')
      .limit(3);
    
    if (error) {
      console.error(`Error querying ${dbName}:`, error);
      continue;
    }
    
    // Add category name to each topic
    const topicsWithCategory = (topics || []).map(topic => ({
      ...topic,
      category_name: mappedName
    }));
    
    console.log(`Found ${topics?.length || 0} articles in ${dbName}`);
    results.push(...topicsWithCategory);
  }
  
  return results;
}

async function main() {
  await listAllCategories();
  const articles = await queryProductionArticles();
  
  console.log('\n=== PRODUCTION ARTICLES ===');
  console.log(`Total articles found: ${articles.length}`);
  
  articles.forEach(article => {
    console.log('\n---');
    console.log(`Topic: ${article.topic_translations[0]?.title || 'N/A'}`);
    console.log(`Slug: ${article.slug}`);
    console.log(`Category: ${article.category_name}`);
    console.log(`Subcategory ID: ${article.subcategory_id}`);
    console.log(`URL: https://knowledge-os.com/topics/${article.slug}`);
    console.log(`Content length: ${article.topic_translations[0]?.content?.length || 0} chars`);
    console.log(`Published: ${article.published_at}`);
  });
  
  // Save to JSON
  const fs = require('fs');
  fs.writeFileSync(
    'data/production-validation-articles.json',
    JSON.stringify(articles, null, 2)
  );
  console.log('\nSaved to data/production-validation-articles.json');
}

main();
