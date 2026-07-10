/**
 * Canonical topic publish guard — production may publish topics only via Brain
 * (catalogOriginalPublish) or when ALLOW_LEGACY_PUBLISH=true.
 */

import { CANONICAL_TOPIC_PUBLISH_MESSAGE } from "./frozen";

let brainAuthDepth = 0;

/** Mark the current async scope as brain-authorized for topic publish. */
export function authorizeBrainTopicPublish(): void {
  brainAuthDepth++;
}

/** Release one brain authorization (pair with authorizeBrainTopicPublish). */
export function revokeBrainTopicPublish(): void {
  brainAuthDepth = Math.max(0, brainAuthDepth - 1);
}

export function isBrainTopicPublishAuthorized(): boolean {
  return brainAuthDepth > 0;
}

export class CanonicalPublishBlockedError extends Error {
  readonly operation: string;

  constructor(operation: string) {
    super(
      `Non-canonical topic publish blocked (${operation}). ${CANONICAL_TOPIC_PUBLISH_MESSAGE}`
    );
    this.name = "CanonicalPublishBlockedError";
    this.operation = operation;
  }
}

/**
 * Assert that the caller is allowed to publish a topic to production.
 * @throws CanonicalPublishBlockedError when not brain-authorized and legacy not allowed
 */
export function assertCanonicalTopicPublish(operation: string): void {
  if (isBrainTopicPublishAuthorized()) return;
  if (process.env.ALLOW_LEGACY_PUBLISH === "true") return;
  throw new CanonicalPublishBlockedError(operation);
}
