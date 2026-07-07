/**
 * Knowledge Synthesis Service
 * 
 * Transforms extracted content into world-class knowledge articles
 * Part of the autonomous discovery pipeline
 */

import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export interface SynthesizedArticle {
  whatHappened: string;
  whyItMatters: string;
  background: string;
  timeline: string;
  keyFacts: string[];
  importantEntities: string[];
  expertAnalysis: string;
  pros: string[];
  cons: string[];
  differentViewpoints: string[];
  realWorldImpact: string;
  faqs: { question: string; answer: string }[];
  references: string[];
  furtherReading: string[];
}

/**
 * Clean extracted content by removing source-specific footers and CTAs
 */
export function cleanContent(content: string): string {
  let cleaned = content;
  
  // Remove common footer patterns
  const footerPatterns = [
    /Explore more.*$/gim,
    /Register now.*$/gim,
    /Start building.*$/gim,
    /Read more from.*$/gim,
    /Subscribe to our newsletter.*$/gim,
    /Follow us on.*$/gim,
    /Share this article.*$/gim,
    /About the author.*$/gim,
    /Related posts.*$/gim,
    /You might also like.*$/gim,
    /Want to learn more\?.*$/gim,
    /Get started today.*$/gim,
    /Sign up for free.*$/gim,
    /Join our community.*$/gim,
    /Stay up to date.*$/gim,
  ];
  
  footerPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Remove multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Synthesize knowledge article from structured knowledge package
 * Generates content entirely from facts, entities, and relationships - not from source content
 */
export async function synthesizeArticleFromKnowledge(
  title: string,
  facts: string[],
  entities: string[],
  relationships: any[],
  sourceUrl?: string
): Promise<SynthesizedArticle> {
  // Generate all sections from structured knowledge only
  const whatHappened = generateWhatHappenedFromFacts(facts, title);
  const whyItMatters = generateWhyItMattersFromFacts(facts);
  const background = generateBackgroundFromEntities(entities);
  const timeline = generateTimelineFromFacts(facts);
  const keyFacts = facts;
  const importantEntities = entities;
  const expertAnalysis = generateExpertAnalysisFromRelationships(relationships);
  const pros = generateProsFromFacts(facts);
  const cons = generateConsFromFacts(facts);
  const differentViewpoints = generateViewpointsFromRelationships(relationships);
  const realWorldImpact = generateImpactFromFacts(facts);
  const faqs = generateFAQsFromFacts(facts, title);
  const references = sourceUrl ? [sourceUrl] : [];
  const furtherReading = generateFurtherReadingFromEntities(entities);
  
  return {
    whatHappened,
    whyItMatters,
    background,
    timeline,
    keyFacts,
    importantEntities,
    expertAnalysis,
    pros,
    cons,
    differentViewpoints,
    realWorldImpact,
    faqs,
    references,
    furtherReading,
  };
}

/**
 * Generate what happened section from facts
 */
function generateWhatHappenedFromFacts(facts: string[], title: string): string {
  if (facts.length > 0) {
    const primaryFact = facts[0];
    return `This development involves ${primaryFact}. The event has garnered attention due to its implications for the stakeholders involved.`;
  }
  return `This development represents a significant event that has implications for the relevant stakeholders and industry context.`;
}

/**
 * Generate why it matters section from facts
 */
function generateWhyItMattersFromFacts(facts: string[]): string {
  if (facts.length > 1) {
    const relevantFacts = facts.slice(0, 3).join(' ');
    return `This development is important because ${relevantFacts}. These factors contribute to its significance in the broader context.`;
  }
  return "This development is significant due to its potential impact on stakeholders and the broader industry landscape.";
}

/**
 * Generate background section from entities
 */
function generateBackgroundFromEntities(entities: string[]): string {
  if (entities.length > 0) {
    const keyEntities = entities.slice(0, 5).join(', ');
    return `The context involves key entities including ${keyEntities}. Understanding these entities provides important background for comprehending the development.`;
  }
  return "The development occurs within a complex context involving multiple stakeholders and factors.";
}

/**
 * Generate timeline section from facts
 */
function generateTimelineFromFacts(facts: string[]): string {
  if (facts.length > 2) {
    return `Key events include: ${facts.slice(0, 3).join('; ')}. These events occurred in sequence leading to the current situation.`;
  }
  return "The development has evolved through a series of events, with key milestones shaping the current state.";
}

/**
 * Extract key facts
 */
function extractKeyFacts(facts: string[]): string[] {
  return facts.slice(0, 8);
}

/**
 * Extract important entities
 */
function extractImportantEntities(entities: string[]): string[] {
  return entities.filter(e => e.length > 3).slice(0, 10);
}

/**
 * Generate expert analysis from relationships
 */
function generateExpertAnalysisFromRelationships(relationships: any[]): string {
  if (relationships.length > 0) {
    const relationshipTypes = [...new Set(relationships.map(r => r.type))].slice(0, 3);
    return `Analysis indicates key relationships: ${relationshipTypes.join(', ')}. These connections highlight the interconnected nature of the development and suggest broader implications.`;
  }
  return "Expert analysis suggests this development is part of a larger pattern, with connections to related areas and potential cascading effects.";
}

/**
 * Generate pros from facts
 */
function generateProsFromFacts(facts: string[]): string[] {
  const positiveKeywords = ['benefit', 'improve', 'enable', 'support', 'enhance', 'advance'];
  const positiveFacts = facts.filter(f => 
    positiveKeywords.some(k => f.toLowerCase().includes(k))
  );
  
  if (positiveFacts.length > 0) {
    return positiveFacts.slice(0, 5);
  }
  
  return [
    "Potential for improved outcomes based on the development",
    "Opportunity for stakeholders to benefit from the changes",
    "Framework for future improvements and enhancements",
  ];
}

/**
 * Generate cons from facts
 */
function generateConsFromFacts(facts: string[]): string[] {
  const negativeKeywords = ['challenge', 'concern', 'risk', 'issue', 'problem', 'limitation'];
  const negativeFacts = facts.filter(f => 
    negativeKeywords.some(k => f.toLowerCase().includes(k))
  );
  
  if (negativeFacts.length > 0) {
    return negativeFacts.slice(0, 5);
  }
  
  return [
    "Potential challenges in implementation may arise",
    "Uncertainty about long-term effects requires monitoring",
    "Stakeholders may need to adapt to new requirements",
  ];
}

/**
 * Generate viewpoints from relationships
 */
function generateViewpointsFromRelationships(relationships: any[]): string[] {
  if (relationships.length > 0) {
    return relationships.slice(0, 4).map(r => 
      `Relationship between ${r.source} and ${r.target} suggests ${r.type} dynamics that may be viewed differently by various stakeholders.`
    );
  }
  
  return [
    "Some stakeholders view the development as positive progress",
    "Others express concerns about potential implications",
    "Industry experts offer mixed perspectives on the long-term impact",
    "Regulatory bodies are monitoring the situation closely",
  ];
}

/**
 * Generate impact from facts
 */
function generateImpactFromFacts(facts: string[]): string {
  if (facts.length > 0) {
    const impactFacts = facts.slice(0, 3).join(' ');
    return `The real-world impact includes ${impactFacts}. These effects will influence stakeholders, processes, and outcomes in the relevant domains.`;
  }
  return "This development will have tangible effects on stakeholders, processes, and outcomes in the relevant domains, with implications extending beyond immediate participants.";
}

/**
 * Generate FAQs from facts
 */
function generateFAQsFromFacts(facts: string[], title: string): { question: string; answer: string }[] {
  return [
    {
      question: `What is ${title}?`,
      answer: facts.length > 0 ? facts[0] : "This development represents a significant event with implications for stakeholders.",
    },
    {
      question: "Why is this important?",
      answer: facts.length > 1 ? facts[1] : "This development has significant implications for stakeholders and the broader industry.",
    },
    {
      question: "What are the key facts?",
      answer: facts.slice(0, 3).join(' '),
    },
    {
      question: "What happens next?",
      answer: "Stakeholders are monitoring the situation closely, with further developments expected as the situation evolves.",
    },
  ];
}

/**
 * Extract references
 */
function extractReferences(content: string): string[] {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlPattern) || [];
  
  return urls.slice(0, 5);
}

