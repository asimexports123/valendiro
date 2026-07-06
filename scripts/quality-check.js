require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: allTranslations } = await supabase.from('topic_translations').select('content').eq('language_code', 'en');
  
  let duplicateArticles = 0;
  let placeholderArticles = 0;
  let rawMarkdown = 0;
  let rendererArtifacts = 0;
  let brokenTOC = 0;
  let duplicateH1 = 0;
  let missingReferences = 0;
  let noArticlesYet = 0;
  
  const contentHashes = new Map();
  
  if (allTranslations) {
    for (const item of allTranslations) {
      const content = item.content || '';
      
      const hash = content.slice(0, 500);
      if (contentHashes.has(hash)) {
        duplicateArticles++;
      } else {
        contentHashes.set(hash, 1);
      }
      
      if (content.includes('No articles yet') || content.includes('Coming soon') || content.length < 200) {
        placeholderArticles++;
      }
      
      if (content.includes('No articles yet')) {
        noArticlesYet++;
      }
      
      if (content.includes('headers:{type:') || content.includes('debug') || content.includes('undefined')) {
        rendererArtifacts++;
      }
      
      if (content.includes('```') && !content.includes('<div')) {
        rawMarkdown++;
      }
      
      const h1Matches = content.match(/^# /gm);
      if (h1Matches && h1Matches.length > 1) {
        duplicateH1++;
      }
      
      if (content.includes('## Table of Contents') && !content.includes('- [')) {
        brokenTOC++;
      }
      
      if (content.length > 1000 && !content.includes('References') && !content.includes('## Sources')) {
        missingReferences++;
      }
    }
  }
  
  console.log('QUALITY');
  console.log('-------');
  console.log('Duplicate articles: ' + duplicateArticles);
  console.log('Placeholder articles: ' + placeholderArticles);
  console.log('Raw markdown: ' + rawMarkdown);
  console.log('Renderer artifacts: ' + rendererArtifacts);
  console.log('Broken TOC: ' + brokenTOC);
  console.log('Duplicate H1: ' + duplicateH1);
  console.log('Missing references: ' + missingReferences);
  console.log('"No articles yet": ' + noArticlesYet);
})();
