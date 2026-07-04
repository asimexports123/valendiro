/**
 * Check which renderer was used for published content
 */

import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('========================================');
  console.log('Renderer Version Check');
  console.log('========================================\n');

  const { data: renderedOutputs, error } = await supabase
    .from('rendered_outputs')
    .select('renderer_id, renderer_version, package_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching rendered outputs:', error);
    process.exit(1);
  }

  if (!renderedOutputs || renderedOutputs.length === 0) {
    console.log('No rendered outputs found');
    return;
  }

  console.log(`Total Rendered Outputs: ${renderedOutputs.length}\n`);

  for (const output of renderedOutputs) {
    console.log(`Renderer ID: ${output.renderer_id}`);
    console.log(`Renderer Version: ${output.renderer_version}`);
    console.log(`Package ID: ${output.package_id}`);
    console.log(`Created At: ${output.created_at}`);
    console.log('');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
