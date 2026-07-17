/**
 * Content Quality Validator - Phase 2
 * 
 * Validates content quality before publication in the controlled PSEO system.
 * Implements practical checks for thin content, duplicates, structure, and artifacts.
 * Does NOT use arbitrary word count as quality definition.
 * Does NOT create fake facts or automatically invent missing information.
 */

export interface ContentQualityIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface ContentQualityResult {
  passed: boolean;
  issues: ContentQualityIssue[];
  score: number; // 0-100 quality score
}

export interface ContentValidationInput {
  title: string;
  slug: string;
  content: string;
  subtitle?: string;
  metaDescription?: string;
}

export async function validateContentQuality(
  input: ContentValidationInput,
  existingTopics?: Array<{ slug: string; title: string; content: string }>
): Promise<ContentQualityResult> {
  const issues: ContentQualityIssue[] = [];
  let score = 100;

  // 1. Check for empty or extremely thin content
  const contentIssues = checkContentThickness(input.content);
  issues.push(...contentIssues);
  score -= contentIssues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 30 : 10), 0);

  // 2. Check for exact duplicate content
  if (existingTopics) {
    const duplicateIssues = checkDuplicateContent(input.content, existingTopics);
    issues.push(...duplicateIssues);
    score -= duplicateIssues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 40 : 20), 0);
  }

  // 3. Check for duplicate title/slug
  if (existingTopics) {
    const titleIssues = checkDuplicateTitleSlug(input.title, input.slug, existingTopics);
    issues.push(...titleIssues);
    score -= titleIssues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 50 : 25), 0);
  }

  // 4. Check for title-to-content mismatch
  const mismatchIssues = checkTitleContentMismatch(input.title, input.content);
  issues.push(...mismatchIssues);
  score -= mismatchIssues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 20 : 10), 0);

  // 5. Check for malformed heading hierarchy
  const headingIssues = checkHeadingHierarchy(input.content);
  issues.push(...headingIssues);
  score -= headingIssues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 15 : 5), 0);

  // 6. Check for repeated paragraphs within same article
  const repetitionIssues = checkInternalRepetition(input.content);
  issues.push(...repetitionIssues);
  score -= repetitionIssues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 20 : 10), 0);

  // 7. Check for generation artifacts/placeholders
  const artifactIssues = checkGenerationArtifacts(input.content);
  issues.push(...artifactIssues);
  score -= artifactIssues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 25 : 15), 0);

  // 8. Check for excessive repetitive boilerplate
  const boilerplateIssues = checkExcessiveBoilerplate(input.content);
  issues.push(...boilerplateIssues);
  score -= boilerplateIssues.reduce((acc, issue) => acc + (issue.severity === 'error' ? 15 : 5), 0);

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Content passes if no errors and score >= 60
  const hasErrors = issues.some(issue => issue.severity === 'error');
  const passed = !hasErrors && score >= 60;

  return {
    passed,
    issues,
    score
  };
}

function checkContentThickness(content: string): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const strippedContent = content.replace(/<[^>]*>/g, '').trim();
  const wordCount = strippedContent.split(/\s+/).length;
  const charCount = strippedContent.length;

  // Empty content
  if (charCount === 0) {
    issues.push({
      code: 'EMPTY_CONTENT',
      severity: 'error',
      message: 'Content is completely empty',
      suggestion: 'Add meaningful content before publishing'
    });
    return issues;
  }

  // Extremely thin content (less than 50 words or 200 characters)
  if (wordCount < 50 || charCount < 200) {
    issues.push({
      code: 'THIN_CONTENT',
      severity: 'error',
      message: `Content is too thin (${wordCount} words, ${charCount} characters)`,
      suggestion: 'Expand content to provide meaningful information (minimum 50 words)'
    });
  } 
  // Warning for thin but publishable content (less than 200 words)
  else if (wordCount < 200) {
    issues.push({
      code: 'BRIEF_CONTENT',
      severity: 'warning',
      message: `Content is brief (${wordCount} words)`,
      suggestion: 'Consider expanding for better user experience'
    });
  }

  return issues;
}

function checkDuplicateContent(
  content: string,
  existingTopics: Array<{ slug: string; title: string; content: string }>
): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const normalizedContent = normalizeContentForComparison(content);

  for (const existing of existingTopics) {
    const normalizedExisting = normalizeContentForComparison(existing.content);
    
    // Check for exact match
    if (normalizedContent === normalizedExisting) {
      issues.push({
        code: 'EXACT_DUPLICATE',
        severity: 'error',
        message: `Content is an exact duplicate of existing topic "${existing.title}"`,
        suggestion: 'Modify content to be unique or update existing topic instead'
      });
      break; // Only report one exact duplicate
    }

    // Check for high similarity (>90%)
    const similarity = calculateSimilarity(normalizedContent, normalizedExisting);
    if (similarity > 0.9) {
      issues.push({
        code: 'HIGH_SIMILARITY',
        severity: 'error',
        message: `Content is ${Math.round(similarity * 100)}% similar to existing topic "${existing.title}"`,
        suggestion: 'Significantly modify content to be unique'
      });
    }
  }

  return issues;
}

