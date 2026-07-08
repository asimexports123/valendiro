/**
 * Flagship topics — only these stay public while catalog is rebuilt.
 * Slugs must match production `topics.slug`.
 */

export const FLAGSHIP_TOPIC_SLUGS: readonly string[] = [
  // Technology
  "javascript-fundamentals",
  "html-fundamentals",
  "css-fundamentals",
  "typescript-language",
  "react-library",
  "nextjs-framework",
  "nodejs-cluster",
  "restful-apis",
  "git-version-control",
  "sql-fundamentals",
  "python-programming-fundamentals",
  "data-structures",
  "algorithms-fundamentals",
  "machine-learning-fundamentals",
  "design-patterns",
  "docker-containers",
  "software-testing",
  // Personal Finance
  "index-funds",
  "mutual-fund-fundamentals",
  "retirement-planning",
  "budgeting",
  "emergency-fund",
  "credit-score",
  "health-insurance",
  // Business
  "business-process-automation",
  // Education / career crossover
  "project-management",
  // Health (strict — few only)
  "nutrition",
  "mental-health",
  // Travel
  "travel-planning",
] as const;

export const FLAGSHIP_SLUG_SET = new Set<string>(FLAGSHIP_TOPIC_SLUGS);