/**
 * Generate further reading from entities
 */
function generateFurtherReadingFromEntities(entities: string[]): string[] {
  return entities.slice(0, 5).map(e => `${e} - Comprehensive guide and analysis`);
}

/**
 * Extract topics from content
 */
function extractTopics(content: string): string[] {
  const techKeywords = [
    'javascript', 'python', 'react', 'nodejs', 'database', 'api', 'web', 'frontend', 'backend',
    'typescript', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt', 'express', 'django', 'flask', 'rails',
    'java', 'csharp', 'c++', 'rust', 'go', 'swift', 'kotlin', 'php', 'ruby', 'scala', 'clojure',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'dom', 'browser', 'server', 'client',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'vercel', 'netlify', 'heroku', 'firebase',
    'git', 'github', 'gitlab', 'bitbucket', 'ci/cd', 'devops', 'testing', 'jest', 'cypress', 'playwright',
    'graphql', 'rest', 'soap', 'grpc', 'websocket', 'http', 'https', 'tcp', 'udp', 'dns',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch',
    'authentication', 'authorization', 'jwt', 'oauth', 'session', 'cookie', 'security',
    'performance', 'optimization', 'caching', 'cdn', 'load balancer', 'scaling'
  ];
  
  const found: string[] = [];
  techKeywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword)) {
      found.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });
  
  return [...new Set(found)].slice(0, 5);
}

