/**
 * Knowledge Gap Completion Engine (Stage 9.5)
 *
 * Before rendering, the engine should ask:
 * "If I were the reader, what information would still be missing after reading this page?"
 *
 * Core Principle:
 * - Never ask "What facts do I have?"
 * - Always ask "What does the reader still need?"
 *
 * Category-Specific Gap Detection:
 * - Docker: Security, Networking, Volumes, Production usage
 * - Python: Learning roadmap, Projects, Career path, Mistakes
 * - Finance: Risk, Taxes, Inflation, Real calculations
 * - Travel: Packing, Visa, Budget, Weather, Emergency
 * - Business: Implementation steps, Team considerations, Timeline
 * - Health: Dosage, Interactions, Contraindications, When to stop
 * - Home: Tools, Supplies, Safety, Cleanup
 * - Education: Practice exercises, Assessment, Next steps
 */

import type { PluginFact } from "../types";
import type { NarrativeSection } from "./narrativePlanningEngine";
import type { ReaderQuestion } from "./readerPsychologyEngine";

export interface GapCompletionContext {
  topic: string;
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
  existingFacts: PluginFact[];
  narrativeSections: NarrativeSection[];
  readerQuestions: ReaderQuestion[];
}

export interface KnowledgeGap {
  type: string;
  description: string;
  priority: "critical" | "important" | "nice-to-have";
  category: string;
  canFill: boolean;
  suggestedContent: string | null;
}

export interface GapCompletionResult {
  gaps: KnowledgeGap[];
  filledGacts: PluginFact[];
  remainingGaps: KnowledgeGap[];
  readerReadinessScore: number; // 0-100
}

export class KnowledgeGapCompletionEngine {
  /**
   * Identify knowledge gaps based on category and topic
   */
  identifyGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    // Category-specific gap detection
    switch (context.category) {
      case "technology":
        gaps.push(...this.identifyTechnologyGaps(context));
        break;
      case "travel":
        gaps.push(...this.identifyTravelGaps(context));
        break;
      case "finance":
        gaps.push(...this.identifyFinanceGaps(context));
        break;
      case "business":
        gaps.push(...this.identifyBusinessGaps(context));
        break;
      case "health":
        gaps.push(...this.identifyHealthGaps(context));
        break;
      case "home":
        gaps.push(...this.identifyHomeGaps(context));
        break;
      case "education":
        gaps.push(...this.identifyEducationGaps(context));
        break;
      default:
        gaps.push(...this.identifyGenericGaps(context));
    }

    // Check if gaps can be filled with existing facts
    this.checkGapFillability(gaps, context.existingFacts);

    // Prioritize gaps
    this.prioritizeGaps(gaps, context);

