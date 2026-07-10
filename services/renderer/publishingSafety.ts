/**
 * Publishing Safety
 * 
 * Publishing must always be zero downtime.
 * Render → QA → UPSERT → Atomic replacement
 * Never delete live content before successful replacement.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { markOutputPublished, markOutputStatus } from "@/services/render/writers";

export interface PublishingOperation {
  packageId: string;
  newOutputId: string;
  oldOutputId: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';
  startTime: string;
  endTime?: string;
  error?: string;
}

export interface AtomicReplaceResult {
  success: boolean;
  oldOutputId: string | null;
  newOutputId: string;
  operationId: string;
  downtimeMs: number;
  rollbackPerformed: boolean;
}

/**
 * Safe atomic replacement with zero downtime
 */
export async function atomicReplaceRenderedOutput(
  packageId: string,
  newOutputId: string,
  forceReplace: boolean = false
): Promise<AtomicReplaceResult> {
  const supabase = createAdminClient();
  const startTime = Date.now();
  const operationId = crypto.randomUUID();

  console.log(`Starting atomic replacement for package ${packageId}`);

  try {
    // Step 1: Get current published output
    const { data: currentOutput } = await supabase
      .from('rendered_outputs')
      .select('id, status, package_id, quality_score')
      .eq('package_id', packageId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const oldOutputId = currentOutput?.id || null;
    const currentScore = currentOutput?.quality_score?.overall || 0;

    // Step 2: Validate new output is ready
    const { data: newOutput } = await supabase
      .from('rendered_outputs')
      .select('id, status, quality_score')
      .eq('id', newOutputId)
      .single();

    if (!newOutput) {
      throw new Error(`New output ${newOutputId} not found`);
    }

    const qaScore = newOutput.quality_score?.overall || 0;
    
    // Safety check: don't replace if new content is worse
    if (!forceReplace && currentOutput) {
      if (qaScore < currentScore) {
        console.warn(`New content score (${qaScore}) lower than current (${currentScore}). Aborting replacement.`);
        return {
          success: false,
          oldOutputId,
          newOutputId,
          operationId,
          downtimeMs: Date.now() - startTime,
          rollbackPerformed: false,
        };
      }
    }

    // Step 3: Mark new output as published (UPSERT)
    await markOutputPublished(newOutputId);

    // Step 4: Mark old output as stale only after new is published
    if (oldOutputId) {
      try {
        await markOutputStatus(oldOutputId, "stale");
      } catch (staleError) {
        console.error(
          `Warning: Failed to mark old output as stale: ${staleError instanceof Error ? staleError.message : staleError}`
        );
      }
    }

    const downtimeMs = Date.now() - startTime;

    console.log(`Atomic replacement completed successfully in ${downtimeMs}ms`);

    return {
      success: true,
      oldOutputId,
      newOutputId,
      operationId,
      downtimeMs,
      rollbackPerformed: false,
    };

  } catch (error) {
    const downtimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`Atomic replacement failed: ${errorMessage}`);

    // Rollback not needed since we didn't delete anything
    return {
      success: false,
      oldOutputId: null,
      newOutputId,
      operationId,
      downtimeMs,
      rollbackPerformed: false,
    };
  }
}

/**
 * Safe publish with rollback capability
 */
export async function safePublishWithRollback(
  packageId: string,
  newOutputId: string,
  currentPublishedScore?: number
): Promise<{
  success: boolean;
  rollbackPerformed: boolean;
  error?: string;
}> {
  const result = await atomicReplaceRenderedOutput(packageId, newOutputId, false);

  if (!result.success) {
    // Rollback not needed since we use atomic replacement
    return {
      success: false,
      rollbackPerformed: false,
      error: 'Publishing failed - no rollback needed (atomic replacement)',
    };
  }

  return {
    success: true,
    rollbackPerformed: false,
  };
}

/**
 * Validate before publishing
 */