function checkDuplicateTitleSlug(
  title: string,
  slug: string,
  existingTopics: Array<{ slug: string; title: string; content: string }>
): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];

  for (const existing of existingTopics) {
    // Exact slug match
    if (slug === existing.slug) {
      issues.push({
        code: 'DUPLICATE_SLUG',
        severity: 'error',
        message: `Slug "${slug}" already exists for topic "${existing.title}"`,
        suggestion: 'Use a unique slug for this topic'
      });
    }

    // Exact title match
    if (title.toLowerCase() === existing.title.toLowerCase()) {
      issues.push({
        code: 'DUPLICATE_TITLE',
        severity: 'warning',
        message: `Title "${title}" already exists for topic with slug "${existing.slug}"`,
        suggestion: 'Use a unique title or consider updating existing topic'
      });
    }
  }

  return issues;
}

function checkTitleContentMismatch(title: string, content: string): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const normalizedTitle = title.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const normalizedContent = content.toLowerCase().replace(/<[^>]*>/g, '');
  const contentWords = normalizedContent.split(/\s+/).filter(w => w.length > 3);

  // Check if title words appear in content
  const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 3);
  const titleWordsInContent = titleWords.filter(word => contentWords.includes(word));
  
  if (titleWords.length > 0 && titleWordsInContent.length / titleWords.length < 0.3) {
    issues.push({
      code: 'TITLE_MISMATCH',
      severity: 'warning',
      message: 'Title does not seem to match content',
      suggestion: 'Ensure content actually discusses what the title promises'
    });
  }

  return issues;
}

function checkHeadingHierarchy(content: string): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const headingRegex = /<h([1-6])[^>]*>/gi;
  const headings: Array<{ level: number; text: string }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    const text = match[0].replace(/<[^>]*>/g, '').trim();
    headings.push({ level, text });
  }

  // Check for skipped heading levels
  for (let i = 1; i < headings.length; i++) {
    const current = headings[i].level;
    const previous = headings[i - 1].level;
    
    if (current > previous + 1) {
      issues.push({
        code: 'HEADING_SKIP',
        severity: 'warning',
        message: `Heading level skipped from H${previous} to H${current}`,
        suggestion: 'Use proper heading hierarchy (H1, H2, H3, etc.)'
      });
    }
  }

  // Check for empty headings
  for (const heading of headings) {
    if (heading.text.length === 0) {
      issues.push({
        code: 'EMPTY_HEADING',
        severity: 'warning',
        message: 'Empty heading found',
        suggestion: 'Provide meaningful text for all headings'
      });
    }
  }

  return issues;
}

function checkInternalRepetition(content: string): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const paragraphs = content.split(/<\/p>/i).map(p => p.replace(/<[^>]*>/g, '').trim()).filter(p => p.length > 50);
  
  // Check for repeated paragraphs
  for (let i = 0; i < paragraphs.length; i++) {
    for (let j = i + 1; j < paragraphs.length; j++) {
      const similarity = calculateSimilarity(
        normalizeContentForComparison(paragraphs[i]),
        normalizeContentForComparison(paragraphs[j])
      );
      
      if (similarity > 0.85) {
        issues.push({
          code: 'REPEATED_PARAGRAPH',
          severity: 'warning',
          message: 'Repeated or very similar paragraphs detected',
          suggestion: 'Remove duplicate content to improve readability'
        });
        return issues; // Only report once
      }
    }
  }

  return issues;
}

function checkGenerationArtifacts(content: string): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const lowerContent = content.toLowerCase();

  // Common generation artifacts
  const artifacts = [
    'lorem ipsum',
    '[placeholder]',
    '[insert here]',
    'to be determined',
    'coming soon',
    'more content needed',
    'this is a placeholder',
    'example text',
    'sample content',
    '[add content]',
    'fill in later',
    'tbd',
    'todo: add',
    'placeholder text'
  ];

  for (const artifact of artifacts) {
    if (lowerContent.includes(artifact)) {
      issues.push({
        code: 'GENERATION_ARTIFACT',
        severity: 'error',
        message: `Generation artifact detected: "${artifact}"`,
        suggestion: 'Remove all placeholder text before publishing'
      });
      break; // Only report one
    }
  }

  return issues;
}

function checkExcessiveBoilerplate(content: string): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return issues;

  // Check for repetitive sentence patterns
  const sentenceHashes = sentences.map(s => hashString(s.trim().toLowerCase()));
  const uniqueHashes = new Set(sentenceHashes);
  
  const repetitionRatio = 1 - (uniqueHashes.size / sentences.length);
  
  if (repetitionRatio > 0.4) {
    issues.push({
      code: 'EXCESSIVE_BOILERPLATE',
      severity: 'warning',
      message: `High content repetition detected (${Math.round(repetitionRatio * 100)}% of sentences are similar)`,
      suggestion: 'Reduce repetitive boilerplate and add unique, valuable content'
    });
  }

  return issues;
}

// Helper functions

function normalizeContentForComparison(content: string): string {
  return content
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;
  
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
