/**
 * Production Validation - Python Programming Fundamentals
 * 
 * Real execution test of Knowledge Authoring Engine
 * No simulations, no mocks - actual measured performance
 */

import { KnowledgeAuthoringOrchestrator } from "../services/renderer/authoring/knowledgeAuthoringOrchestrator";

interface Timings {
  stage: string;
  startTime: number;
  endTime: number;
  duration: number;
}

interface ValidationResult {
  topic: string;
  category: string;
  coldStart: number;
  executionTime: number;
  totalMemory: number;
  stages: Timings[];
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private timings: Timings[] = [];
  private startMemory: number = 0;

  startMonitoring() {
    this.startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  }

  startStage(stageName: string): number {
    const timing: Timings = {
      stage: stageName,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
    };
    this.timings.push(timing);
    return timing.startTime;
  }

  endStage(stageName: string): number {
    const timing = this.timings.find(t => t.stage === stageName);
    if (timing) {
      timing.endTime = performance.now();
      timing.duration = timing.endTime - timing.startTime;
      return timing.duration;
    }
    return 0;
  }

  getMemoryUsage(): number {
    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    return currentMemory - this.startMemory;
  }

  getTimings(): Timings[] {
    return this.timings;
  }
}

async function runProductionValidation(): Promise<ValidationResult> {
  const monitor = new PerformanceMonitor();
  monitor.startMonitoring();

  console.log("=== PRODUCTION VALIDATION ===");
  console.log("Topic: Python Programming Fundamentals");
  console.log("Category: Education");
  console.log("");

  // Measure cold start
  const coldStartTime = performance.now();
  monitor.startStage("cold-start");

  try {
    // Instantiate orchestrator (this should now be fast with lazy loading)
    const orchestrator = new KnowledgeAuthoringOrchestrator();
    
    const coldEndTime = performance.now();
    monitor.endStage("cold-start");
    const coldStartDuration = coldEndTime - coldStartTime;

    console.log(`Cold Start: ${coldStartDuration.toFixed(2)}ms`);
    console.log(`Target: < 3000ms`);
    console.log(`Status: ${coldStartDuration < 3000 ? "✓ PASS" : "✗ FAIL"}`);
    console.log("");

    // Prepare authoring context
    monitor.startStage("prepare-context");
    
    const context = {
      topic: "Python Programming Fundamentals",
      category: "education" as const,
      intent: "educate" as const,
      complexity: "beginner" as const,
      facts: [
        {
          id: "fact-1",
          statement: "Python is a high-level, interpreted programming language known for its readability and simplicity.",
          factType: "definition",
          confidence: 0.95,
          scope: "general",
          tags: ["python", "definition"],
          domain: "technology",
        },
        {
          id: "fact-2",
          statement: "Python was created by Guido van Rossum and first released in 1991.",
          factType: "historical",
          confidence: 0.98,
          scope: "general",
          tags: ["python", "history"],
          domain: "technology",
        },
        {
          id: "fact-3",
          statement: "Python uses indentation to define code blocks instead of curly braces.",
          factType: "procedural",
          confidence: 0.99,
          scope: "general",
          tags: ["python", "syntax"],
          domain: "technology",
        },
        {
          id: "fact-4",
          statement: "Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
          factType: "property",
          confidence: 0.95,
          scope: "general",
          tags: ["python", "paradigms"],
          domain: "technology",
        },
        {
          id: "fact-5",
          statement: "Python has a large standard library and extensive third-party package ecosystem (PyPI).",
          factType: "property",
          confidence: 0.97,
          scope: "general",
          tags: ["python", "ecosystem"],
          domain: "technology",
        },
      ],
    };

    monitor.endStage("prepare-context");

    // Execute authoring
    monitor.startStage("author-document");
    
    const result = await orchestrator.authorDocument(context);
    
    const executionEndTime = performance.now();
    monitor.endStage("author-document");
    const executionDuration = executionEndTime - coldStartTime;

    console.log(`Execution Time: ${executionDuration.toFixed(2)}ms`);
    console.log(`Target: < 5000ms`);
    console.log(`Status: ${executionDuration < 5000 ? "✓ PASS" : "✗ FAIL"}`);
    console.log("");

    // Memory usage
    const memoryUsage = monitor.getMemoryUsage();
    console.log(`Memory Usage: ${memoryUsage.toFixed(2)}MB`);
    console.log("");

    // Stage timings
    console.log("=== STAGE TIMINGS ===");
    for (const timing of monitor.getTimings()) {
      if (timing.stage !== "cold-start" && timing.stage !== "prepare-context") {
        console.log(`${timing.stage}: ${timing.duration.toFixed(2)}ms`);
      }
    }
    console.log("");

    // Results
    console.log("=== RESULTS ===");
    console.log(`Authoring Complete: ${result.passesAllChecks ? "✓" : "✗"}`);
    console.log(`Quality Score: ${result.editorialResult.qualityScore}/100`);
    console.log(`Recommendation: ${result.acceptanceTest.recommendation}`);
    console.log(`Sections: ${result.document.sections.length}`);
    console.log("");

    console.log("=== GENERATED CONTENT ===");
    console.log(`Introduction: ${result.document.introduction.substring(0, 200)}...`);
    console.log(`Sections: ${result.document.sections.map(s => s.heading).join(", ")}`);
    console.log(`Conclusion: ${result.document.conclusion.substring(0, 200)}...`);
    console.log("");

    return {
      topic: context.topic,
      category: context.category,
      coldStart: coldStartDuration,
      executionTime: executionDuration,
      totalMemory: memoryUsage,
      stages: monitor.getTimings(),
      success: result.passesAllChecks,
    };

  } catch (error) {
    const errorTime = performance.now();
    monitor.endStage("cold-start");
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    console.error(error);

    return {
      topic: "Python Programming Fundamentals",
      category: "education",
      coldStart: errorTime - coldStartTime,
      executionTime: 0,
      totalMemory: monitor.getMemoryUsage(),
      stages: monitor.getTimings(),
      success: false,
      error: errorMessage,
    };
  }
}

// Run validation
async function main() {
  console.log("Starting production validation...");
  console.log("");
  
  const result = await runProductionValidation();
  
  console.log("");
  console.log("=== VALIDATION SUMMARY ===");
  console.log(`Cold Start: ${result.coldStart.toFixed(2)}ms ${result.coldStart < 3000 ? "✓" : "✗"}`);
  console.log(`Execution: ${result.executionTime.toFixed(2)}ms ${result.executionTime < 5000 ? "✓" : "✗"}`);
  console.log(`Memory: ${result.totalMemory.toFixed(2)}MB`);
  console.log(`Success: ${result.success ? "✓" : "✗"}`);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
    process.exit(1);
  }
  
  process.exit(result.success ? 0 : 1);
}

main();
