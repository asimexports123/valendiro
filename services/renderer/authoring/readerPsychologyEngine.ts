/**
 * Reader Psychology Engine (Stage 5.5)
 *
 * Understands what questions are in the reader's mind right now.
 * The article should answer questions before the reader asks them.
 *
 * Core Philosophy:
 * - Never ask "What facts do I have?"
 * - Always ask "What does the reader still need?"
 *
 * Category-Specific Question Generation:
 * - Technology: "What can I build?", "Is it difficult?", "Should I learn X or Y?"
 * - Travel: "How much money?", "Is it safe?", "What mistakes do tourists make?"
 * - Finance: "Will I lose money?", "Which option is better?", "What would experts do?"
 * - Business: "How do I choose?", "What is the risk?", "What usually fails?"
 * - Health: "Is this safe?", "What are side effects?", "When should I see a doctor?"
 * - Home: "How long does this take?", "What supplies do I need?", "What if it goes wrong?"
 * - Education: "How long to learn?", "What should I learn first?", "How do I practice?"
 */

import type { PluginFact } from "../types";

export interface ReaderPsychologyContext {
  topic: string;
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
  facts: PluginFact[];
}

export interface ReaderQuestion {
  question: string;
  priority: "critical" | "important" | "nice-to-have";
  category: string;
  context: string;
  shouldAnswer: boolean;
}

