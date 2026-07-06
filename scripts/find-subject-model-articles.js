require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const subjectModels = require('../config/subject-models.json');
const keywordFamilyRegistry = require('../config/keyword-family-registry.json');

// Initialize Supabase client
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findArticlesForSubjectModels() {
  const results = {};
  
  for (const [key, model] of Object.entries(subjectModels.subjects)) {
    console.log(`\nSearching for ${model.name} articles...`);
    
    // Get detection rules from the Subject Model
    const detectionRules = model.detectionRules || [];
    
    // Extract keywords from detection rules
    let keywords = [];
    for (const rule of detectionRules) {
      if (rule.includes('slug contains:')) {
        const ruleKeywords = rule.replace('slug contains:', '').trim().split(',').map(k => k.trim());
        keywords = keywords.concat(ruleKeywords);
      }
    }
    
    if (keywords.length === 0) {
      console.log(`No slug detection rules for ${model.name}`);
      continue;
    }
    
    // Build OR query for slug matching
    let query = sb
      .from('topics')
      .select('id, slug');
    
    // Add OR conditions for each keyword
    const orConditions = keywords.map(k => `slug.ilike.%${k}%`).join(',');
    query = query.or(orConditions);
    
    const { data: topics, error } = await query.limit(5);
    
    if (error) {
      console.error(`Error fetching ${model.name} articles:`, error);
      continue;
    }
    
    if (topics && topics.length > 0) {
      // Fetch translations for each topic
      const articles = [];
      for (const topic of topics) {
        const { data: translations } = await sb
          .from('topic_translations')
          .select('title, content')
          .eq('topic_id', topic.id)
          .eq('language_code', 'en')
          .single();
        
        articles.push({
          topicId: topic.id,
          slug: topic.slug,
          title: translations?.title || 'N/A',
          hasContent: !!translations?.content
        });
      }
      
      results[key] = {
        subjectModel: model.name,
        articles: articles
      };
      console.log(`Found ${articles.length} articles for ${model.name}`);
    } else {
      console.log(`No articles found for ${model.name}`);
    }
  }
  
  return results;
}

findArticlesForSubjectModels()
  .then(results => {
    console.log('\n\n=== RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
