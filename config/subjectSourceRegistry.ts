/**
 * Phase 42 - Subject Source Registry
 * 
 * Configuration-driven Subject Source Registry.
 * Each subject defines its authoritative sources.
 */

export interface SubjectSource {
  name: string;
  url: string;
  connector: string; // Connector class name
  targetCollections: string[]; // Collections this source is expected to provide
}

export interface SubjectRegistry {
  subject: string;
  subjectType: string;
  sources: SubjectSource[];
}

export const SUBJECT_SOURCE_REGISTRY: Record<string, SubjectRegistry> = {
  "python-programming-fundamentals": {
    subject: "Python Programming Fundamentals",
    subjectType: "programming",
    sources: [
      {
        name: "Python Tutorial",
        url: "https://docs.python.org/3/tutorial/index.html",
        connector: "PythonDocumentationConnector",
        targetCollections: ["procedures", "examples", "concepts"],
      },
      {
        name: "Python Language Reference",
        url: "https://docs.python.org/3/reference/index.html",
        connector: "PythonDocumentationConnector",
        targetCollections: ["definitions", "commands", "references"],
      },
      {
        name: "Python FAQ",
        url: "https://docs.python.org/3/faq/index.html",
        connector: "PythonDocumentationConnector",
        targetCollections: ["faqs", "commonMistakes"],
      },
      {
        name: "PEP 8",
        url: "https://peps.python.org/pep-0008/",
        connector: "PythonDocumentationConnector",
        targetCollections: ["bestPractices", "warnings"],
      },
    ],
  },
  "git-version-control": {
    subject: "Git Version Control",
    subjectType: "programming",
    sources: [
      {
        name: "Git Book",
        url: "https://git-scm.com/book/en/v2",
        connector: "GitDocumentationConnector",
        targetCollections: ["concepts", "procedures", "examples", "warnings"],
      },
      {
        name: "Git Reference",
        url: "https://git-scm.com/docs",
        connector: "GitDocumentationConnector",
        targetCollections: ["definitions", "commands", "references"],
      },
      {
        name: "Git FAQ",
        url: "https://git-scm.com/docs/gitfaq",
        connector: "GitDocumentationConnector",
        targetCollections: ["faqs", "commonMistakes", "bestPractices"],
      },
    ],
  },
  "javascript-fundamentals": {
    subject: "JavaScript Fundamentals",
    subjectType: "programming",
    sources: [
      {
        name: "MDN Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        connector: "MDNConnector",
        targetCollections: ["concepts", "procedures", "examples", "warnings"],
      },
      {
        name: "MDN Reference",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
        connector: "MDNConnector",
        targetCollections: ["definitions", "commands", "references"],
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
