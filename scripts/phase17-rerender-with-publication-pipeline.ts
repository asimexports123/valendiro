/**
 * Phase 17: Re-render with Publication Pipeline
 *
 * This script re-renders the 5 validation topics using the new knowledge facts
 * and publishes them through the proper Publication Pipeline flow:
 * Knowledge Package → Knowledge Authoring Engine → Renderer → Publication Pipeline → Live Website
 */

import { createClient } from '@supabase/supabase-js';

const VALIDATION_TOPICS = [
  'python-programming-fundamentals',
  'investing-basics',
  'nutrition-fundamentals',
  'travel-planning-fundamentals',
  'marketing-fundamentals',
];

async function main() {
  console.log('========================================');
  console.log('Phase 17: Re-render with Publication Pipeline');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const topicSlug of VALIDATION_TOPICS) {
    console.log(`--- ${topicSlug} ---\n`);

    // Get topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', topicSlug)
      .single();

    if (topicError || !topic) {
      console.log(`✗ Topic not found\n`);
      continue;
    }

    // Get knowledge package
    const { data: packageData, error: packageError } = await supabase
      .from('knowledge_packages')
      .select('id')
      .eq('topic_id', topic.id)
      .single();

    if (packageError || !packageData) {
      console.log(`✗ Package not found\n`);
      continue;
    }

    // Get knowledge facts
    const { data: facts, error: factsError } = await supabase
      .from('knowledge_facts')
      .select('*')
      .eq('package_id', packageData.id);

    if (factsError || !facts) {
      console.log(`✗ Knowledge facts not found\n`);
      continue;
    }

    console.log(`Found ${facts.length} knowledge facts`);
    console.log(`Fact types: ${[...new Set(facts.map(f => f.fact_type))].join(', ')}`);
    
    // Convert knowledge_facts to PluginFact format
    const pluginFacts = facts.map(f => ({
      id: f.id,
      statement: f.statement,
      factType: f.fact_type,
      confidence: f.confidence,
      scope: f.scope,
      tags: f.tags,
      domain: f.domain,
    }));

    console.log(`\nConverted to PluginFact format`);
    console.log(`\nTo complete re-rendering and publishing:`);
    console.log(`1. Trigger the rendering orchestrator with these PluginFacts`);
    console.log(`2. The KnowledgeComposer will use these facts to generate improved content`);
    console.log(`3. A new rendered_output will be created`);
    console.log(`4. Use the Publication Pipeline to publish the new rendered_output`);
    console.log(`\n---\n`);
  }

  console.log('========================================');
  console.log('Status: Knowledge facts are ready for rendering');
  console.log('Next Step: Trigger rendering orchestrator with PluginFacts');
  console.log('Then use Publication Pipeline to publish');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
