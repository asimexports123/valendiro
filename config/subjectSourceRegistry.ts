/**
 * Phase 44 - Subject Source Registry with Production Stabilization
 * 
 * Configuration-driven Subject Source Registry.
 * Each subject defines its authoritative sources.
 * Sources have status management: ACTIVE, DISABLED, BROKEN, DEPRECATED.
 */

export type SourceStatus = "ACTIVE" | "DISABLED" | "BROKEN" | "DEPRECATED";

export interface SubjectSource {
  name: string;
  url: string;
  connector: string; // Connector class name
  targetCollections: string[]; // Collections this source is expected to provide
  status: SourceStatus; // Source status for production stabilization
  lastUpdated: string; // Timestamp of last status change
  failureReason?: string; // Reason for BROKEN status
}

export interface SubjectRegistry {
  subject: string;
  subjectType: string;
  version: number; // Registry version for change tracking
  lastUpdated: string; // Timestamp of last registry update
  sources: SubjectSource[];
}

export const SUBJECT_SOURCE_REGISTRY: Record<string, SubjectRegistry> = {
  "python-programming-fundamentals": {
    subject: "Python Programming Fundamentals",
    subjectType: "programming",
    version: 1,
    lastUpdated: new Date().toISOString(),
    sources: [
      {
        name: "Python Tutorial",
        url: "https://docs.python.org/3/tutorial/introduction.html",
        connector: "PythonDocumentationConnector",
        targetCollections: ["procedures", "examples", "concepts"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "Python Language Reference",
        url: "https://docs.python.org/3/reference/executionmodel.html",
        connector: "PythonDocumentationConnector",
        targetCollections: ["definitions", "commands", "references"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "Python FAQ",
        url: "https://docs.python.org/3/faq/general.html",
        connector: "PythonDocumentationConnector",
        targetCollections: ["faqs", "commonMistakes"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "PEP 8",
        url: "https://peps.python.org/pep-0008/",
        connector: "PythonDocumentationConnector",
        targetCollections: ["bestPractices", "warnings"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
    ],
  },
  "git-version-control": {
    subject: "Git Version Control",
    subjectType: "programming",
    version: 1,
    lastUpdated: new Date().toISOString(),
    sources: [
      {
        name: "Git Book",
        url: "https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control",
        connector: "GitDocumentationConnector",
        targetCollections: ["concepts", "procedures", "examples", "warnings"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "Git Reference",
        url: "https://git-scm.com/docs/git-init",
        connector: "GitDocumentationConnector",
        targetCollections: ["definitions", "commands", "references"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "Git FAQ",
        url: "https://git-scm.com/docs/gitfaq",
        connector: "GitDocumentationConnector",
        targetCollections: ["faqs", "commonMistakes", "bestPractices"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
    ],
  },
  "javascript-fundamentals": {
    subject: "JavaScript Fundamentals",
    subjectType: "programming",
    version: 1,
    lastUpdated: new Date().toISOString(),
    sources: [
      {
        name: "MDN Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction",
        connector: "MDNConnector",
        targetCollections: ["concepts", "procedures", "examples", "warnings"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "MDN Reference",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements",
        connector: "MDNConnector",
        targetCollections: ["definitions", "commands", "references"],
        status: "ACTIVE",
        lastUpdated: new Date().toISOString(),
      },
    ],
  },
};

export function getSubjectRegistry(subjectSlug: string): SubjectRegistry | undefined {
  return SUBJECT_SOURCE_REGISTRY[subjectSlug];
}

export function getAllSubjects(): string[] {
  return Object.keys(SUBJECT_SOURCE_REGISTRY);
}

export function updateSourceStatus(subjectSlug: string, sourceName: string, newStatus: SourceStatus, failureReason?: string): boolean {
  const registry = SUBJECT_SOURCE_REGISTRY[subjectSlug];
  if (!registry) {
    return false;
  }

  const source = registry.sources.find(s => s.name === sourceName);
  if (!source) {
    return false;
  }

  source.status = newStatus;
  source.lastUpdated = new Date().toISOString();
  if (failureReason) {
    source.failureReason = failureReason;
  }

  // Increment registry version
  registry.version++;
  registry.lastUpdated = new Date().toISOString();

  return true;
}

export function getActiveSources(subjectSlug: string): SubjectSource[] {
  const registry = SUBJECT_SOURCE_REGISTRY[subjectSlug];
  if (!registry) {
    return [];
  }

  return registry.sources.filter(s => s.status === "ACTIVE");
}

export function getBrokenSources(subjectSlug: string): SubjectSource[] {
  const registry = SUBJECT_SOURCE_REGISTRY[subjectSlug];
  if (!registry) {
    return [];
  }

  return registry.sources.filter(s => s.status === "BROKEN");
}