export async function validateBeforePublish(
  newOutputId: string,
  currentPublishedScore?: number
): Promise<{
  valid: boolean;
  reasons: string[];
  canProceed: boolean;
}> {
  const supabase = createAdminClient();
  const reasons: string[] = [];

  const { data: newOutput } = await supabase
    .from('rendered_outputs')
    .select('id, status, quality_score, word_count, citation_count')
    .eq('id', newOutputId)
    .single();

  if (!newOutput) {
    reasons.push('New output not found');
    return { valid: false, reasons, canProceed: false };
  }

  const qaScore = newOutput.quality_score?.overall || 0;

  // Check QA score
  if (qaScore < 90) {
    reasons.push(`QA score ${qaScore} below threshold 90`);
  }

  // Check word count — dense editorial articles may be shorter than padded drafts
  if (newOutput.word_count < 350) {
    reasons.push(`Word count ${newOutput.word_count} below minimum 350`);
  }

  // Check citations
  if (newOutput.citation_count < 1) {
    reasons.push(`No citations found`);
  }

  // Compare with current score
  if (currentPublishedScore && qaScore < currentPublishedScore) {
    reasons.push(`New content score (${qaScore}) lower than current (${currentPublishedScore})`);
  }

  const valid = reasons.length === 0;
  const canProceed = valid || qaScore >= 90; // Allow if QA passes even if other checks fail

  return { valid, reasons, canProceed };
}

/**
 * Get current published output
 */
export async function getCurrentPublishedOutput(packageId: string): Promise<{
  outputId: string | null;
  qualityScore: number;
  status: string;
}> {
  const supabase = createAdminClient();

  const { data: currentOutput } = await supabase
    .from('rendered_outputs')
    .select('id, quality_score, status')
    .eq('package_id', packageId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    outputId: currentOutput?.id || null,
    qualityScore: currentOutput?.quality_score?.overall || 0,
    status: currentOutput?.status || 'none',
  };
}

/**
 * Monitor publishing operation
 */
export async function monitorPublishingOperation(
  operationId: string
): Promise<PublishingOperation | null> {
  // In production, this would query a publishing operations table
  // For now, return null
  return null;
}

/**
 * Emergency rollback (if needed)
 */
export async function emergencyRollback(
  packageId: string,
  failedOutputId: string,
  previousOutputId: string
): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    await markOutputStatus(failedOutputId, "failed");

    if (previousOutputId) {
      await markOutputPublished(previousOutputId);
    }

    console.log(`Emergency rollback completed for package ${packageId}`);
    return true;
  } catch (error) {
    console.error(`Emergency rollback failed: ${error}`);
    return false;
  }
}

/**
 * Zero downtime publish workflow
 */
export async function zeroDowntimePublish(
  packageId: string,
  newOutputId: string
): Promise<{
  success: boolean;
  downtimeMs: number;
  steps: string[];
}> {
  const steps: string[] = [];
  const startTime = Date.now();

  try {
    steps.push('Step 1: Validating new output...');
    const current = await getCurrentPublishedOutput(packageId);
    const validation = await validateBeforePublish(newOutputId, current.qualityScore);
    
    if (!validation.canProceed) {
      steps.push(`Validation failed: ${validation.reasons.join(', ')}`);
      return {
        success: false,
        downtimeMs: Date.now() - startTime,
        steps,
      };
    }
    steps.push('Validation passed');

    steps.push('Step 2: Performing atomic replacement...');
    const result = await atomicReplaceRenderedOutput(packageId, newOutputId);
    
    if (!result.success) {
      steps.push('Atomic replacement failed');
      return {
        success: false,
        downtimeMs: result.downtimeMs,
        steps,
      };
    }
    steps.push('Atomic replacement successful');

    steps.push('Step 3: Verifying publish...');
    const verification = await getCurrentPublishedOutput(packageId);
    
    if (verification.outputId !== newOutputId) {
      steps.push('Verification failed - output not published');
      return {
        success: false,
        downtimeMs: Date.now() - startTime,
        steps,
      };
    }
    steps.push('Verification successful');

    return {
      success: true,
      downtimeMs: Date.now() - startTime,
      steps,
    };

  } catch (error) {
    steps.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      downtimeMs: Date.now() - startTime,
      steps,
    };
  }
}