export class ReaderPsychologyEngine {
  /**
   * Generate reader questions based on topic, category, and intent
   */
  generateReaderQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];

    // Category-specific question generation
    switch (context.category) {
      case "technology":
        questions.push(...this.generateTechnologyQuestions(context));
        break;
      case "travel":
        questions.push(...this.generateTravelQuestions(context));
        break;
      case "finance":
        questions.push(...this.generateFinanceQuestions(context));
        break;
      case "business":
        questions.push(...this.generateBusinessQuestions(context));
        break;
      case "health":
        questions.push(...this.generateHealthQuestions(context));
        break;
      case "home":
        questions.push(...this.generateHomeQuestions(context));
        break;
      case "education":
        questions.push(...this.generateEducationQuestions(context));
        break;
      default:
        questions.push(...this.generateGenericQuestions(context));
    }

    // Intent-specific question enhancement
    this.enhanceForIntent(questions, context.intent);

    // Complexity-based filtering
    this.filterForComplexity(questions, context.complexity);

    // Prioritize questions
    this.prioritizeQuestions(questions, context);

    return questions;
  }

  /**
   * Generate technology-specific reader questions
   */
  private generateTechnologyQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];
    const topic = context.topic;

    questions.push({
      question: `What can I actually build with ${topic}?`,
      priority: "critical",
      category: "technology",
      context: "Practical application",
      shouldAnswer: true,
    });

    questions.push({
      question: `Is ${topic} difficult to learn?`,
      priority: "critical",
      category: "technology",
      context: "Learning curve",
      shouldAnswer: true,
    });

    questions.push({
      question: `How long does it take to learn ${topic}?`,
      priority: "important",
      category: "technology",
      context: "Time investment",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are the prerequisites for learning ${topic}?`,
      priority: "important",
      category: "technology",
      context: "Prerequisites",
      shouldAnswer: true,
    });

    questions.push({
      question: `Should I learn ${topic} or [alternative]?`,
      priority: "important",
      category: "technology",
      context: "Comparison",
      shouldAnswer: context.intent === "decide",
    });

    questions.push({
      question: `What are the career prospects for ${topic}?`,
      priority: "important",
      category: "technology",
      context: "Career",
      shouldAnswer: context.intent === "educate" || context.intent === "decide",
    });

    questions.push({
      question: `What are common mistakes beginners make with ${topic}?`,
      priority: "important",
      category: "technology",
      context: "Mistakes",
      shouldAnswer: true,
    });

    questions.push({
      question: `What tools do I need to work with ${topic}?`,
      priority: "nice-to-have",
      category: "technology",
      context: "Tools",
      shouldAnswer: context.intent === "guide",
    });

    questions.push({
      question: `What are the best resources for learning ${topic}?`,
      priority: "nice-to-have",
      category: "technology",
      context: "Resources",
      shouldAnswer: context.intent === "educate",
    });

    return questions;
  }

  /**
   * Generate travel-specific reader questions
   */
  private generateTravelQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];
    const topic = context.topic;

    questions.push({
      question: `How much money do I need for ${topic}?`,
      priority: "critical",
      category: "travel",
      context: "Budget",
      shouldAnswer: true,
    });

    questions.push({
      question: `Is ${topic} safe?`,
      priority: "critical",
      category: "travel",
      context: "Safety",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are common mistakes tourists make with ${topic}?`,
      priority: "important",
      category: "travel",
      context: "Mistakes",
      shouldAnswer: true,
    });

    questions.push({
      question: `When is the best time for ${topic}?`,
      priority: "important",
      category: "travel",
      context: "Timing",
      shouldAnswer: true,
    });

    questions.push({
      question: `How long should I plan for ${topic}?`,
      priority: "important",
      category: "travel",
      context: "Duration",
      shouldAnswer: true,
    });

    questions.push({
      question: `What do I need to pack for ${topic}?`,
      priority: "important",
      category: "travel",
      context: "Packing",
      shouldAnswer: context.intent === "guide",
    });

    questions.push({
      question: `Do I need a visa for ${topic}?`,
      priority: "important",
      category: "travel",
      context: "Documentation",
      shouldAnswer: context.intent === "guide",
    });

    questions.push({
      question: `What should I avoid during ${topic}?`,
      priority: "nice-to-have",
      category: "travel",
      context: "Warnings",
      shouldAnswer: true,
    });

    return questions;
  }

  /**
   * Generate finance-specific reader questions
   */
  private generateFinanceQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];
    const topic = context.topic;

    questions.push({
      question: `Will I lose money with ${topic}?`,
      priority: "critical",
      category: "finance",
      context: "Risk",
      shouldAnswer: true,
    });

    questions.push({
      question: `Which option is better for ${topic}?`,
      priority: "critical",
      category: "finance",
      context: "Comparison",
      shouldAnswer: context.intent === "decide",
    });

    questions.push({
      question: `What would experts do with ${topic}?`,
      priority: "important",
      category: "finance",
      context: "Expert advice",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are the tax implications of ${topic}?`,
      priority: "important",
      category: "finance",
      context: "Taxes",
      shouldAnswer: true,
    });

    questions.push({
      question: `How does inflation affect ${topic}?`,
      priority: "important",
      category: "finance",
      context: "Inflation",
      shouldAnswer: context.complexity !== "beginner",
    });

    questions.push({
      question: `What are the fees associated with ${topic}?`,
      priority: "important",
      category: "finance",
      context: "Fees",
      shouldAnswer: true,
    });

    questions.push({
      question: `Can I afford ${topic} right now?`,
      priority: "important",
      category: "finance",
      context: "Affordability",
      shouldAnswer: context.intent === "decide",
    });

    questions.push({
      question: `What if something goes wrong with ${topic}?`,
      priority: "nice-to-have",
      category: "finance",
      context: "Risk management",
      shouldAnswer: true,
    });

    return questions;
  }

  /**
   * Generate business-specific reader questions
   */
  private generateBusinessQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];
    const topic = context.topic;

    questions.push({
      question: `How do I choose the right approach for ${topic}?`,
      priority: "critical",
      category: "business",
      context: "Decision making",
      shouldAnswer: true,
    });

    questions.push({
      question: `What is the risk with ${topic}?`,
      priority: "critical",
      category: "business",
      context: "Risk",
      shouldAnswer: true,
    });

    questions.push({
      question: `What usually fails with ${topic}?`,
      priority: "critical",
      category: "business",
      context: "Failure patterns",
      shouldAnswer: true,
    });

    questions.push({
      question: `What's the ROI of ${topic}?`,
      priority: "important",
      category: "business",
      context: "ROI",
      shouldAnswer: true,
    });

    questions.push({
      question: `How long until ${topic} shows results?`,
      priority: "important",
      category: "business",
      context: "Timeline",
      shouldAnswer: true,
    });

    questions.push({
      question: `What resources do I need for ${topic}?`,
      priority: "important",
      category: "business",
      context: "Resources",
      shouldAnswer: context.intent === "guide",
    });

    questions.push({
      question: `What are the alternatives to ${topic}?`,
      priority: "nice-to-have",
      category: "business",
      context: "Alternatives",
      shouldAnswer: context.intent === "decide",
    });

    questions.push({
      question: `How do I measure success with ${topic}?`,
      priority: "nice-to-have",
      category: "business",
      context: "Metrics",
      shouldAnswer: true,
    });

    return questions;
  }

  /**
   * Generate health-specific reader questions
   */
  private generateHealthQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];
    const topic = context.topic;

    questions.push({
      question: `Is ${topic} safe?`,
      priority: "critical",
      category: "health",
      context: "Safety",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are the side effects of ${topic}?`,
      priority: "critical",
      category: "health",
      context: "Side effects",
      shouldAnswer: true,
    });

    questions.push({
      question: `When should I see a doctor about ${topic}?`,
      priority: "critical",
      category: "health",
      context: "Medical attention",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are the warning signs with ${topic}?`,
      priority: "important",
      category: "health",
      context: "Warning signs",
      shouldAnswer: true,
    });

    questions.push({
      question: `How long does ${topic} take to work?`,
      priority: "important",
      category: "health",
      context: "Timeline",
      shouldAnswer: true,
    });

    questions.push({
      question: `What if ${topic} doesn't work for me?`,
      priority: "important",
      category: "health",
      context: "Alternatives",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are the long-term effects of ${topic}?`,
      priority: "nice-to-have",
      category: "health",
      context: "Long-term effects",
      shouldAnswer: context.complexity !== "beginner",
    });

    questions.push({
      question: `Can I combine ${topic} with other treatments?`,
      priority: "nice-to-have",
      category: "health",
      context: "Interactions",
      shouldAnswer: true,
    });

    return questions;
  }

  /**
   * Generate home-specific reader questions
   */
  private generateHomeQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];
    const topic = context.topic;

    questions.push({
      question: `How long does ${topic} take?`,
      priority: "critical",
      category: "home",
      context: "Time",
      shouldAnswer: true,
    });

    questions.push({
      question: `What supplies do I need for ${topic}?`,
      priority: "critical",
      category: "home",
      context: "Supplies",
      shouldAnswer: context.intent === "guide",
    });

    questions.push({
      question: `How much does ${topic} cost?`,
      priority: "important",
      category: "home",
      context: "Cost",
      shouldAnswer: true,
    });

    questions.push({
      question: `What if something goes wrong with ${topic}?`,
      priority: "important",
      category: "home",
      context: "Troubleshooting",
      shouldAnswer: true,
    });

    questions.push({
      question: `Can I do ${topic} myself or should I hire someone?`,
      priority: "important",
      category: "home",
      context: "DIY vs professional",
      shouldAnswer: context.intent === "decide",
    });

    questions.push({
      question: `What are the common mistakes with ${topic}?`,
      priority: "nice-to-have",
      category: "home",
      context: "Mistakes",
      shouldAnswer: true,
    });

    questions.push({
      question: `How do I maintain ${topic} after completion?`,
      priority: "nice-to-have",
      category: "home",
      context: "Maintenance",
      shouldAnswer: true,
    });

    return questions;
  }

  /**
   * Generate education-specific reader questions
   */
  private generateEducationQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];
    const topic = context.topic;

    questions.push({
      question: `How long does it take to learn ${topic}?`,
      priority: "critical",
      category: "education",
      context: "Time",
      shouldAnswer: true,
    });

    questions.push({
      question: `What should I learn first for ${topic}?`,
      priority: "critical",
      category: "education",
      context: "Learning path",
      shouldAnswer: true,
    });

    questions.push({
      question: `How do I practice ${topic}?`,
      priority: "critical",
      category: "education",
      context: "Practice",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are the prerequisites for ${topic}?`,
      priority: "important",
      category: "education",
      context: "Prerequisites",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are good projects for learning ${topic}?`,
      priority: "important",
      category: "education",
      context: "Projects",
      shouldAnswer: context.intent === "educate",
    });

    questions.push({
      question: `What are the best resources for ${topic}?`,
      priority: "important",
      category: "education",
      context: "Resources",
      shouldAnswer: true,
    });

    questions.push({
      question: `What career paths use ${topic}?`,
      priority: "nice-to-have",
      category: "education",
      context: "Career",
      shouldAnswer: context.intent === "educate" || context.intent === "decide",
    });

    questions.push({
      question: `How do I know if I'm making progress with ${topic}?`,
      priority: "nice-to-have",
      category: "education",
      context: "Progress",
      shouldAnswer: true,
    });

    return questions;
  }

  /**
   * Generate generic reader questions (fallback)
   */
  private generateGenericQuestions(context: ReaderPsychologyContext): ReaderQuestion[] {
    const questions: ReaderQuestion[] = [];
    const topic = context.topic;

    questions.push({
      question: `What is ${topic}?`,
      priority: "critical",
      category: "general",
      context: "Definition",
      shouldAnswer: true,
    });

    questions.push({
      question: `Why is ${topic} important?`,
      priority: "critical",
      category: "general",
      context: "Importance",
      shouldAnswer: true,
    });

    questions.push({
      question: `How does ${topic} work?`,
      priority: "important",
      category: "general",
      context: "Mechanism",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are the benefits of ${topic}?`,
      priority: "important",
      category: "general",
      context: "Benefits",
      shouldAnswer: true,
    });

    questions.push({
      question: `What are the risks or downsides of ${topic}?`,
      priority: "important",
      category: "general",
      context: "Risks",
      shouldAnswer: true,
    });

    return questions;
  }

  /**
   * Enhance questions based on reader intent
   */
  private enhanceForIntent(questions: ReaderQuestion[], intent: string): void {
    questions.forEach(q => {
      if (intent === "decide") {
        // Prioritize comparison and risk questions for decision-making
        if (q.context === "Comparison" || q.context === "Risk" || q.context === "Alternatives") {
          q.priority = "critical";
        }
      } else if (intent === "guide") {
        // Prioritize practical questions for guides
        if (q.context === "Supplies" || q.context === "Tools" || q.context === "Steps") {
          q.priority = "critical";
        }
      } else if (intent === "educate") {
        // Prioritize learning questions for education
        if (q.context === "Learning path" || q.context === "Resources" || q.context === "Career") {
          q.priority = "important";
        }
      }
    });
  }

  /**
   * Filter questions based on complexity level
   */
  private filterForComplexity(questions: ReaderQuestion[], complexity: string): void {
    questions.forEach(q => {
      if (complexity === "beginner") {
        // Keep all critical and important questions
        // Mark some nice-to-have as shouldAnswer: false if too advanced
        if (q.priority === "nice-to-have" && q.context === "Inflation" || q.context === "Long-term effects") {
          q.shouldAnswer = false;
        }
      } else if (complexity === "advanced") {
        // Advanced readers might want deeper questions
        if (q.context === "Definition" && q.priority !== "critical") {
          q.priority = "nice-to-have";
        }
      }
    });
  }

  /**
   * Prioritize questions and return only those that should be answered
   */
  private prioritizeQuestions(questions: ReaderQuestion[], context: ReaderPsychologyContext): void {
    // Sort by priority
    questions.sort((a, b) => {
      const priorityOrder = { critical: 0, important: 1, "nice-to-have": 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Mark questions as shouldAnswer based on available facts
    // This is a simple heuristic - in production, this would check if facts exist to answer
    questions.forEach(q => {
      if (q.priority === "nice-to-have" && context.facts.length < 10) {
        q.shouldAnswer = false;
      }
    });
  }

  /**
   * Get only the questions that should be answered
   */
  getQuestionsToAnswer(questions: ReaderQuestion[]): ReaderQuestion[] {
    return questions.filter(q => q.shouldAnswer);
  }

  /**
   * Get the top N questions by priority
   */
  getTopQuestions(questions: ReaderQuestion[], count: number = 5): ReaderQuestion[] {
    return questions.filter(q => q.shouldAnswer).slice(0, count);
  }
}
