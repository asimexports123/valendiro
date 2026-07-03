/**
 * Example Generator
 *
 * Generates practical, concrete examples to help readers visualize concepts.
 * 
 * Principles:
 * - Examples should clarify, not increase word count
 * - Use real-world scenarios when possible
 * - Keep examples simple and relatable
 * - Match complexity to reader level
 */

import type { PluginFact } from "../types";

export interface GeneratedExample {
  text: string;
  type: "real-world" | "analogy" | "hypothetical" | "concrete";
  context: string;
}

export interface CompositionContext {
  facts: PluginFact[];
  config: any;
  subject: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
}

export class ExampleGenerator {
  /**
   * Add examples to facts where appropriate
   */
  addExamples(
    facts: PluginFact[],
    sectionType: string,
    context: CompositionContext
  ): PluginFact[] {
    // Not all sections need examples
    const sectionsWithExamples = ["example", "applications", "benefits", "how-it-works"];
    if (!sectionsWithExamples.includes(sectionType)) {
      return facts;
    }

    // Determine if examples would add value
    if (this.shouldAddExamples(facts, sectionType, context)) {
      return this.injectExamples(facts, sectionType, context);
    }

    return facts;
  }

  /**
   * Determine if examples would add value for this section
   */
  private shouldAddExamples(
    facts: PluginFact[],
    sectionType: string,
    context: CompositionContext
  ): boolean {
    // Always add examples for beginner complexity
    if (context.complexity === "beginner") {
      return true;
    }

    // Add examples for specific section types
    if (sectionType === "example" || sectionType === "applications") {
      return true;
    }

    // Add examples if facts are abstract
    const abstractCount = facts.filter(f => this.isAbstract(f.statement)).length;
    if (abstractCount > facts.length / 2) {
      return true;
    }

    return false;
  }

  /**
   * Inject examples into the fact list
   */
  private injectExamples(
    facts: PluginFact[],
    sectionType: string,
    context: CompositionContext
  ): PluginFact[] {
    const enriched: PluginFact[] = [];

    for (const fact of facts) {
      enriched.push(fact);

      // Add example after every 2-3 facts
      if (this.shouldAddExampleForFact(fact, sectionType, context)) {
        const example = this.generateExample(fact, sectionType, context);
        if (example) {
          enriched.push({
            ...fact,
            id: `${fact.id}-example`,
            statement: example.text,
            factType: "example",
            tags: [...(fact.tags || []), "generated-example"],
            confidence: fact.confidence,
            scope: fact.scope,
            domain: fact.domain,
          });
        }
      }
    }

    return enriched;
  }

  /**
   * Determine if a specific fact needs an example
   */
  private shouldAddExampleForFact(
    fact: PluginFact,
    sectionType: string,
    context: CompositionContext
  ): boolean {
    // Rule facts always benefit from examples
    if (fact.factType === "rule") {
      return true;
    }

    // Property facts in examples/applications sections
    if (sectionType === "example" && fact.factType === "property") {
      return true;
    }

    // Abstract statements need examples
    if (this.isAbstract(fact.statement)) {
      return true;
    }

    return false;
  }

  /**
   * Generate an example for a fact
   */
  private generateExample(
    fact: PluginFact,
    sectionType: string,
    context: CompositionContext
  ): GeneratedExample | null {
    const exampleType = this.selectExampleType(fact, context);

    switch (exampleType) {
      case "real-world":
        return this.generateRealWorldExample(fact, context);
      case "analogy":
        return this.generateAnalogy(fact, context);
      case "hypothetical":
        return this.generateHypotheticalExample(fact, context);
      case "concrete":
        return this.generateConcreteExample(fact, context);
      default:
        return null;
    }
  }

  /**
   * Select the best example type for this fact
   */
  private selectExampleType(
    fact: PluginFact,
    context: CompositionContext
  ): "real-world" | "analogy" | "hypothetical" | "concrete" {
    if (context.complexity === "beginner") {
      return "analogy"; // Analogies work best for beginners
    }

    if (fact.factType === "rule") {
      return "hypothetical"; // Rules work well with hypothetical scenarios
    }

    if (fact.factType === "property") {
      return "real-world"; // Properties work well with real-world examples
    }

    return "concrete";
  }

