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
 * Synthesize knowledge article from extracted content
 */
export async function synthesizeArticle(
  title: string,
  content: string,
  facts: string[],
  entities: string[]
): Promise<SynthesizedArticle> {
  const cleanedContent = cleanContent(content);
  
  // Extract key information for each section
  const whatHappened = extractWhatHappened(cleanedContent, title);
  const whyItMatters = extractWhyItMatters(cleanedContent);
  const background = extractBackground(cleanedContent);
  const timeline = extractTimeline(cleanedContent);
  const keyFacts = extractKeyFacts(facts);
  const importantEntities = extractImportantEntities(entities);
  const expertAnalysis = extractExpertAnalysis(cleanedContent);
  const pros = extractPros(cleanedContent);
  const cons = extractCons(cleanedContent);
  const differentViewpoints = extractDifferentViewpoints(cleanedContent);
  const realWorldImpact = extractRealWorldImpact(cleanedContent);
  const faqs = generateFAQs(cleanedContent, title);
  const references = extractReferences(cleanedContent);
  const furtherReading = generateFurtherReading(cleanedContent);
  
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
 * Extract what happened section
 */
function extractWhatHappened(content: string, title: string): string {
  const firstParagraph = content.split('\n\n')[0] || content.substring(0, 300);
  return `${firstParagraph}`;
}

/**
 * Extract why it matters section
 */
function extractWhyItMatters(content: string): string {
  const keywords = ['important', 'critical', 'significant', 'impact', 'consequences', 'implications'];
  const sentences = content.split('. ');
  const relevantSentences = sentences.filter(s => 
    keywords.some(k => s.toLowerCase().includes(k))
  );
  
  if (relevantSentences.length > 0) {
    return relevantSentences.slice(0, 3).join('. ');
  }
  
  return "This development has significant implications for the industry and stakeholders involved.";
}

/**
 * Extract background section
 */
function extractBackground(content: string): string {
  const sentences = content.split('. ');
  const contextKeywords = ['background', 'history', 'context', 'previously', 'traditionally', 'historically'];
  const contextSentences = sentences.filter(s =>
    contextKeywords.some(k => s.toLowerCase().includes(k))
  );
  
  if (contextSentences.length > 0) {
    return contextSentences.join('. ');
  }
  
  return sentences.slice(0, 5).join('. ');
}

/**
 * Extract timeline section
 */
function extractTimeline(content: string): string {
  const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g;
  const dates = content.match(datePattern) || [];
  
  if (dates.length > 0) {
    return `Key dates mentioned: ${dates.join(', ')}`;
  }
  
  return "Timeline information not explicitly stated in the source material.";
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
 * Extract expert analysis
 */
function extractExpertAnalysis(content: string): string {
  const analysisKeywords = ['analysis', 'according to', 'experts say', 'industry analysts', 'observers note'];
  const sentences = content.split('. ');
  const analysisSentences = sentences.filter(s =>
    analysisKeywords.some(k => s.toLowerCase().includes(k))
  );
  
  if (analysisSentences.length > 0) {
    return analysisSentences.join('. ');
  }
  
  return "This development represents a significant shift in the landscape, with experts closely watching the implications.";
}

/**
 * Extract pros
 */
function extractPros(content: string): string[] {
  const proKeywords = ['benefit', 'advantage', 'positive', 'improvement', 'gain', 'success'];
  const sentences = content.split('. ');
  const proSentences = sentences.filter(s =>
    proKeywords.some(k => s.toLowerCase().includes(k))
  );
  
  return proSentences.slice(0, 5);
}

/**
 * Extract cons
 */
function extractCons(content: string): string[] {
  const conKeywords = ['challenge', 'concern', 'risk', 'drawback', 'limitation', 'issue'];
  const sentences = content.split('. ');
  const conSentences = sentences.filter(s =>
    conKeywords.some(k => s.toLowerCase().includes(k))
  );
  
  return conSentences.slice(0, 5);
}

/**
 * Extract different viewpoints
 */
function extractDifferentViewpoints(content: string): string[] {
  const viewKeywords = ['however', 'on the other hand', 'alternatively', 'some argue', 'critics say', 'proponents'];
  const sentences = content.split('. ');
  const viewSentences = sentences.filter(s =>
    viewKeywords.some(k => s.toLowerCase().includes(k))
  );
  
  return viewSentences.slice(0, 4);
}

/**
 * Extract real world impact
 */
function extractRealWorldImpact(content: string): string {
  const impactKeywords = ['impact', 'affect', 'change', 'transform', 'influence', 'result'];
  const sentences = content.split('. ');
  const impactSentences = sentences.filter(s =>
    impactKeywords.some(k => s.toLowerCase().includes(k))
  );
  
  if (impactSentences.length > 0) {
    return impactSentences.slice(0, 3).join('. ');
  }
  
  return "This development will have lasting effects on the industry and its stakeholders.";
}

/**
 * Generate FAQs
 */
function generateFAQs(content: string, title: string): { question: string; answer: string }[] {
  return [
    {
      question: `What is ${title}?`,
      answer: content.substring(0, 200),
    },
    {
      question: "Why is this important?",
      answer: "This development has significant implications for stakeholders and the broader industry.",
    },
    {
      question: "What happens next?",
      answer: "Stakeholders are monitoring the situation closely, with further developments expected.",
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
 * Generate further reading
 */
function generateFurtherReading(content: string): string[] {
  const topics = extractTopics(content);
  return topics.map(t => `${t} - Comprehensive guide and analysis`);
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
