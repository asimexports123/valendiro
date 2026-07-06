/**
 * Multi-source Knowledge Verification
 * 
 * Never create a Knowledge Package from only one article when corroboration is available
 * Knowledge Packages must become evidence-based, not article-based
 */

import { evaluateSourceTrust, getAggregateTrustScore } from '../discovery/sourceTrustEngine';

export interface KnowledgeClaim {
  id: string;
  statement: string;
  sources: string[];
  trustScores: number[];
  corroborationLevel: 'single' | 'corroborated' | 'highly-corroborated' | 'contradicted';
  confidence: number;
}

export interface VerificationResult {
  totalClaims: number;
  corroboratedClaims: number;
  singleSourceClaims: number;
  contradictedClaims: number;
  overallConfidence: number;
  requiresAdditionalSources: boolean;
  recommendedActions: string[];
}

export interface SourceEvidence {
  url: string;
  domain: string;
  trustScore: number;
  claimsSupported: string[];
  dateAccessed: string;
}

/**
 * Verify knowledge claims across multiple sources
 */
export async function verifyKnowledgeAcrossSources(
  claims: KnowledgeClaim[],
  additionalSources: string[] = []
): Promise<VerificationResult> {
  let corroboratedClaims = 0;
  let singleSourceClaims = 0;
  let contradictedClaims = 0;
  const recommendedActions: string[] = [];

  // Evaluate existing sources
  for (const claim of claims) {
    const sourceEvaluations = claim.sources.map(url => evaluateSourceTrust(url));
    const aggregate = getAggregateTrustScore(sourceEvaluations);

    // Determine corroboration level
    if (claim.sources.length === 1) {
      claim.corroborationLevel = 'single';
      singleSourceClaims++;
      
      if (aggregate.needsCorroboration) {
        recommendedActions.push(`Claim "${claim.statement.substring(0, 50)}..." requires corroboration from ${aggregate.recommendedMinSources} additional sources`);
      }
    } else if (aggregate.averageScore >= 75 && claim.sources.length >= 2) {
      claim.corroborationLevel = 'highly-corroborated';
      corroboratedClaims++;
    } else if (claim.sources.length >= 2) {
      claim.corroborationLevel = 'corroborated';
      corroboratedClaims++;
    } else {
      claim.corroborationLevel = 'contradicted';
      contradictedClaims++;
    }

    // Calculate confidence based on corroboration and trust
    claim.confidence = calculateClaimConfidence(claim, aggregate);
  }

  // Search for additional sources if needed
  if (additionalSources.length > 0) {
    const additionalEvaluations = additionalSources.map(url => evaluateSourceTrust(url));
    // In production, this would search content and match claims
  }

  const overallConfidence = claims.length > 0
    ? claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length
    : 0;

  return {
    totalClaims: claims.length,
    corroboratedClaims,
    singleSourceClaims,
    contradictedClaims,
    overallConfidence,
    requiresAdditionalSources: singleSourceClaims > 0,
    recommendedActions,
  };
}

/**
 * Calculate confidence for a single claim
 */
function calculateClaimConfidence(
  claim: KnowledgeClaim,
  aggregate: { averageScore: number; needsCorroboration: boolean }
): number {
  let confidence = aggregate.averageScore;

  // Boost for corroboration
  if (claim.corroborationLevel === 'highly-corroborated') {
    confidence += 10;
  } else if (claim.corroborationLevel === 'corroborated') {
    confidence += 5;
  }

  // Penalty for single source when corroboration is needed
  if (claim.corroborationLevel === 'single' && aggregate.needsCorroboration) {
    confidence -= 20;
  }

  // Penalty for contradictions
  if (claim.corroborationLevel === 'contradicted') {
    confidence -= 30;
  }

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Merge knowledge from multiple sources
 */
export function mergeKnowledgeFromSources(
  sourceEvidences: SourceEvidence[]
): {
  mergedClaims: KnowledgeClaim[];
  duplicatesRemoved: number;
  contradictionsResolved: number;
} {
  const claimMap = new Map<string, KnowledgeClaim>();
  let duplicatesRemoved = 0;
  let contradictionsResolved = 0;

  for (const evidence of sourceEvidences) {
    for (const claimId of evidence.claimsSupported) {
      const existing = claimMap.get(claimId);
      
      if (existing) {
        // Merge sources
        if (!existing.sources.includes(evidence.url)) {
          existing.sources.push(evidence.url);
          existing.trustScores.push(evidence.trustScore);
          duplicatesRemoved++;
        }
      } else {
        // Create new claim
        claimMap.set(claimId, {
          id: claimId,
          statement: '', // Would be populated from actual content
          sources: [evidence.url],
          trustScores: [evidence.trustScore],
          corroborationLevel: 'single',
          confidence: evidence.trustScore,
        });
      }
    }
  }

  const mergedClaims = Array.from(claimMap.values());

  return {
    mergedClaims,
    duplicatesRemoved,
    contradictionsResolved,
  };
}

/**
 * Resolve contradictions between sources
 */
export function resolveContradictions(
  claims: KnowledgeClaim[]
): {
  resolvedClaims: KnowledgeClaim[];
  resolutionMethod: 'authority-based' | 'majority-vote' | 'consensus' | 'flagged';
} {
  const resolvedClaims: KnowledgeClaim[] = [];
  
  // Group similar claims
  const claimGroups = groupSimilarClaims(claims);

  for (const group of claimGroups) {
    if (group.length === 1) {
      resolvedClaims.push(group[0]);
    } else {
      // Resolve contradiction based on authority
      const highestAuthority = group.reduce((best, current) => {
        const bestScore = Math.max(...best.trustScores);
        const currentScore = Math.max(...current.trustScores);
        return currentScore > bestScore ? current : best;
      });

      // Mark as resolved
      highestAuthority.corroborationLevel = 'corroborated';
      resolvedClaims.push(highestAuthority);
    }
  }

  return {
    resolvedClaims,
    resolutionMethod: 'authority-based',
  };
}

/**
 * Group similar claims for contradiction detection
 */
function groupSimilarClaims(claims: KnowledgeClaim[]): KnowledgeClaim[][] {
  const groups: KnowledgeClaim[][] = [];
  const processed = new Set<string>();

  for (const claim of claims) {
    if (processed.has(claim.id)) continue;

    const group = [claim];
    processed.add(claim.id);

    // Find similar claims (simplified - in production would use semantic similarity)
    for (const other of claims) {
      if (processed.has(other.id)) continue;
      
      const similarity = calculateSimilarity(claim.statement, other.statement);
      if (similarity > 0.8) {
        group.push(other);
        processed.add(other.id);
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * Calculate similarity between two statements (simplified Jaccard)
 */
function calculateSimilarity(statement1: string, statement2: string): number {
  const words1 = new Set(statement1.toLowerCase().split(/\s+/));
  const words2 = new Set(statement2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Determine if Knowledge Package is ready for production
 */
export function isPackageReadyForProduction(
  verification: VerificationResult
): {
  ready: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (verification.overallConfidence < 70) {
    reasons.push('Overall confidence below 70%');
  }

  if (verification.singleSourceClaims > verification.totalClaims * 0.3) {
    reasons.push('More than 30% of claims rely on single sources');
  }

  if (verification.contradictedClaims > 0) {
    reasons.push('Contradicted claims detected');
  }

  return {
    ready: reasons.length === 0,
    reasons,
  };
}
