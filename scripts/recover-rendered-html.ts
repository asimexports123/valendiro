/**
 * P0 Production Bug Recovery - Rendered HTML Persistence Failure
 *
 * Recovers 223 empty rendered_outputs by re-rendering HTML content.
 * Does NOT regenerate Knowledge Packages.
 * Does NOT rerun acquisition.
 * Does NOT rerun validation.
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
process.env.ALLOW_RENDER = "true";

import { createClient } from '@supabase/supabase-js';
import { render } from '../services/renderer/orchestrator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RecoveryResult {
  outputId: string;
  packageId: string;
  success: boolean;
  contentLength: number;
  error?: string;
}

async function main() {
  console.log('=== P0 Production Bug Recovery ===');
  console.log('Recovering empty rendered_outputs\n');

  const startTime = Date.now();

  // Find all empty rendered_outputs
  const { data: emptyOutputs, error: findError } = await supabase
    .from('rendered_outputs')
    .select('id, package_id, cache_key')
    .is('content', null)
    .limit(250);

  if (findError) {
    console.error('Failed to find empty rendered_outputs:', findError.message);
    process.exit(1);
  }

  console.log(`Found ${emptyOutputs?.length || 0} empty rendered_outputs\n`);

  if (!emptyOutputs || emptyOutputs.length === 0) {
    console.log('No empty rendered_outputs to recover');
    return;
  }

  const results: RecoveryResult[] = [];
  let recovered = 0;
  let failed = 0;

  for (const output of emptyOutputs) {
    console.log(`\nProcessing output: ${output.id} (package: ${output.package_id})`);

    try {
      // Load existing Knowledge Package
      const { data: packageData, error: packageError } = await supabase
        .from('knowledge_packages')
        .select('id, slug, topic_id')
        .eq('id', output.package_id)
        .single();

      if (packageError || !packageData) {
        console.error(`✗ Package not found: ${output.package_id}`);
        results.push({
          outputId: output.id,
          packageId: output.package_id,
          success: false,
          contentLength: 0,
          error: 'Package not found'
        });
        failed++;
        continue;
      }

      // Render HTML using existing pipeline
      const renderResult = await render({
        packageId: output.package_id,
        format: 'html',
        forceRerender: true
      });

      if (!renderResult.content || renderResult.content.length === 0) {
        console.error(`✗ HTML generation failed: empty content`);
        results.push({
          outputId: output.id,
          packageId: output.package_id,
          success: false,
          contentLength: 0,
          error: 'HTML generation failed: empty content'
        });
        failed++;
        continue;
      }

      // Verify content length > 0
      if (renderResult.content.length <= 0) {
        console.error(`✗ Content length verification failed: ${renderResult.content.length}`);
        results.push({
          outputId: output.id,
          packageId: output.package_id,
          success: false,
          contentLength: renderResult.content.length,
          error: 'Content length verification failed'
        });
        failed++;
        continue;
      }

      // Content is already persisted by the render() function
      // Verify persistence
      const { data: verifyData, error: verifyError } = await supabase
        .from('rendered_outputs')
        .select('content')
        .eq('id', output.id)
        .single();

      if (verifyError || !verifyData || !verifyData.content || verifyData.content.length === 0) {
        console.error(`✗ Persistence verification failed`);
        results.push({
          outputId: output.id,
          packageId: output.package_id,
          success: false,
          contentLength: renderResult.content.length,
          error: 'Persistence verification failed'
        });
        failed++;
        continue;
      }

      console.log(`✓ Success - Content length: ${renderResult.content.length}`);
      results.push({
        outputId: output.id,
        packageId: output.package_id,
        success: true,
        contentLength: renderResult.content.length
      });
      recovered++;

    } catch (error: any) {
      console.error(`✗ Error: ${error.message}`);
      results.push({
        outputId: output.id,
        packageId: output.package_id,
        success: false,
        contentLength: 0,
        error: error.message
      });
      failed++;
    }
  }

  const endTime = Date.now();
  const executionTime = ((endTime - startTime) / 1000).toFixed(2);

  // Summary
  console.log('\n\n=== Recovery Summary ===');
  console.log(`Total processed: ${emptyOutputs.length}`);
  console.log(`Recovered: ${recovered}`);
  console.log(`Failed: ${failed}`);
  console.log(`Execution time: ${executionTime}s`);

  if (failed > 0) {
    console.log('\n=== Failure Reasons ===');
    const failures = results.filter(r => !r.success);
    failures.forEach(f => {
      console.log(`${f.outputId}: ${f.error}`);
    });
  }

  // Verify final state
  const { data: remainingEmpty } = await supabase
    .from('rendered_outputs')
    .select('id')
    .or('content.is.null,content.eq("")');

  console.log(`\nRemaining empty rendered_outputs: ${remainingEmpty?.length || 0}`);
}

main().catch(console.error);