    return gaps;
  }

  /**
   * Identify technology-specific knowledge gaps
   */
  private identifyTechnologyGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const topic = context.topic.toLowerCase();
    const existingFacts = context.existingFacts.map(f => f.statement.toLowerCase());

    // Security gaps
    if (!existingFacts.some(f => f.includes("security") || f.includes("vulnerability") || f.includes("attack"))) {
      gaps.push({
        type: "security",
        description: "Security considerations and best practices",
        priority: "critical",
        category: "technology",
        canFill: false,
        suggestedContent: `Security is a critical consideration when working with ${topic}. This includes authentication, authorization, data encryption, input validation, and protection against common attacks like SQL injection, XSS, and CSRF.`,
      });
    }

    // Performance gaps
    if (!existingFacts.some(f => f.includes("performance") || f.includes("optimization") || f.includes("speed"))) {
      gaps.push({
        type: "performance",
        description: "Performance optimization techniques",
        priority: "important",
        category: "technology",
        canFill: false,
        suggestedContent: `Performance optimization is essential for production applications with ${topic}. Key techniques include caching, lazy loading, database indexing, code optimization, and monitoring tools.`,
      });
    }

    // Testing gaps
    if (!existingFacts.some(f => f.includes("test") || f.includes("testing") || f.includes("unit"))) {
      gaps.push({
        type: "testing",
        description: "Testing strategies and best practices",
        priority: "important",
        category: "technology",
        canFill: false,
        suggestedContent: `Testing is crucial for maintaining code quality with ${topic}. This includes unit tests, integration tests, end-to-end tests, and test-driven development practices.`,
      });
    }

    // Deployment gaps
    if (!existingFacts.some(f => f.includes("deploy") || f.includes("production") || f.includes("ci/cd"))) {
      gaps.push({
        type: "deployment",
        description: "Deployment and CI/CD processes",
        priority: "important",
        category: "technology",
        canFill: false,
        suggestedContent: `Deployment strategies for ${topic} include continuous integration, continuous deployment, automated testing pipelines, and production monitoring.`,
      });
    }

    // Version control gaps
    if (!existingFacts.some(f => f.includes("version") || f.includes("git") || f.includes("collaboration"))) {
      gaps.push({
        type: "version-control",
        description: "Version control and collaboration",
        priority: "nice-to-have",
        category: "technology",
        canFill: false,
        suggestedContent: `Version control with Git is essential for ${topic} projects. This includes branching strategies, pull requests, code reviews, and conflict resolution.`,
      });
    }

    // Debugging gaps
    if (!existingFacts.some(f => f.includes("debug") || f.includes("error") || f.includes("troubleshoot"))) {
      gaps.push({
        type: "debugging",
        description: "Debugging and troubleshooting techniques",
        priority: "important",
        category: "technology",
        canFill: false,
        suggestedContent: `Debugging skills are critical when working with ${topic}. This includes using debuggers, logging, error handling, and common debugging strategies.`,
      });
    }

    return gaps;
  }

  /**
   * Identify travel-specific knowledge gaps
   */
  private identifyTravelGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const existingFacts = context.existingFacts.map(f => f.statement.toLowerCase());

    // Packing gaps
    if (!existingFacts.some(f => f.includes("pack") || f.includes("luggage") || f.includes("bring"))) {
      gaps.push({
        type: "packing",
        description: "Packing list and essentials",
        priority: "critical",
        category: "travel",
        canFill: false,
        suggestedContent: "Essential packing items include clothing appropriate for the climate, toiletries, medications, travel documents, electronics with chargers, and any specific items needed for planned activities.",
      });
    }

    // Visa/documentation gaps
    if (!existingFacts.some(f => f.includes("visa") || f.includes("passport") || f.includes("document"))) {
      gaps.push({
        type: "documentation",
        description: "Visa requirements and documentation",
        priority: "critical",
        category: "travel",
        canFill: false,
        suggestedContent: "Check visa requirements well in advance. Essential documents include passport, visa (if required), travel insurance, flight tickets, accommodation confirmation, and emergency contact information.",
      });
    }

    // Weather gaps
    if (!existingFacts.some(f => f.includes("weather") || f.includes("climate") || f.includes("season"))) {
      gaps.push({
        type: "weather",
        description: "Weather and seasonal considerations",
        priority: "important",
        category: "travel",
        canFill: false,
        suggestedContent: "Research the weather patterns for your travel dates. Pack appropriate clothing and gear for expected conditions, including rain protection or sun protection as needed.",
      });
    }

    // Emergency gaps
    if (!existingFacts.some(f => f.includes("emergency") || f.includes("safety") || f.includes("hospital"))) {
      gaps.push({
        type: "emergency",
        description: "Emergency contacts and safety information",
        priority: "critical",
        category: "travel",
        canFill: false,
        suggestedContent: "Keep emergency contacts handy including local emergency services, embassy contact information, and travel insurance emergency numbers. Know the location of nearest hospitals and police stations.",
      });
    }

    // Transportation gaps
    if (!existingFacts.some(f => f.includes("transport") || f.includes("get around") || f.includes("airport"))) {
      gaps.push({
        type: "transportation",
        description: "Local transportation options",
        priority: "important",
        category: "travel",
        canFill: false,
        suggestedContent: "Research transportation options including airport transfers, public transit, ride-sharing, car rental, and walking. Consider costs, convenience, and safety for each option.",
      });
    }

    return gaps;
  }

  /**
   * Identify finance-specific knowledge gaps
   */
  private identifyFinanceGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const existingFacts = context.existingFacts.map(f => f.statement.toLowerCase());

    // Tax gaps
    if (!existingFacts.some(f => f.includes("tax") || f.includes("irs") || f.includes("taxable"))) {
      gaps.push({
        type: "taxes",
        description: "Tax implications and considerations",
        priority: "critical",
        category: "finance",
        canFill: false,
        suggestedContent: "Tax implications vary by investment type and jurisdiction. Consider capital gains taxes, dividend taxes, tax-advantaged accounts, and tax-loss harvesting strategies.",
      });
    }

    // Inflation gaps
    if (!existingFacts.some(f => f.includes("inflation") || f.includes("purchasing power") || f.includes("real return"))) {
      gaps.push({
        type: "inflation",
        description: "Inflation impact on returns",
        priority: "important",
        category: "finance",
        canFill: false,
        suggestedContent: "Inflation erodes purchasing power over time. Real returns account for inflation, and investments should aim to outpace inflation to maintain wealth.",
      });
    }

    // Risk gaps
    if (!existingFacts.some(f => f.includes("risk") || f.includes("volatility") || f.includes("loss"))) {
      gaps.push({
        type: "risk",
        description: "Risk assessment and management",
        priority: "critical",
        category: "finance",
        canFill: false,
        suggestedContent: "Risk management includes diversification, asset allocation, stop-loss orders, and understanding your risk tolerance. No investment is completely risk-free.",
      });
    }

    // Time horizon gaps
    if (!existingFacts.some(f => f.includes("time horizon") || f.includes("short-term") || f.includes("long-term"))) {
      gaps.push({
        type: "time-horizon",
        description: "Time horizon considerations",
        priority: "important",
        category: "finance",
        canFill: false,
        suggestedContent: "Your investment time horizon affects risk tolerance and asset allocation. Short-term goals require safer investments, while long-term goals can tolerate more volatility.",
      });
    }

    // Emergency fund gaps
    if (!existingFacts.some(f => f.includes("emergency") || f.includes("savings") || f.includes("liquid"))) {
      gaps.push({
        type: "emergency-fund",
        description: "Emergency fund requirements",
        priority: "important",
        category: "finance",
        canFill: false,
        suggestedContent: "Before investing, build an emergency fund covering 3-6 months of expenses. Keep this in a liquid, accessible account like a high-yield savings account.",
      });
    }

    return gaps;
  }

  /**
   * Identify business-specific knowledge gaps
   */
  private identifyBusinessGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const existingFacts = context.existingFacts.map(f => f.statement.toLowerCase());

    // Implementation gaps
    if (!existingFacts.some(f => f.includes("implement") || f.includes("execute") || f.includes("deploy"))) {
      gaps.push({
        type: "implementation",
        description: "Implementation steps and timeline",
        priority: "critical",
        category: "business",
        canFill: false,
        suggestedContent: "Implementation requires planning, resource allocation, timeline management, stakeholder communication, and progress tracking. Break down into phases with clear milestones.",
      });
    }

    // Team gaps
    if (!existingFacts.some(f => f.includes("team") || f.includes("people") || f.includes("staff"))) {
      gaps.push({
        type: "team",
        description: "Team and personnel considerations",
        priority: "important",
        category: "business",
        canFill: false,
        suggestedContent: "Consider team size, skills required, hiring needs, training, and organizational structure. Clear roles and responsibilities are essential for success.",
      });
    }

    // Communication gaps
    if (!existingFacts.some(f => f.includes("communicate") || f.includes("stakeholder") || f.includes("report"))) {
      gaps.push({
        type: "communication",
        description: "Communication and stakeholder management",
        priority: "important",
        category: "business",
        canFill: false,
        suggestedContent: "Regular communication with stakeholders is crucial. This includes status updates, progress reports, change notifications, and feedback mechanisms.",
      });
    }

    // Metrics gaps
    if (!existingFacts.some(f => f.includes("metric") || f.includes("kpi") || f.includes("measure"))) {
      gaps.push({
        type: "metrics",
        description: "Success metrics and KPIs",
        priority: "important",
        category: "business",
        canFill: false,
        suggestedContent: "Define clear success metrics and KPIs before implementation. These should be measurable, time-bound, and aligned with business objectives.",
      });
    }

    return gaps;
  }

  /**
   * Identify health-specific knowledge gaps
   */
  private identifyHealthGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const existingFacts = context.existingFacts.map(f => f.statement.toLowerCase());

    // Dosage gaps
    if (!existingFacts.some(f => f.includes("dosage") || f.includes("dose") || f.includes("how much"))) {
      gaps.push({
        type: "dosage",
        description: "Dosage and administration",
        priority: "critical",
        category: "health",
        canFill: false,
        suggestedContent: "Dosage depends on individual factors including age, weight, medical history, and specific condition. Always follow healthcare provider recommendations.",
      });
    }

    // Interactions gaps
    if (!existingFacts.some(f => f.includes("interact") || f.includes("interaction") || f.includes("combine"))) {
      gaps.push({
        type: "interactions",
        description: "Drug or treatment interactions",
        priority: "critical",
        category: "health",
        canFill: false,
        suggestedContent: "Interactions can occur with medications, supplements, foods, or other treatments. Always disclose all current medications and supplements to healthcare providers.",
      });
    }

    // Contraindications gaps
    if (!existingFacts.some(f => f.includes("contraindication") || f.includes("should not") || f.includes("avoid"))) {
      gaps.push({
        type: "contraindications",
        description: "Contraindications and warnings",
        priority: "critical",
        category: "health",
        canFill: false,
        suggestedContent: "Certain conditions, medications, or situations may contraindicate this treatment. Always consult healthcare providers about your specific situation.",
      });
    }

    // When to stop gaps
    if (!existingFacts.some(f => f.includes("stop") || f.includes("discontinue") || f.includes("when to see"))) {
      gaps.push({
        type: "when-to-stop",
        description: "When to stop or seek help",
        priority: "critical",
        category: "health",
        canFill: false,
        suggestedContent: "Stop immediately and seek medical attention if you experience severe side effects, allergic reactions, or worsening symptoms. Know warning signs that require emergency care.",
      });
    }

    return gaps;
  }

  /**
   * Identify home-specific knowledge gaps
   */
  private identifyHomeGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const existingFacts = context.existingFacts.map(f => f.statement.toLowerCase());

    // Tools gaps
    if (!existingFacts.some(f => f.includes("tool") || f.includes("equipment") || f.includes("need"))) {
      gaps.push({
        type: "tools",
        description: "Tools and equipment needed",
        priority: "critical",
        category: "home",
        canFill: false,
        suggestedContent: "Gather all necessary tools and materials before starting. This ensures you won't need to stop mid-project and can work efficiently.",
      });
    }

    // Safety gaps
    if (!existingFacts.some(f => f.includes("safety") || f.includes("protect") || f.includes("danger"))) {
      gaps.push({
        type: "safety",
        description: "Safety precautions",
        priority: "critical",
        category: "home",
        canFill: false,
        suggestedContent: "Safety is paramount. Use appropriate protective equipment, follow manufacturer instructions, work in well-ventilated areas, and know emergency procedures.",
      });
    }

    // Cleanup gaps
    if (!existingFacts.some(f => f.includes("clean") || f.includes("dispose") || f.includes("waste"))) {
      gaps.push({
        type: "cleanup",
        description: "Cleanup and disposal",
        priority: "important",
        category: "home",
        canFill: false,
        suggestedContent: "Plan for cleanup and waste disposal before starting. Some materials require special disposal methods. Clean tools properly after use.",
      });
    }

    return gaps;
  }

  /**
   * Identify education-specific knowledge gaps
   */
  private identifyEducationGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const existingFacts = context.existingFacts.map(f => f.statement.toLowerCase());

    // Practice gaps
    if (!existingFacts.some(f => f.includes("practice") || f.includes("exercise") || f.includes("do"))) {
      gaps.push({
        type: "practice",
        description: "Practice exercises and activities",
        priority: "critical",
        category: "education",
        canFill: false,
        suggestedContent: "Practice is essential for learning. Include hands-on exercises, projects, and real-world applications to reinforce understanding.",
      });
    }

    // Assessment gaps
    if (!existingFacts.some(f => f.includes("test") || f.includes("assess") || f.includes("measure"))) {
      gaps.push({
        type: "assessment",
        description: "Self-assessment and progress tracking",
        priority: "important",
        category: "education",
        canFill: false,
        suggestedContent: "Regular self-assessment helps track progress and identify areas needing improvement. Use quizzes, projects, or practical tests to measure understanding.",
      });
    }

    // Next steps gaps
    if (!existingFacts.some(f => f.includes("next") || f.includes("continue") || f.includes("after"))) {
      gaps.push({
        type: "next-steps",
        description: "Next steps and learning path",
        priority: "important",
        category: "education",
        canFill: false,
        suggestedContent: "After mastering the basics, continue with intermediate and advanced topics. Build on foundations with increasingly complex projects and applications.",
      });
    }

    return gaps;
  }

  /**
   * Identify generic knowledge gaps
   */
  private identifyGenericGaps(context: GapCompletionContext): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const existingFacts = context.existingFacts.map(f => f.statement.toLowerCase());

    // Common mistakes
    if (!existingFacts.some(f => f.includes("mistake") || f.includes("error") || f.includes("wrong"))) {
      gaps.push({
        type: "common-mistakes",
        description: "Common mistakes to avoid",
        priority: "important",
        category: "general",
        canFill: false,
        suggestedContent: "Being aware of common mistakes helps you avoid them. Learn from others' experiences to save time and frustration.",
      });
    }

    // Troubleshooting
    if (!existingFacts.some(f => f.includes("troubleshoot") || f.includes("fix") || f.includes("problem"))) {
      gaps.push({
        type: "troubleshooting",
        description: "Troubleshooting common issues",
        priority: "important",
        category: "general",
        canFill: false,
        suggestedContent: "Knowing how to troubleshoot common issues saves time and frustration. Learn the most frequent problems and their solutions.",
      });
    }

    return gaps;
  }

  /**
   * Check if gaps can be filled with existing facts
   */
  private checkGapFillability(gaps: KnowledgeGap[], existingFacts: PluginFact[]): void {
    const factKeywords = existingFacts.map(f => f.statement.toLowerCase());

    for (const gap of gaps) {
      const gapKeywords = gap.description.toLowerCase().split(" ");
      const hasRelevantFacts = gapKeywords.some(keyword =>
        factKeywords.some(fact => fact.includes(keyword))
      );
      gap.canFill = hasRelevantFacts;
    }
  }

  /**
   * Prioritize gaps based on context
   */
  private prioritizeGaps(gaps: KnowledgeGap[], context: GapCompletionContext): void {
    gaps.sort((a, b) => {
      const priorityOrder = { critical: 0, important: 1, "nice-to-have": 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Adjust based on intent
    if (context.intent === "guide") {
      // Prioritize practical gaps for guides
      for (const gap of gaps) {
        if (gap.type === "tools" || gap.type === "implementation" || gap.type === "practice") {
          gap.priority = "critical";
        }
      }
    } else if (context.intent === "decide") {
      // Prioritize risk and comparison gaps for decisions
      for (const gap of gaps) {
        if (gap.type === "risk" || gap.type === "comparison" || gap.type === "taxes") {
          gap.priority = "critical";
        }
      }
    }
  }

  /**
   * Attempt to fill gaps with suggested content
   */
  fillGaps(gaps: KnowledgeGap[]): { filledGacts: PluginFact[]; remainingGaps: KnowledgeGap[] } {
    const filledGacts: PluginFact[] = [];
    const remainingGaps: KnowledgeGap[] = [];

    for (const gap of gaps) {
      if (gap.suggestedContent && gap.priority !== "nice-to-have") {
        filledGacts.push({
          id: `gap-fill-${gap.type}-${Date.now()}`,
          statement: gap.suggestedContent,
          factType: "property",
          confidence: "high",
          domain: gap.category,
          scope: "contextual",
          tags: ["gap-fill", gap.type],
        });
      } else {
        remainingGaps.push(gap);
      }
    }

    return { filledGacts, remainingGaps };
  }

  /**
   * Calculate reader readiness score
   */
  calculateReadinessScore(
    gaps: KnowledgeGap[],
    filledGacts: PluginFact[]
  ): number {
    const totalGaps = gaps.length;
    if (totalGaps === 0) return 100;

    const criticalGaps = gaps.filter(g => g.priority === "critical").length;
    const filledCriticalGaps = filledGacts.filter((f: PluginFact) =>
      gaps.some(g => g.priority === "critical" && f.tags?.includes(g.type))
    ).length;

    const importantGaps = gaps.filter(g => g.priority === "important").length;
    const filledImportantGaps = filledGacts.filter((f: PluginFact) =>
      gaps.some(g => g.priority === "important" && f.tags?.includes(g.type))
    ).length;

    // Critical gaps have more weight
    const criticalScore = criticalGaps > 0 ? (filledCriticalGaps / criticalGaps) * 50 : 50;
    const importantScore = importantGaps > 0 ? (filledImportantGaps / importantGaps) * 50 : 50;

    return Math.round(criticalScore + importantScore);
  }

  /**
   * Complete the gap analysis and filling process
   */
  completeGaps(context: GapCompletionContext): GapCompletionResult {
    const gaps = this.identifyGaps(context);
    const { filledGacts, remainingGaps } = this.fillGaps(gaps);
    const readinessScore = this.calculateReadinessScore(gaps, filledGacts);

    return {
      gaps,
      filledGacts,
      remainingGaps,
      readerReadinessScore: readinessScore,
    };
  }
}
