/**
 * Topic Search Intent & Reader Level Classifier
 *
 * Detects WHAT the searcher is trying to do (intent) and WHO they are (level).
 * This is separate from entity type — the same entity can have multiple intents.
 *
 * Intent examples:
 *   "Docker Commands"         → reference
 *   "Learn Python"            → tutorial / beginner
 *   "Docker vs Kubernetes"    → comparison
 *   "Python not working"      → troubleshooting
 *   "Compound Interest"       → calculator / definition
 *   "Best Index Funds"        → review / guide
 *
 * Reader level examples:
 *   "Python for Beginners"    → beginner
 *   "Advanced Docker"         → advanced
 *   "Docker for DevOps"       → professional
 *   (no signal)               → beginner (safe default)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchIntent =
  | "definition"      // What is X? What does X mean?
  | "tutorial"        // How to, Learn X, Getting started, step-by-step
  | "comparison"      // X vs Y, X or Y, alternatives to X
  | "reference"       // Commands, syntax, cheat sheet, list of
  | "troubleshooting" // Fix, error, not working, problem, issue
  | "guide"           // Complete guide, best practices, how-to overview
  | "calculator"      // Formula, calculate, how much, ROI
  | "checklist"       // Checklist, steps, process, workflow
  | "review";         // Best X, top X, is X worth it, X review

export type ReaderLevel =
  | "beginner"        // for beginners, introduction, basics, start
  | "intermediate"    // intermediate, next steps, deeper dive
  | "advanced"        // advanced, expert, deep dive, internals
  | "professional";   // for teams, enterprise, production, at scale

export interface TopicIntelligence {
  intent: SearchIntent;
  level: ReaderLevel;
}

// ─── Intent Classifier ────────────────────────────────────────────────────────

export function classifySearchIntent(topicTitle: string): SearchIntent {
  const k = topicTitle.toLowerCase().trim();

  // Comparison — must check before tutorial (vs/or pattern is strong signal)
  if (/\bvs\.?\b|\bversus\b|\bor\b.{1,20}\bor\b|\bcompare\b|\balternatives? to\b|\bdifference between\b/.test(k))
    return "comparison";

  // Troubleshooting
  if (/\bnot working\b|\bfix\b|\berror\b|\bfailed?\b|\bissue\b|\bproblem\b|\bdebug\b|\btroubleshoot\b|\bcrash\b|\bbug\b|\bcannot\b|\bcan't\b|\bwon't start\b|\bbroken\b/.test(k))
    return "troubleshooting";

  // Reference — cheat sheets, command lists, syntax sheets
  if (/\bcheat sheet\b|\bcommands?\b|\bsyntax\b|\blist of\b|\breference\b|\bapi reference\b|\bsymbols?\b|\bshortcuts?\b|\bflag\b|\boptions?\b|\bparameters?\b/.test(k))
    return "reference";

  // Calculator / formula
  if (/\bformula\b|\bcalculate\b|\bcalculator\b|\bhow much\b|\brate\b.{1,15}\bformula\b|\bequation\b|\bcompute\b|\broi\b|\bnpv\b|\birr\b|\bbep\b|\bamortization\b/.test(k))
    return "calculator";

  // Checklist / process
  if (/\bchecklist\b|\bworkflow\b|\bprocess\b|\bsteps? (to|for)\b|\bprocedure\b|\bsop\b|\bstandard operating\b/.test(k))
    return "checklist";

  // Review / best / top
  if (/\bbest\b|\btop \d|\btop-\d|\breview\b|\bworth it\b|\bworth buying\b|\bshould i\b|\brecommend\b|\brated?\b/.test(k))
    return "review";

  // Guide — complete, in-depth, best practices, everything, or topic + guide suffix
  // Check BEFORE definition so "Python Intermediate Guide" routes to guide not definition
  if (/\bcomplete guide\b|\bin.depth\b|\bbest practices?\b|\beverything.{1,10}know\b|\bultimate\b|\bmaster\b|\bfor (developers?|engineers?|teams?|professionals?)\b|\b(beginner|intermediate|advanced|practical|essential)s? guide\b|\bguide to\b/.test(k))
    return "guide";

  // Tutorial — learn, how to, getting started, step by step, introduction
  if (/\bhow to\b|\blearn\b|\btutorial\b|\bgetting started\b|\bstep.by.step\b|\bbeginners? guide\b|\bintroduction to\b|\binstall\b|\bset ?up\b|\bdeploy\b|\bbuild\b|\bcreate\b|\bwrite\b/.test(k))
    return "tutorial";

  // Definition — what is, what are, meaning, explained, overview
  if (/\bwhat (is|are|does|was)\b|\bmeaning\b|\bdefinition\b|\bexplained?\b|\boverview\b|\bwhy (is|does|do)\b|\bhow (does|do) .+ work\b/.test(k))
    return "definition";

  // Default: treat bare entity names as definition intent
  return "definition";
}

// ─── Reader Level Classifier ──────────────────────────────────────────────────

export function classifyReaderLevel(topicTitle: string): ReaderLevel {
  const k = topicTitle.toLowerCase().trim();

  // Professional / enterprise signals
  if (/\bfor (teams?|enterprise|production|companies|organizations?|devops|professionals?|engineers?)\b|\bat scale\b|\bproduction.grade\b|\bci\/cd\b|\bscalable\b|\bmicroservice\b|\borganization\b/.test(k))
    return "professional";

  // Advanced signals
  if (/\badvanced\b|\bexpert\b|\bdeep dive\b|\binternals?\b|\bunder the hood\b|\barchitecture\b|\boptimization\b|\bperformance tuning\b|\bsecurity hardening\b/.test(k))
    return "advanced";

  // Intermediate signals
  if (/\bintermediate\b|\bnext (steps?|level)\b|\bbeyond basics\b|\bpractical\b|\breal.world\b/.test(k))
    return "intermediate";

  // Beginner signals
  if (/\bbeginners?\b|\bbasics?\b|\bintroduction\b|\bfirst\b|\bstart\b|\blearn\b|\bsimple\b|\beasy\b|\bnew to\b|\bfor (dummies|kids|non.technical|non.developers?)\b/.test(k))
    return "beginner";

  // Default: beginner is the safe default (more people are new to topics)
  return "beginner";
}

// ─── Combined ─────────────────────────────────────────────────────────────────

export function classifyTopicIntelligence(topicTitle: string): TopicIntelligence {
  return {
    intent: classifySearchIntent(topicTitle),
    level:  classifyReaderLevel(topicTitle),
  };
}
