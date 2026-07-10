/**
 * Brain publish mode — auto-publish only when internal score fully passes.
 * Set BRAIN_AUTO_PUBLISH=false to run pipeline without going live (draft/score only).
 */

/** Auto mode: publish to live site only after all internal checks pass. Default ON. */
export function isBrainAutoPublishEnabled(): boolean {
  return process.env.BRAIN_AUTO_PUBLISH !== "false";
}