/**
 * Convert synthesized article to markdown
 */
export function synthesizedToMarkdown(title: string, article: SynthesizedArticle): string {
  let markdown = `# ${title}\n\n`;
  
  markdown += `## What Happened\n\n${article.whatHappened}\n\n`;
  markdown += `## Why It Matters\n\n${article.whyItMatters}\n\n`;
  markdown += `## Background\n\n${article.background}\n\n`;
  markdown += `## Timeline\n\n${article.timeline}\n\n`;
  
  markdown += `## Key Facts\n\n`;
  article.keyFacts.forEach((fact, i) => {
    markdown += `${i + 1}. ${fact}\n`;
  });
  markdown += `\n`;
  
  markdown += `## Important Entities\n\n`;
  article.importantEntities.forEach(entity => {
    markdown += `- ${entity}\n`;
  });
  markdown += `\n`;
  
  markdown += `## Expert Analysis\n\n${article.expertAnalysis}\n\n`;
  
  if (article.pros.length > 0) {
    markdown += `## Pros\n\n`;
    article.pros.forEach(pro => {
      markdown += `- ${pro}\n`;
    });
    markdown += `\n`;
  }
  
  if (article.cons.length > 0) {
    markdown += `## Cons\n\n`;
    article.cons.forEach(con => {
      markdown += `- ${con}\n`;
    });
    markdown += `\n`;
  }
  
  if (article.differentViewpoints.length > 0) {
    markdown += `## Different Viewpoints\n\n`;
    article.differentViewpoints.forEach(view => {
      markdown += `- ${view}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `## Real World Impact\n\n${article.realWorldImpact}\n\n`;
  
  markdown += `## FAQs\n\n`;
  article.faqs.forEach(faq => {
    markdown += `**Q: ${faq.question}**\n\nA: ${faq.answer}\n\n`;
  });
  
  if (article.references.length > 0) {
    markdown += `## References\n\n`;
    article.references.forEach(ref => {
      markdown += `- ${ref}\n`;
    });
    markdown += `\n`;
  }
  
  if (article.furtherReading.length > 0) {
    markdown += `## Further Reading\n\n`;
    article.furtherReading.forEach(reading => {
      markdown += `- ${reading}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
}
