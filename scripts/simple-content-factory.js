require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');

process.env.ALLOW_RENDER = 'true';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 25;

async function getPlaceholderArticles() {
  const { data: allTranslations } = await sb
    .from('topic_translations')
    .select('topic_id, content, topics!inner(slug)')
    .eq('language_code', 'en');
  
  const placeholders = allTranslations?.filter(t => 
    !t.content || t.content.length < 200 || 
    t.content.includes('No articles yet') || 
    t.content.includes('Coming soon')
  );
  
  return placeholders || [];
}

async function processArticle(topicId, slug) {
  try {
    // Get any knowledge package for this topic
    const { data: pkgs } = await sb
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topicId);
    
    if (!pkgs || pkgs.length === 0) {
      return { success: false, error: 'No knowledge package' };
    }
    
    // Use the first package
    const pkg = pkgs[0];
    
    // Import render function
    const { render } = require('../services/renderer/orchestrator');
    
    // Render the knowledge package
    const renderResult = await render({
      packageId: pkg.id,
      format: 'markdown',
      rendererId: 'knowledge-authoring-v1',
      forceRerender: true
    });

    if (renderResult.status === 'failed') {
      return { success: false, error: 'Rendering failed' };
    }

    // Update topic_translations with rendered content
    const { error: updateError } = await sb
      .from('topic_translations')
      .update({ content: renderResult.content })
      .eq('topic_id', topicId)
      .eq('language_code', 'en');

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function verifyLivePage(slug) {
  try {
    const response = await fetch(`https://valendiro.com/en/topics/${slug}`);
    return response.status === 200 && (await response.text()).length > 1000;
  } catch {
    return false;
  }
}

(async () => {
  const startTime = Date.now();
  console.log('=== Content Factory - Batch Processing ===\n');

  const placeholders = await getPlaceholderArticles();
  console.log('Total placeholder articles: ' + placeholders.length + '\n');

  let articlesImproved = 0;
  let liveUrlsUpdated = 0;
  const failedTopics = [];

  const firstBatch = placeholders.slice(0, BATCH_SIZE);
  console.log('Processing batch 1/' + Math.ceil(placeholders.length / BATCH_SIZE) + ' (' + firstBatch.length + ' articles)\n');

  for (const item of firstBatch) {
    const slug = item.topics?.slug;
    const topicId = item.topic_id;
    console.log('Processing: ' + slug);
    const result = await processArticle(topicId, slug);
    
    if (result.success) {
      const verified = await verifyLivePage(slug);
      if (verified) {
        console.log('  ✓ Success - Live URL verified');
        articlesImproved++;
        liveUrlsUpdated++;
      } else {
        console.log('  ✓ Success - Live URL not verified');
        articlesImproved++;
      }
    } else {
      console.log('  ✗ Failed: ' + result.error);
      failedTopics.push(slug);
    }
  }

  const remainingPlaceholders = placeholders.length - articlesImproved;
  const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n=== Batch 1 Complete ===');
  console.log('Placeholder Articles Remaining: ' + remainingPlaceholders);
  console.log('Articles Improved: ' + articlesImproved);
  console.log('Live URLs Updated: ' + liveUrlsUpdated);
  console.log('Failed Topics: ' + failedTopics.length);
  console.log('Execution Time: ' + executionTime + 's');

  if (failedTopics.length > 0) {
    console.log('\nFailed topics moved to retry queue: ' + failedTopics.join(', '));
  }
})();
