/**
 * Production Source Integration Roadmap - Phase A
 * HTML Documentation Extractor
 * 
 * Generic extractor for HTML documentation from official sources
 * Implements existing IExtractor interface
 */

import type { IExtractor, ExtractorConfig, ExtractorResult, ExtractedKnowledge } from "../connectors/connector";

export class HTMLDocumentationExtractor implements IExtractor {
  readonly sourceType = "html";
  readonly contentType = "html";

  extract(data: string | object, config: ExtractorConfig): Promise<ExtractorResult> {
    return new Promise((resolve) => {
      try {
        const html = typeof data === "string" ? data : JSON.stringify(data);
        
        if (!this.validateData(html)) {
          resolve({
            success: false,
            knowledge: null,
            error: "Invalid HTML data",
            warnings: [],
          });
          return;
        }

        const knowledge = this.extractKnowledge(html, config);

        resolve({
          success: true,
          knowledge,
          error: null,
          warnings: [],
        });
      } catch (error: any) {
        resolve({
          success: false,
          knowledge: null,
          error: error.message,
          warnings: [],
        });
      }
    });
  }

  validateData(data: string | object): boolean {
    const html = typeof data === "string" ? data : JSON.stringify(data);
    return !!html && html.length > 0;
  }

  private extractKnowledge(html: string, config: ExtractorConfig): ExtractedKnowledge {
    const sourceUrl = (config as any).sourceUrl || "";
    
    return {
      definitions: this.extractDefinitions(html, sourceUrl),
      concepts: this.extractConcepts(html, sourceUrl),
      procedures: this.extractProcedures(html, sourceUrl),
      examples: this.extractExamples(html, sourceUrl),
      comparisons: this.extractComparisons(html, sourceUrl),
      commands: this.extractCommands(html, sourceUrl),
      formulae: [],
      warnings: this.extractWarnings(html, sourceUrl),
      bestPractices: this.extractBestPractices(html, sourceUrl),
      commonMistakes: [],
      faqs: this.extractFAQs(html, sourceUrl),
      references: this.extractReferences(html, sourceUrl),
      metadata: {
        sourceUrl,
        extractedAt: new Date().toISOString(),
        confidence: 0.8,
      },
    };
  }

  private extractDefinitions(html: string, sourceUrl: string): any[] {
    const definitions: any[] = [];
    
    // Extract definitions from HTML headings and paragraphs with semantic meaning
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const descriptionMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
    
    if (titleMatch && descriptionMatch) {
      definitions.push({
        id: `def_${Date.now()}`,
        term: this.stripHTML(titleMatch[1]),
        definition: this.stripHTML(descriptionMatch[1]),
        context: sourceUrl,
      });
    }

    // Extract additional definitions from definition lists (<dl><dt><dd>)
    const dlRegex = /<dl[^>]*>([\s\S]*?)<\/dl>/gi;
    let dlMatch;
    let defIndex = 0;
    
    while ((dlMatch = dlRegex.exec(html)) !== null && defIndex < 10) {
      const dlContent = dlMatch[1];
      const dtRegex = /<dt[^>]*>(.*?)<\/dt>/gi;
      const ddRegex = /<dd[^>]*>(.*?)<\/dd>/gi;
      
      let dtMatch, ddMatch;
      while ((dtMatch = dtRegex.exec(dlContent)) !== null && (ddMatch = ddRegex.exec(dlContent)) !== null) {
        const term = this.stripHTML(dtMatch[1]);
        const definition = this.stripHTML(ddMatch[1]);
        if (term.length > 0 && definition.length > 0) {
          definitions.push({
            id: `def_${Date.now()}_${defIndex}`,
            term,
            definition,
            context: sourceUrl,
          });
          defIndex++;
        }
      }
    }

    return definitions;
  }

