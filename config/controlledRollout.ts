/**
 * Phase 44 - Controlled Rollout Sequence
 * 
 * No mass publication. Rollout sequence with QA approval at each stage.
 */

export interface RolloutStage {
  stage: number;
  pageCount: number;
  description: string;
  qaRequired: boolean;
}

export const CONTROLLED_ROLLOUT_SEQUENCE: RolloutStage[] = [
  {
    stage: 1,
    pageCount: 3,
    description: "Initial pilot rollout",
    qaRequired: true,
  },
  {
    stage: 2,
    pageCount: 10,
    description: "Small scale rollout",
    qaRequired: true,
  },
  {
    stage: 3,
    pageCount: 50,
    description: "Medium scale rollout",
    qaRequired: true,
  },
  {
    stage: 4,
    pageCount: 100,
    description: "Large scale rollout",
    qaRequired: true,
  },
  {
    stage: 5,
    pageCount: 500,
    description: "Very large scale rollout",
    qaRequired: true,
  },
  {
    stage: 6,
    pageCount: 1000,
    description: "Full production rollout",
    qaRequired: true,
  },
];

export function getCurrentRolloutStage(currentPublishedPages: number): number {
  for (let i = CONTROLLED_ROLLOUT_SEQUENCE.length - 1; i >= 0; i--) {
    if (currentPublishedPages >= CONTROLLED_ROLLOUT_SEQUENCE[i].pageCount) {
      return i + 1;
    }
  }
  return 0; // Before stage 1
}

export function getNextRolloutStage(currentStage: number): RolloutStage | null {
  const nextStageIndex = currentStage;
  if (nextStageIndex >= CONTROLLED_ROLLOUT_SEQUENCE.length) {
    return null; // All stages completed
  }
  return CONTROLLED_ROLLOUT_SEQUENCE[nextStageIndex];
}

export function canProceedToNextStage(currentStage: number, qaApproved: boolean): boolean {
  if (!qaApproved) {
    return false;
  }
  return getNextRolloutStage(currentStage) !== null;
}
