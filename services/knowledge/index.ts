export { assemble } from "./assembler";
export { normalizeText, loadGlossary, clearGlossaryCache } from "./normalizer";
export { extractFacts } from "./factExtractor";
export { deduplicateFacts } from "./factDeduplicator";
export { resolveConflicts } from "./conflictResolver";
export { calculateConfidence } from "./confidenceCalculator";
export { buildRelationships } from "./relationshipBuilder";
export { computeKnowledgeHash, decideVersion } from "./packageVersioner";
export type { AssemblyInput, AssemblyReport, CandidateInput } from "./types";