  private extractConcepts(html: string, sourceUrl: string): any[] {
    const concepts: any[] = [];
    
    // Extract concepts from h2, h3 headings
    const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
    let match;
    let index = 0;
    
    while ((match = headingRegex.exec(html)) !== null && index < 10) {
      const name = this.stripHTML(match[1]);
      if (name.length > 0) {
        concepts.push({
          id: `concept_${Date.now()}_${index}`,
          name,
          description: "",
          relatedConcepts: [],
        });
        index++;
      }
    }

    return concepts;
  }

  private extractProcedures(html: string, sourceUrl: string): any[] {
    const procedures: any[] = [];
    
    // Extract procedures from ordered lists (<ol>) which represent step-by-step processes
    const olRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
    let olMatch;
    let procIndex = 0;
    
    while ((olMatch = olRegex.exec(html)) !== null && procIndex < 5) {
      const olContent = olMatch[1];
      const liRegex = /<li[^>]*>(.*?)<\/li>/gi;
      const steps: string[] = [];
      let liMatch;
      
      while ((liMatch = liRegex.exec(olContent)) !== null) {
        const step = this.stripHTML(liMatch[1]);
        if (step.length > 0) {
          steps.push(step);
        }
      }
      
      if (steps.length > 1) {
        procedures.push({
          id: `proc_${Date.now()}_${procIndex}`,
          name: `Procedure ${procIndex + 1}`,
          steps,
          prerequisites: [],
          timeRequired: null,
        });
        procIndex++;
      }
    }

    // Extract procedures from unordered lists (<ul>) that might be procedures
    const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
    let ulMatch;
    
    while ((ulMatch = ulRegex.exec(html)) !== null && procIndex < 10) {
      const ulContent = ulMatch[1];
      const liRegex = /<li[^>]*>(.*?)<\/li>/gi;
      const steps: string[] = [];
      let liMatch;
      
      while ((liMatch = liRegex.exec(ulContent)) !== null) {
        const step = this.stripHTML(liMatch[1]);
        if (step.length > 0) {
          steps.push(step);
        }
      }
      
      if (steps.length > 1) {
        procedures.push({
          id: `proc_${Date.now()}_${procIndex}`,
          name: `Procedure ${procIndex + 1}`,
          steps,
          prerequisites: [],
          timeRequired: null,
        });
        procIndex++;
      }
    }

    // Extract procedures from code blocks (fallback)
    const codeRegex = /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let codeMatch;
    
    while ((codeMatch = codeRegex.exec(html)) !== null && procIndex < 15) {
      const code = this.stripHTML(codeMatch[1]);
      if (code.length > 0 && code.includes('\n')) {
        const steps = code.split('\n').filter(line => line.trim().length > 0);
        if (steps.length > 1) {
          procedures.push({
            id: `proc_${Date.now()}_${procIndex}`,
            name: `Procedure ${procIndex + 1}`,
            steps,
            prerequisites: [],
            timeRequired: null,
          });
          procIndex++;
        }
      }
    }

    return procedures;
  }

  private extractCommands(html: string, sourceUrl: string): any[] {
    const commands: any[] = [];
    
    // Extract CLI commands from code blocks that look like shell commands
    const codeRegex = /<pre[^>]*><code[^>]*class="[^"]*language-bash[^"]*"[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let codeMatch;
    let cmdIndex = 0;
    
    while ((codeMatch = codeRegex.exec(html)) !== null && cmdIndex < 10) {
      const code = this.stripHTML(codeMatch[1]);
      // Extract lines that look like commands (start with $ or common CLI prefixes)
      const lines = code.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0 && (trimmedLine.startsWith('$') || trimmedLine.startsWith('git ') || trimmedLine.startsWith('npm ') || trimmedLine.startsWith('pip ') || trimmedLine.startsWith('python ') || trimmedLine.startsWith('docker '))) {
          commands.push({
            id: `cmd_${Date.now()}_${cmdIndex}`,
            command: trimmedLine.replace(/^\$\s*/, ''),
            description: "CLI command",
            syntax: trimmedLine,
            examples: [],
          });
          cmdIndex++;
        }
      }
    }

