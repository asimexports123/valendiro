import { createClient } from '@supabase/supabase-js';
import { render } from '../services/renderer/orchestrator';

process.env.ALLOW_RENDER = "true";

const supabaseUrl = "https://diwwvkbztvhwouttajha.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompression() {
  const topicSlug = 'python-programming-fundamentals';
  
  const { data: topic } = await supabase.from('topics').select('id').eq('slug', topicSlug).single();
  const { data: packageData } = await supabase.from('knowledge_packages').select('id').eq('topic_id', topic.id).single();
  const { data: facts } = await supabase.from('knowledge_facts').select('id').eq('package_id', packageData.id);
  
  console.log('---', topicSlug, '---');
  console.log('Facts:', facts?.length || 0);
  console.log('Rendering with compression...');
  
  const result = await render({
    packageId: packageData.id,
    format: 'markdown',
    rendererId: 'long-article-v2',
    style: ['intermediate'],
    forceRerender: true,
  });
  
  console.log('Quality Score:', result.qualityScore.overall);
  console.log('Word Count:', result.qualityScore.wordCount);
  console.log('Section Count:', result.qualityScore.sectionCount);
}

testCompression().catch(console.error);
