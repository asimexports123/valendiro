/**
 * Examine Current Knowledge Packages
 *
 * Examines the current state of Knowledge Packages for the 5 validation topics
 * to understand what needs to be improved.
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
  console.log('Knowledge Package Examination');
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
      .select('id, slug, category_id, difficulty')
      .eq('slug', topicSlug)
      .single();

    if (topicError || !topic) {
      console.log(`✗ Topic not found\n`);
      continue;
    }

    console.log(`Topic ID: ${topic.id}`);
    console.log(`Slug: ${topic.slug}`);
    console.log(`Category ID: ${topic.category_id}`);
    console.log(`Difficulty: ${topic.difficulty}\n`);

    // Get knowledge package
    const { data: packageData, error: packageError } = await supabase
      .from('knowledge_packages')
      .select('*')
      .eq('topic_id', topic.id)
      .single();

    if (packageError || !packageData) {
      console.log(`✗ Knowledge Package not found\n`);
      continue;
    }

    console.log(`Knowledge Package ID: ${packageData.id}`);
    console.log(`Status: ${packageData.status}`);
    console.log(`Version: ${packageData.version}`);
    console.log(`Created At: ${packageData.created_at}`);
    console.log(`Updated At: ${packageData.updated_at}\n`);

    // Get knowledge objects
    const { data: knowledgeObjects, error: objectsError } = await supabase
      .from('knowledge_objects')
      .select('id, type, title, content, metadata')
      .eq('package_id', packageData.id);

    if (objectsError || !knowledgeObjects) {
      console.log(`✗ Knowledge Objects not found\n`);
      continue;
    }

    console.log(`Knowledge Objects: ${knowledgeObjects.length}\n`);

    // Group by type
    const byType: Record<string, any[]> = {};
    knowledgeObjects.forEach(obj => {
      if (!byType[obj.type]) byType[obj.type] = [];
      byType[obj.type].push(obj);
    });

    for (const [type, objects] of Object.entries(byType)) {
      console.log(`${type}: ${objects.length}`);
      objects.slice(0, 3).forEach(obj => {
        console.log(`  - ${obj.title}`);
        if (obj.content) {
          const preview = obj.content.substring(0, 100).replace(/\n/g, ' ');
          console.log(`    ${preview}${obj.content.length > 100 ? '...' : ''}`);
        }
      });
      if (objects.length > 3) {
        console.log(`  ... and ${objects.length - 3} more`);
      }
      console.log('');
    }

    // Get current rendered output
    const { data: renderedOutput, error: renderedError } = await supabase
      .from('rendered_outputs')
      .select('id, content, document_tree, quality_score, renderer_version, created_at')
      .eq('package_id', packageData.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (renderedError || !renderedOutput) {
      console.log(`✗ Rendered Output not found\n`);
      continue;
    }

    console.log(`Current Rendered Output:`);
    console.log(`  ID: ${renderedOutput.id}`);
    console.log(`  Content Length: ${renderedOutput.content.length} chars`);
    console.log(`  Renderer Version: ${renderedOutput.renderer_version}`);
    console.log(`  Quality Score: ${JSON.stringify(renderedOutput.quality_score)}`);
    console.log(`  Created At: ${renderedOutput.created_at}\n`);

    console.log('---\n');
  }

  console.log('========================================');
  console.log('Examination Complete');
  console.log('========================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