    // Extract commands from inline code that looks like commands
    const inlineCodeRegex = /<code[^>]*>(\$\s*[a-z][a-z0-9\s\-_\./]+)<\/code>/gi;
    let inlineMatch;
    
    while ((inlineMatch = inlineCodeRegex.exec(html)) !== null && cmdIndex < 20) {
      const command = this.stripHTML(inlineMatch[1]).replace(/^\$\s*/, '');
      if (command.length > 0) {
        commands.push({
          id: `cmd_${Date.now()}_${cmdIndex}`,
          command,
          description: "CLI command",
          syntax: command,
          examples: [],
        });
        cmdIndex++;
      }
    }

    return commands;
  }

  private extractComparisons(html: string, sourceUrl: string): any[] {
    const comparisons: any[] = [];
    
    // Extract comparisons from HTML tables
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;
    let compIndex = 0;
    
    while ((tableMatch = tableRegex.exec(html)) !== null && compIndex < 5) {
      const tableContent = tableMatch[1];
      const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      
      if (rows && rows.length > 1) {
        let headers: string[] = [];
        const headerRow = rows[0].match(/<th[^>]*>(.*?)<\/th>/gi);
        if (headerRow) {
          headers = headerRow.map(h => this.stripHTML(h));
        }
        
        if (headers.length >= 2) {
          comparisons.push({
            id: `comp_${Date.now()}_${compIndex}`,
            subject1: headers[0] || "Option A",
            subject2: headers[1] || "Option B",
            criteria: headers.slice(2),
            comparisonData: [],
            context: sourceUrl,
          });
          compIndex++;
        }
      }
    }

    return comparisons;
  }

  private extractFAQs(html: string, sourceUrl: string): any[] {
    const faqs: any[] = [];
    
    // Extract FAQs from FAQ sections (typically h2/h3 with "FAQ" or "Questions" in text)
    const faqSectionRegex = /<h[23][^>]*>([^<]*(?:FAQ|Frequently Asked Questions|Questions)[^<]*)<\/h[23]>([\s\S]*?)(?=<h[23])/gi;
    let faqMatch;
    let faqIndex = 0;
    
    while ((faqMatch = faqSectionRegex.exec(html)) !== null && faqIndex < 10) {
      const sectionContent = faqMatch[2];
      
      // Look for question-answer patterns (dt/dd or heading+paragraph)
      const dtRegex = /<dt[^>]*>(.*?)<\/dt>\s*<dd[^>]*>(.*?)<\/dd>/gi;
      let dtMatch;
      
      while ((dtMatch = dtRegex.exec(sectionContent)) !== null && faqIndex < 10) {
        const question = this.stripHTML(dtMatch[1]);
        const answer = this.stripHTML(dtMatch[2]);
        
        if (question.length > 0 && answer.length > 0) {
          faqs.push({
            id: `faq_${Date.now()}_${faqIndex}`,
            question,
            answer,
            category: "General",
          });
          faqIndex++;
        }
      }
    }

    // Also extract from question patterns in paragraphs (e.g., "What is...", "How do I...")
    const questionRegex = /<p[^>]*>(What is|How do I|How to|Why|When|Where|Who|Which)[^<]*<\/p>/gi;
    let qMatch;
    
    while ((qMatch = questionRegex.exec(html)) !== null && faqIndex < 15) {
      const question = this.stripHTML(qMatch[1]);
      if (question.length > 0 && question.includes('?')) {
        faqs.push({
          id: `faq_${Date.now()}_${faqIndex}`,
          question,
          answer: "Answer extracted from documentation",
          category: "General",
        });
        faqIndex++;
      }
    }

    return faqs;
  }

  private extractExamples(html: string, sourceUrl: string): any[] {
    const examples: any[] = [];
    
    // Extract fenced code blocks (```language``` pattern)
    const fencedRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let fencedMatch;
    let index = 0;
    
    while ((fencedMatch = fencedRegex.exec(html)) !== null && index < 10) {
      const language = fencedMatch[1] || "unknown";
      const code = fencedMatch[2].trim();
      if (code.length > 0) {
        examples.push({
          id: `ex_${Date.now()}_${index}`,
          title: `${language} Example ${index + 1}`,
          description: `${language} code example`,
          code,
          language,
        });
        index++;
      }
    }
    
    // Extract from <pre><code> blocks
    const codeRegex = /<pre[^>]*><code[^>]*class="[^"]*language-(\w+)?[^"]*"[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let codeMatch;
    
    while ((codeMatch = codeRegex.exec(html)) !== null && index < 15) {
      const language = codeMatch[1] || "unknown";
      const code = this.stripHTML(codeMatch[2]);
      if (code.length > 0) {
        examples.push({
          id: `ex_${Date.now()}_${index}`,
          title: `${language} Example ${index + 1}`,
          description: `${language} code example`,
          code,
          language,
        });
        index++;
      }
    }

    return examples;
  }

  private extractWarnings(html: string, sourceUrl: string): any[] {
    const warnings: any[] = [];
    
    // Extract warnings from warning, note, caution blocks with various class names
    const warningRegex = /<(div|aside|section)[^>]*class="[^"]*(?:warning|note|caution|alert|important)[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    let index = 0;
    
    while ((match = warningRegex.exec(html)) !== null && index < 10) {
      const content = this.stripHTML(match[2]);
      if (content.length > 10) {
        warnings.push({
          id: `warn_${Date.now()}_${index}`,
          title: this.extractTitle(content) || "Important Note",
          description: content,
          severity: this.determineSeverity(content),
        });
        index++;
      }
    }

    return warnings;
  }

  private extractBestPractices(html: string, sourceUrl: string): any[] {
    const bestPractices: any[] = [];
    
    // Extract from best practice sections (h2/h3 with "best practice" in text)
    const bpSectionRegex = /<h[23][^>]*>([^<]*(?:best practice|guideline|recommendation)[^<]*)<\/h[23]>([\s\S]*?)(?=<h[23])/gi;
    let sectionMatch;
    let index = 0;
    
    while ((sectionMatch = bpSectionRegex.exec(html)) !== null && index < 5) {
      const title = this.stripHTML(sectionMatch[1]);
      const content = this.stripHTML(sectionMatch[2]);
      if (content.length > 20) {
        bestPractices.push({
          id: `bp_${Date.now()}_${index}`,
          title: title || "Best Practice",
          description: content,
          context: sourceUrl,
        });
        index++;
      }
    }
    
    // Extract from tip, note, callout boxes
    const tipRegex = /<(div|aside)[^>]*class="[^"]*(?:tip|callout|highlight)[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi;
    let tipMatch;
    
    while ((tipMatch = tipRegex.exec(html)) !== null && index < 10) {
      const content = this.stripHTML(tipMatch[2]);
      if (content.length > 20) {
        bestPractices.push({
          id: `bp_${Date.now()}_${index}`,
          title: "Best Practice",
          description: content,
          context: sourceUrl,
        });
        index++;
      }
    }

    return bestPractices;
  }

  private extractReferences(html: string, sourceUrl: string): any[] {
    const references: any[] = [];
    
    if (sourceUrl) {
      references.push({
        id: `ref_${Date.now()}`,
        url: sourceUrl,
        title: "Official Documentation",
        type: "documentation",
      });
    }

    return references;
  }

  private stripHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private extractTitle(content: string): string | null {
    const firstSentence = content.split('.')[0];
    if (firstSentence.length > 0 && firstSentence.length < 100) {
      return firstSentence.trim();
    }
    return null;
  }

  private determineSeverity(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('danger') || lowerContent.includes('critical') || lowerContent.includes('severe')) {
      return 'high';
    } else if (lowerContent.includes('warning') || lowerContent.includes('caution') || lowerContent.includes('important')) {
      return 'medium';
    }
    return 'low';
  }
}