  /**
   * Generate a real-world example
   */
  private generateRealWorldExample(
    fact: PluginFact,
    context: CompositionContext
  ): GeneratedExample | null {
    const subject = context.subject.toLowerCase();
    
    // Domain-specific realistic examples
    const realisticExamples: Record<string, string[]> = {
      "machine learning": [
        "Gmail automatically filters spam emails by learning patterns from millions of messages",
        "Netflix recommends movies based on your viewing history and preferences",
        "YouTube suggests videos you might like based on watch time and engagement",
        "Google Photos organizes your images by recognizing faces and objects",
        "Credit card companies detect fraud by analyzing transaction patterns",
        "Spotify creates personalized playlists based on your music listening habits",
        "Amazon suggests products you might want based on purchase history",
        "Self-driving cars use computer vision to navigate traffic and avoid obstacles",
      ],
      "css": [
        "Amazon product pages use CSS grid for responsive product layouts",
        "YouTube uses CSS flexbox for video player controls",
        "News websites use CSS media queries for mobile-responsive layouts",
        "Personal portfolios use CSS animations for smooth scrolling effects",
        "E-commerce sites use CSS hover effects for product image zoom",
        "Social media platforms use CSS for dark mode toggles",
        "Booking sites use CSS for date picker styling",
      ],
      "docker": [
        "Companies deploy entire applications as Docker containers for consistency across environments",
        "Development teams use Docker Compose to run multi-service environments locally",
        "CI/CD pipelines use Docker to build and test applications in isolated environments",
        "Microservices architectures use Docker to isolate each service",
        "Data science teams use Docker to share reproducible research environments",
        "Web applications use Docker to ensure development and production parity",
      ],
      "nutrition": [
        "Athletes track macronutrients to optimize performance and recovery",
        "Meal prep services balance protein, carbs, and fats for health goals",
        "Food labels help consumers make informed dietary choices",
        "Registered dietitians create personalized meal plans for medical conditions",
        "Fitness enthusiasts use protein shakes to meet daily protein requirements",
        "Diabetics monitor carbohydrate intake to manage blood sugar levels",
      ],
      "retirement": [
        "401(k) plans offer employer matching to grow retirement savings",
        "Compound interest allows investments to grow exponentially over time",
        "Roth IRAs provide tax-free growth for retirement withdrawals",
        "Social Security provides guaranteed income in retirement",
        "Pension plans offer fixed monthly payments after retirement",
        "Index funds provide diversified exposure to the stock market for long-term growth",
      ],
      "cybersecurity": [
        "Banks use encryption to protect customer financial data",
        "Two-factor authentication prevents unauthorized account access even if passwords are stolen",
        "Firewalls block malicious traffic from reaching corporate networks",
        "Regular software updates patch security vulnerabilities that hackers exploit",
        "Password managers generate and store complex passwords for all accounts",
        "VPNs encrypt internet traffic to protect data on public Wi-Fi networks",
      ],
    };

    const domainExamples = Object.entries(realisticExamples).find(([key]) => 
      subject.includes(key)
    );

    if (domainExamples) {
      const examples = domainExamples[1];
      const selectedExample = examples[Math.floor(Math.random() * examples.length)];
      const templates = [
        `For example, ${selectedExample}.`,
        `Consider: ${selectedExample}.`,
        `In practice, this looks like ${selectedExample}.`,
      ];
      return {
        text: templates[Math.floor(Math.random() * templates.length)],
        type: "real-world",
        context: fact.statement,
      };
    }

    // Fallback to generic real-world example
    const templates = [
      `For example, in everyday life, ${this.applyToRealWorld(fact.statement)}.`,
      `Consider a real scenario: ${this.applyToRealWorld(fact.statement)}.`,
      `In practice, this looks like: ${this.applyToRealWorld(fact.statement)}.`,
    ];

    return {
      text: templates[Math.floor(Math.random() * templates.length)],
      type: "real-world",
      context: fact.statement,
    };
  }

  /**
   * Generate an analogy
   */
  private generateAnalogy(
    fact: PluginFact,
    context: CompositionContext
  ): GeneratedExample | null {
    const subject = context.subject;
    const templates = [
      `Think of it like ${this.createAnalogy(fact.statement, subject)}.`,
      `It's similar to ${this.createAnalogy(fact.statement, subject)}.`,
      `You can compare this to ${this.createAnalogy(fact.statement, subject)}.`,
    ];

    return {
      text: templates[Math.floor(Math.random() * templates.length)],
      type: "analogy",
      context: fact.statement,
    };
  }

