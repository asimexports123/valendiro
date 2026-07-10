/**
 * @architecture-frozen — Valendiro Knowledge OS locked architecture constants.
 * See docs/ARCHITECTURE_FROZEN.md. Do not extend without architecture unlock.
 */

export const ARCHITECTURE_LOCKED = true;

/** Phase 0: demand / legacy publish paths are disabled at runtime. */
export const DEMAND_PIPELINE_FROZEN = true;

export const FROZEN_DEMAND_ACTIONS = [
  "demand_run",
  "generate_articles",
  "publish_queue",
] as const;

export type FrozenDemandAction = (typeof FROZEN_DEMAND_ACTIONS)[number];

export function isFrozenDemandAction(action: string): action is FrozenDemandAction {
  return (FROZEN_DEMAND_ACTIONS as readonly string[]).includes(action);
}

export const DEMAND_PIPELINE_DISABLED_MESSAGE =
  "Demand pipeline is permanently retired (Phase 0). Use the canonical Knowledge Asset pipeline via /api/cron/discovery-pipeline.";

export function demandPipelineDisabledResponse() {
  return {
    success: false,
    error: DEMAND_PIPELINE_DISABLED_MESSAGE,
    architecture: "frozen",
    phase: 0,
  };
}

/** Parallel crons retired — single canonical discovery-pipeline only. */
export const PARALLEL_CRONS_FROZEN = true;

export const CANONICAL_CRON_PATH = "/api/cron/discovery-pipeline";

export const CANONICAL_TOPIC_PUBLISH_MESSAGE =
  "Topic pages publish only via the Brain pipeline (/api/cron/discovery-pipeline or scripts/run-phase1-seed-brain.ts / scripts/run-brain-pipeline.ts). Manual scripts and legacy paths cannot publish — use fuel-only acquisition and defer publish to Brain.";

export const AUTONOMOUS_LEARNER_CRON_DISABLED_MESSAGE =
  "Autonomous learner cron is retired. Gap-driven fuel acquisition runs inside /api/cron/discovery-pipeline (step 3). runAutonomousLearner is fuel-only — it cannot publish topics; use the Brain pipeline.";

export const JOBS_EXECUTE_CRON_DISABLED_MESSAGE =
  "jobs/execute cron is retired. Automated publishing runs only via /api/cron/discovery-pipeline (brain rewrite). Manual admin POST to /api/jobs/execute remains available.";

export function parallelCronDisabledResponse(cron: "autonomous-learner" | "jobs-execute") {
  return {
    success: false,
    retired: true,
    frozen: PARALLEL_CRONS_FROZEN,
    error:
      cron === "autonomous-learner"
        ? AUTONOMOUS_LEARNER_CRON_DISABLED_MESSAGE
        : JOBS_EXECUTE_CRON_DISABLED_MESSAGE,
    canonicalCron: CANONICAL_CRON_PATH,
  };
}