  /**
   * Generate a hypothetical example
   */
  private generateHypotheticalExample(
    fact: PluginFact,
    context: CompositionContext
  ): GeneratedExample | null {
    const templates = [
      `Imagine a situation where ${this.createHypothetical(fact.statement)}.`,
      `Picture this: ${this.createHypothetical(fact.statement)}.`,
      `Consider what happens if ${this.createHypothetical(fact.statement)}.`,
    ];

    return {
      text: templates[Math.floor(Math.random() * templates.length)],
      type: "hypothetical",
      context: fact.statement,
    };
  }

  /**
   * Generate a concrete example
   */
  private generateConcreteExample(
    fact: PluginFact,
    context: CompositionContext
  ): GeneratedExample | null {
    const templates = [
      `Specifically, this means ${this.makeConcrete(fact.statement)}.`,
      `To make this concrete: ${this.makeConcrete(fact.statement)}.`,
      `For instance: ${this.makeConcrete(fact.statement)}.`,
    ];

    return {
      text: templates[Math.floor(Math.random() * templates.length)],
      type: "concrete",
      context: fact.statement,
    };
  }

  /**
   * Apply a fact to a real-world scenario
   */
  private applyToRealWorld(statement: string): string {
    const lower = statement.toLowerCase();
    
    // Convert abstract concepts to concrete scenarios
    if (lower.includes("should") || lower.includes("must")) {
      return `when you follow this rule in your daily work, you'll see better results`;
    }
    
    if (lower.includes("improves") || lower.includes("increases")) {
      return `using this approach can help you achieve your goals more efficiently`;
    }
    
    if (lower.includes("prevents") || lower.includes("avoids")) {
      return `this helps you steer clear of common problems that many people encounter`;
    }

    return statement.toLowerCase();
  }

  /**
   * Create an analogy for a statement
   */
  private createAnalogy(statement: string, subject: string): string {
    const lower = statement.toLowerCase();

    // Domain-specific analogies
    if (lower.includes("build") || lower.includes("construct")) {
      return `building a house, where the foundation must be solid before adding walls`;
    }
    
    if (lower.includes("learn") || lower.includes("study")) {
      return `learning to ride a bike, where practice makes the skill automatic`;
    }
    
    if (lower.includes("invest") || lower.includes("save")) {
      return `planting a tree that grows over time, requiring patience and care`;
    }
    
    if (lower.includes("organize") || lower.includes("structure")) {
      return `organizing a closet, where everything has its designated place`;
    }

    // Generic analogy
    return `following a recipe, where each step builds on the previous one`;
  }

  /**
   * Create a hypothetical scenario
   */
  private createHypothetical(statement: string): string {
    const lower = statement.toLowerCase();
    
    if (lower.includes("should") || lower.includes("must")) {
      return `you don't follow this guideline and encounter the expected consequences`;
    }
    
    if (lower.includes("improves") || lower.includes("better")) {
      return `you apply this principle and notice measurable improvement`;
    }
    
    if (lower.includes("prevents") || lower.includes("avoids")) {
      return `you follow this advice and successfully sidestep a common pitfall`;
    }

    return `you put this into practice in a real situation`;
  }

  /**
   * Make a statement concrete
   */
  private makeConcrete(statement: string): string {
    const lower = statement.toLowerCase();
    
    // Add specific numbers or measurements where possible
    if (lower.includes("several") || lower.includes("many")) {
      return statement.replace(/several|many/gi, "3-5");
    }
    
    if (lower.includes("regularly") || lower.includes("frequently")) {
      return statement.replace(/regularly|frequently/gi, "2-3 times per week");
    }

    return statement.toLowerCase();
  }

  /**
   * Check if a statement is abstract
   */
  private isAbstract(statement: string): boolean {
    if (!statement) return false;
    const lower = statement.toLowerCase();
    const abstractIndicators = [
      "concept", "principle", "theory", "framework", "approach",
      "strategy", "methodology", "paradigm", "model", "system",
    ];

    return abstractIndicators.some(indicator => lower.includes(indicator));
  }
}
