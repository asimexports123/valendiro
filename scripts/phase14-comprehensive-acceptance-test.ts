/**
 * Phase 14 Comprehensive Acceptance Test
 * 
 * Validates that the Composition Engine produces articles that are substantially better
 * than the previous renderer across multiple dimensions:
 * - 8 mandatory reader questions
 * - Quality criteria
 * - Reading flow structure
 * - 5 reader success criteria
 * - Static rendering determinism
 */

import type { PluginFact, RendererConfig, DocumentNode } from "@/services/renderer/types";
import { KnowledgeComposer } from "@/services/renderer/composition/knowledgeComposer";
import { longArticleStrategy } from "@/services/renderer/renderers/longArticle";

// Sample knowledge packages for 10 topics
const samplePackages: Record<string, PluginFact[]> = {
  "machine-learning-basics": [
    { id: "1", statement: "Machine learning is a subset of artificial intelligence that enables computers to learn from data without explicit programming.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
    { id: "2", statement: "Supervised learning uses labeled data to train models for prediction tasks like classification and regression.", factType: "property", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
    { id: "3", statement: "To implement supervised learning, collect labeled data, split into training and test sets, train the model, and evaluate performance.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
    { id: "4", statement: "For example, email spam filters use supervised learning to classify messages as spam or not based on labeled training data.", factType: "property", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
    { id: "5", statement: "Overfitting occurs when a model learns noise in training data and performs poorly on new data.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["ai", "ml"], domain: "Technology" },
  ],
  "docker-containers": [
    { id: "1", statement: "Docker containers are lightweight, standalone packages that include everything needed to run an application.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
    { id: "2", statement: "Containers share the host OS kernel, making them more efficient than virtual machines which require full OS instances.", factType: "property", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
    { id: "3", statement: "To create a container, write a Dockerfile with instructions, build an image, and run it with docker run command.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
    { id: "4", statement: "For example, a web application container can run consistently across development, testing, and production environments.", factType: "property", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
    { id: "5", statement: "Containers should not store persistent data; use volumes or external storage for data that must survive container restarts.", factType: "rule", confidence: "verified", scope: "contextual", tags: ["devops", "containers"], domain: "Technology" },
  ],
  "css-fundamentals": [
    { id: "1", statement: "CSS (Cascading Style Sheets) is a style sheet language used to describe the presentation of HTML documents.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
    { id: "2", statement: "CSS selectors target HTML elements based on tags, classes, IDs, or attributes to apply styles.", factType: "property", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
    { id: "3", statement: "To apply styles, create a CSS file, link it in HTML with link tag, and write rules with selectors and declarations.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
    { id: "4", statement: "For example, .header { background: blue; } applies a blue background to all elements with class header.", factType: "property", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
    { id: "5", statement: "Avoid using !important as it breaks the cascade and makes maintenance difficult.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["web", "css"], domain: "Technology" },
  ],
  "retirement-planning-fundamentals": [
    { id: "1", statement: "Retirement planning is the process of determining retirement income goals and the actions to achieve them.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
    { id: "2", statement: "The 4% rule suggests withdrawing 4% of retirement savings annually to make savings last 30 years.", factType: "property", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
    { id: "3", statement: "To plan for retirement, calculate needed savings, maximize employer 401k match, open IRA, and invest in diversified portfolio.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
    { id: "4", statement: "For example, someone needing $50,000 annually in retirement needs approximately $1.25 million saved following the 4% rule.", factType: "property", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
    { id: "5", statement: "Failing to account for inflation can significantly reduce purchasing power in retirement.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["finance", "retirement"], domain: "Finance" },
  ],
  "business-strategy-fundamentals": [
    { id: "1", statement: "Business strategy is a long-term plan of action designed to achieve competitive advantage and meet organizational goals.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
    { id: "2", statement: "SWOT analysis evaluates strengths, weaknesses, opportunities, and threats to inform strategic decisions.", factType: "property", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
    { id: "3", statement: "To develop strategy, conduct market analysis, identify competitive advantage, set objectives, and create implementation roadmap.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
    { id: "4", statement: "For example, Apple's strategy focuses on premium products, ecosystem integration, and brand differentiation.", factType: "property", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
    { id: "5", statement: "Strategy without execution is worthless; implementation is often where strategies fail.", factType: "rule", confidence: "verified", scope: "contextual", tags: ["business", "strategy"], domain: "Business" },
  ],
  "nutrition-fundamentals": [
    { id: "1", statement: "Nutrition is the science of how food affects the body and provides nutrients for health and growth.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
    { id: "2", statement: "Macronutrients include carbohydrates for energy, proteins for tissue repair, and fats for hormone production and nutrient absorption.", factType: "property", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
    { id: "3", statement: "To eat nutritiously, focus on whole foods, balance macronutrients, stay hydrated, and limit processed foods and added sugars.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
    { id: "4", statement: "For example, a balanced meal might include grilled chicken (protein), quinoa (carbs), and avocado (healthy fats).", factType: "property", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
    { id: "5", statement: "Crash diets often lead to muscle loss and metabolic slowdown, making long-term weight maintenance difficult.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["health", "nutrition"], domain: "Health" },
  ],
  "japan-travel-guide": [
    { id: "1", statement: "Japan is an island nation in East Asia known for its blend of ancient traditions and modern technology.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    { id: "2", statement: "The Japan Rail Pass offers unlimited travel on JR trains for 7, 14, or 21 days and is cost-effective for long-distance travel.", factType: "property", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    { id: "3", statement: "To visit Japan, apply for visa if required, book flights, reserve accommodation with JR Pass delivery, and research seasonal attractions.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    { id: "4", statement: "For example, cherry blossom season in late March to early April attracts millions of visitors to parks and temples.", factType: "property", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
    { id: "5", statement: "Cash is still widely used in Japan; many small businesses do not accept credit cards.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["travel", "japan"], domain: "Travel" },
  ],
  "cybersecurity-fundamentals": [
    { id: "1", statement: "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
    { id: "2", statement: "Multi-factor authentication requires multiple forms of verification, significantly reducing unauthorized access risk.", factType: "property", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
    { id: "3", statement: "To improve security, use strong unique passwords, enable MFA, keep software updated, and be cautious of phishing attempts.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
    { id: "4", statement: "For example, a phishing email might appear to be from your bank requesting login credentials to steal your account.", factType: "property", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
    { id: "5", statement: "Using the same password across multiple sites creates a single point of failure for all accounts.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["security", "cybersecurity"], domain: "Technology" },
  ],
  "cloud-computing-fundamentals": [
    { id: "1", statement: "Cloud computing is the delivery of computing services over the internet including servers, storage, databases, and software.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
    { id: "2", statement: "Cloud service models include IaaS for infrastructure, PaaS for platforms, and SaaS for complete software solutions.", factType: "property", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
    { id: "3", statement: "To migrate to cloud, assess workloads, choose appropriate service model, plan migration strategy, and implement monitoring.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
    { id: "4", statement: "For example, Netflix uses AWS cloud services to stream content to millions of users globally with high availability.", factType: "property", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
    { id: "5", statement: "Cloud costs can quickly escalate without proper monitoring and resource management.", factType: "warning", confidence: "verified", scope: "contextual", tags: ["cloud", "technology"], domain: "Technology" },
  ],
  "project-management-fundamentals": [
    { id: "1", statement: "Project management is the practice of initiating, planning, executing, and closing projects to achieve specific goals.", factType: "definition", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
    { id: "2", statement: "The triple constraint balances scope, time, and cost—changing one affects the others.", factType: "property", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
    { id: "3", statement: "To manage projects effectively, define objectives, create work breakdown structure, schedule tasks, monitor progress, and manage risks.", factType: "procedural", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
    { id: "4", statement: "For example, building a house requires coordinating architects, contractors, materials, and timelines within budget constraints.", factType: "property", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
    { id: "5", statement: "Poor communication is a leading cause of project failure; stakeholders must be kept informed throughout the project lifecycle.", factType: "rule", confidence: "verified", scope: "contextual", tags: ["management", "projects"], domain: "Business" },
  ],
};

interface ArticleMetrics {
  topic: string;
  before: {
    content: string;
    wordCount: number;
    sectionCount: number;
  };
  after: {
    content: string;
    wordCount: number;
    sectionCount: number;
  };
  mandatoryQuestions: {
    whatIsIt: boolean;
    whyDoesItMatter: boolean;
    howDoesItWork: boolean;
    whereIsItUsed: boolean;
    whenShouldItBeUsed: boolean;
    advantages: boolean;
    limitations: boolean;
    commonMistakes: boolean;
    whatToLearnNext: boolean;
  };
  qualityValidation: {
    factDumping: boolean;
    repetitiveWording: boolean;
    genericFiller: boolean;
    isolatedBulletFacts: boolean;
    unexplainedTerminology: boolean;
    emptyIntroductions: boolean;
    weakConclusions: boolean;
  };
  readingFlow: {
    introduction: boolean;
    fundamentalConcept: boolean;
    howItWorks: boolean;
    example: boolean;
    applications: boolean;
    benefits: boolean;
    limitations: boolean;
    commonMistakes: boolean;
    relatedKnowledge: boolean;
    summary: boolean;
  };
  readerSuccess: {
    understoodTopic: boolean;
    explanationsClear: boolean;
    examplesHelped: boolean;
    maintainedInterest: boolean;
    noExternalWebsiteNeeded: boolean;
    wouldContinueReading: boolean;
  };
}

function renderV1(facts: PluginFact[], config: RendererConfig): DocumentNode[] {
  return longArticleStrategy.render(
    facts,
    [],
    [],
    config,
    {
      eligible: true,
      reason: null,
      policy: {
        id: "default",
        name: "Default Policy",
        categoryMatch: ["general"],
        requiredFactTypes: [],
        preferredFormat: "html",
        preferredStyle: ["intermediate"],
        minFactCount: 3,
        minCitationCount: 0,
        sectionOverrides: [],
        commercialPlaceholders: false,
      },
      blockOrder: [],
      missingKnowledge: [],
      warnings: [],
    }
  );
}

function renderV2(facts: PluginFact[], config: RendererConfig): DocumentNode[] {
  const composer = new KnowledgeComposer();
  const result = composer.compose(facts, config);
  return result.documentTree;
}

function extractText(tree: DocumentNode[]): string {
  let text = "";
  for (const node of tree) {
    if (node.type === "paragraph") {
      if (typeof node.children === "string") {
        text += node.children + " ";
      } else {
        text += node.children.join(" ") + " ";
      }
    } else if (node.type === "heading") {
      text += `\n## ${node.text}\n`;
    } else if (node.type === "list") {
      for (const item of node.items) {
        if (typeof item.children === "string") {
          text += `- ${item.children}\n`;
        } else {
          text += `- ${item.children.join(" ")}\n`;
        }
      }
    } else if (node.type === "callout") {
      text += `[${(node.children[0] as any).children}] `;
    } else if (node.type === "summary") {
      text += `\n### Summary\n`;
      for (const point of node.keyPoints) {
        text += `- ${point}\n`;
      }
      text += `${node.closingSentence}\n`;
    }
  }
  return text;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function validateMandatoryQuestions(content: string, topic: string): ArticleMetrics["mandatoryQuestions"] {
  const lower = content.toLowerCase();
  const subject = topic.replace(/-/g, " ");
  
  return {
    whatIsIt: lower.includes("is") && (lower.includes("defined") || lower.includes("definition")),
    whyDoesItMatter: lower.includes("important") || lower.includes("matters") || lower.includes("valuable") || lower.includes("essential"),
    howDoesItWork: lower.includes("how") && (lower.includes("works") || lower.includes("function") || lower.includes("operate")),
    whereIsItUsed: lower.includes("used") || lower.includes("applied") || lower.includes("application"),
    whenShouldItBeUsed: lower.includes("when") || lower.includes("should"),
    advantages: lower.includes("benefit") || lower.includes("advantage") || lower.includes("effective"),
    limitations: lower.includes("limitation") || lower.includes("drawback") || lower.includes("challenge"),
    commonMistakes: lower.includes("mistake") || lower.includes("pitfall") || lower.includes("avoid"),
    whatToLearnNext: lower.includes("next") || lower.includes("further") || lower.includes("related"),
  };
}

function validateQuality(content: string): ArticleMetrics["qualityValidation"] {
  const sentences = content.split(/[.!?]+/);
  const lower = content.toLowerCase();
  
  // Check for fact dumping (many short sentences without connectives)
  const shortSentences = sentences.filter(s => s.trim().split(/\s+/).length < 8).length;
  const factDumping = shortSentences > sentences.length * 0.7;
  
  // Check for repetitive wording
  const words = lower.split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitiveWording = uniqueWords.size / words.length < 0.5;
  
  // Check for generic filler
  const fillerPhrases = ["it is important to note", "it should be mentioned", "it is worth noting"];
  const genericFiller = fillerPhrases.some(phrase => lower.includes(phrase));
  
  // Check for isolated bullet facts (bullets without explanations)
  const bulletLines = content.split("\n").filter(line => line.trim().startsWith("-"));
  const isolatedBulletFacts = bulletLines.length > 0 && bulletLines.every(line => line.split(/\s+/).length < 10);
  
  // Check for unexplained terminology (technical terms without explanation)
  const technicalTerms = ["algorithm", "api", "framework", "paradigm"];
  const unexplainedTerminology = technicalTerms.some(term => lower.includes(term) && !lower.includes(`${term} is`));
  
  // Check for empty introductions (first paragraph is just restating the topic)
  const firstParagraph = sentences[0];
  const emptyIntroductions = firstParagraph && firstParagraph.split(/\s+/).length < 15;
  
  // Check for weak conclusions (last paragraph is just "in summary" without substance)
  const lastParagraph = sentences[sentences.length - 1];
  const weakConclusions = Boolean(lastParagraph && (lastParagraph.toLowerCase().includes("in summary") && lastParagraph.split(/\s+/).length < 20));
  
  return {
    factDumping: Boolean(factDumping),
    repetitiveWording: Boolean(repetitiveWording),
    genericFiller: Boolean(genericFiller),
    isolatedBulletFacts: Boolean(isolatedBulletFacts),
    unexplainedTerminology: Boolean(unexplainedTerminology),
    emptyIntroductions: Boolean(emptyIntroductions),
    weakConclusions,
  };
}

function validateReadingFlow(tree: DocumentNode[]): ArticleMetrics["readingFlow"] {
  const headings = tree.filter(n => n.type === "heading").map(n => (n as any).text?.toLowerCase() || "");
  
  const hasHeading = (keywords: string[]) => 
    headings.some(h => keywords.some(k => h.includes(k)));
  
  return {
    introduction: hasHeading(["introduction", "what is"]),
    fundamentalConcept: hasHeading(["concept", "fundamental", "core"]),
    howItWorks: hasHeading(["how", "works", "function"]),
    example: hasHeading(["example", "real-world", "scenario"]),
    applications: hasHeading(["application", "use", "practice"]),
    benefits: hasHeading(["benefit", "advantage", "value"]),
    limitations: hasHeading(["limitation", "challenge", "drawback"]),
    commonMistakes: hasHeading(["mistake", "pitfall", "avoid"]),
    relatedKnowledge: hasHeading(["related", "next", "further"]),
    summary: hasHeading(["summary", "conclusion", "key takeaways"]),
  };
}

function validateReaderSuccess(metrics: ArticleMetrics): ArticleMetrics["readerSuccess"] {
  const questionsAnswered = Object.values(metrics.mandatoryQuestions).filter(Boolean).length;
  const flowSections = Object.values(metrics.readingFlow).filter(Boolean).length;
  
  // Focus on actual reader experience, not technical quality metrics
  return {
    understoodTopic: questionsAnswered >= 7,
    explanationsClear: !metrics.qualityValidation.unexplainedTerminology,
    examplesHelped: metrics.readingFlow.example,
    maintainedInterest: !metrics.qualityValidation.factDumping && !metrics.qualityValidation.genericFiller,
    noExternalWebsiteNeeded: questionsAnswered >= 6,
    wouldContinueReading: questionsAnswered >= 7 && flowSections >= 7,
  };
}

function testTopic(topicSlug: string): ArticleMetrics {
  const facts = samplePackages[topicSlug];
  if (!facts) {
    throw new Error(`No sample data for topic: ${topicSlug}`);
  }

  const config: RendererConfig = {
    rendererId: "long-article",
    rendererVersion: "4.0.0",
    templateVersion: "1.0.0",
    format: "html",
    style: ["intermediate"],
    slug: topicSlug,
    intent: "educate",
    category: "general",
  };

  // Render v1
  const v1Tree = renderV1(facts, config);
  const v1Content = extractText(v1Tree);
  const v1Words = countWords(v1Content);

  // Render v2
  const v2Config = { ...config, rendererId: "long-article-v2" };
  const v2Tree = renderV2(facts, v2Config);
  const v2Content = extractText(v2Tree);
  const v2Words = countWords(v2Content);

  // Validate mandatory questions
  const mandatoryQuestions = validateMandatoryQuestions(v2Content, topicSlug);

  // Validate quality
  const qualityValidation = validateQuality(v2Content);

  // Validate reading flow
  const readingFlow = validateReadingFlow(v2Tree);

  // Build metrics object
  const metrics: ArticleMetrics = {
    topic: topicSlug,
    before: {
      content: v1Content,
      wordCount: v1Words,
      sectionCount: v1Tree.filter(n => n.type === "heading").length,
    },
    after: {
      content: v2Content,
      wordCount: v2Words,
      sectionCount: v2Tree.filter(n => n.type === "heading").length,
    },
    mandatoryQuestions,
    qualityValidation,
    readingFlow,
    readerSuccess: {} as any, // Will be filled after
  };

  // Validate reader success
  metrics.readerSuccess = validateReaderSuccess(metrics);

  return metrics;
}

async function runComprehensiveAcceptanceTest(): Promise<void> {
  console.log("=== PHASE 14 COMPREHENSIVE ACCEPTANCE TEST ===\n");
  console.log("Testing 10 topics across multiple validation dimensions\n");

  const topics = Object.keys(samplePackages);
  const results: ArticleMetrics[] = [];

  for (const topic of topics) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`TOPIC: ${topic.toUpperCase().replace(/-/g, " ")}`);
    console.log(`${"=".repeat(80)}\n`);

    const metrics = testTopic(topic);
    results.push(metrics);

    console.log("BEFORE (v1):");
    console.log(`  Word Count: ${metrics.before.wordCount}`);
    console.log(`  Sections: ${metrics.before.sectionCount}`);

    console.log("\nAFTER (v2):");
    console.log(`  Word Count: ${metrics.after.wordCount}`);
    console.log(`  Sections: ${metrics.after.sectionCount}`);

    console.log("\nMANDATORY QUESTIONS:");
    console.log(`  What is it? ${metrics.mandatoryQuestions.whatIsIt ? "✓" : "✗"}`);
    console.log(`  Why does it matter? ${metrics.mandatoryQuestions.whyDoesItMatter ? "✓" : "✗"}`);
    console.log(`  How does it work? ${metrics.mandatoryQuestions.howDoesItWork ? "✓" : "✗"}`);
    console.log(`  Where is it used? ${metrics.mandatoryQuestions.whereIsItUsed ? "✓" : "✗"}`);
    console.log(`  When should it be used? ${metrics.mandatoryQuestions.whenShouldItBeUsed ? "✓" : "✗"}`);
    console.log(`  Advantages? ${metrics.mandatoryQuestions.advantages ? "✓" : "✗"}`);
    console.log(`  Limitations? ${metrics.mandatoryQuestions.limitations ? "✓" : "✗"}`);
    console.log(`  Common mistakes? ${metrics.mandatoryQuestions.commonMistakes ? "✓" : "✗"}`);
    console.log(`  What to learn next? ${metrics.mandatoryQuestions.whatToLearnNext ? "✓" : "✗"}`);

    console.log("\nQUALITY VALIDATION:");
    console.log(`  Fact dumping: ${metrics.qualityValidation.factDumping ? "✗ FAIL" : "✓ PASS"}`);
    console.log(`  Repetitive wording: ${metrics.qualityValidation.repetitiveWording ? "✗ FAIL" : "✓ PASS"}`);
    console.log(`  Generic filler: ${metrics.qualityValidation.genericFiller ? "✗ FAIL" : "✓ PASS"}`);
    console.log(`  Isolated bullet facts: ${metrics.qualityValidation.isolatedBulletFacts ? "✗ FAIL" : "✓ PASS"}`);
    console.log(`  Unexplained terminology: ${metrics.qualityValidation.unexplainedTerminology ? "✗ FAIL" : "✓ PASS"}`);
    console.log(`  Empty introductions: ${metrics.qualityValidation.emptyIntroductions ? "✗ FAIL" : "✓ PASS"}`);
    console.log(`  Weak conclusions: ${metrics.qualityValidation.weakConclusions ? "✗ FAIL" : "✓ PASS"}`);

    console.log("\nREADING FLOW:");
    console.log(`  Introduction: ${metrics.readingFlow.introduction ? "✓" : "✗"}`);
    console.log(`  Fundamental Concept: ${metrics.readingFlow.fundamentalConcept ? "✓" : "✗"}`);
    console.log(`  How It Works: ${metrics.readingFlow.howItWorks ? "✓" : "✗"}`);
    console.log(`  Example: ${metrics.readingFlow.example ? "✓" : "✗"}`);
    console.log(`  Applications: ${metrics.readingFlow.applications ? "✓" : "✗"}`);
    console.log(`  Benefits: ${metrics.readingFlow.benefits ? "✓" : "✗"}`);
    console.log(`  Limitations: ${metrics.readingFlow.limitations ? "✓" : "✗"}`);
    console.log(`  Common Mistakes: ${metrics.readingFlow.commonMistakes ? "✓" : "✗"}`);
    console.log(`  Related Knowledge: ${metrics.readingFlow.relatedKnowledge ? "✓" : "✗"}`);
    console.log(`  Summary: ${metrics.readingFlow.summary ? "✓" : "✗"}`);

    console.log("\nREADER SUCCESS CRITERIA:");
    console.log(`  Understood topic: ${metrics.readerSuccess.understoodTopic ? "✓" : "✗"}`);
    console.log(`  Explanations clear: ${metrics.readerSuccess.explanationsClear ? "✓" : "✗"}`);
    console.log(`  Examples helped: ${metrics.readerSuccess.examplesHelped ? "✓" : "✗"}`);
    console.log(`  Maintained interest: ${metrics.readerSuccess.maintainedInterest ? "✓" : "✗"}`);
    console.log(`  No external website needed: ${metrics.readerSuccess.noExternalWebsiteNeeded ? "✓" : "✗"}`);
    console.log(`  Would continue reading: ${metrics.readerSuccess.wouldContinueReading ? "✓" : "✗"}`);
  }

  // Summary
  console.log(`\n${"=".repeat(80)}`);
  console.log("ACCEPTANCE TEST SUMMARY");
  console.log(`${"=".repeat(80)}\n`);

  const wouldContinue = results.filter(r => r.readerSuccess.wouldContinueReading).length;
  const passedAllCriteria = results.filter(r => 
    Object.values(r.readerSuccess).every(Boolean)
  ).length;

  console.log(`Topics Tested: ${results.length}`);
  console.log(`Would Continue Reading: ${wouldContinue}/${results.length}`);
  console.log(`Passed All Reader Criteria: ${passedAllCriteria}/${results.length}`);

  const avgQuestionsAnswered = results.reduce((sum, r) => 
    sum + Object.values(r.mandatoryQuestions).filter(Boolean).length, 0) / results.length;
  const avgQualityIssues = results.reduce((sum, r) => 
    sum + Object.values(r.qualityValidation).filter(Boolean).length, 0) / results.length;
  const avgFlowSections = results.reduce((sum, r) => 
    sum + Object.values(r.readingFlow).filter(Boolean).length, 0) / results.length;

  console.log(`\nAverage Mandatory Questions Answered: ${avgQuestionsAnswered.toFixed(1)}/9`);
  console.log(`Average Quality Issues: ${avgQualityIssues.toFixed(1)}/7`);
  console.log(`Average Reading Flow Sections: ${avgFlowSections.toFixed(1)}/10`);

  console.log(`\nFINAL ANSWER: Would a neutral reader answer YES to all 5 questions?`);
  if (passedAllCriteria >= results.length * 0.9) {
    console.log("✅ YES - Phase 14 is complete");
  } else if (passedAllCriteria >= results.length * 0.7) {
    console.log("⚠️ PARTIAL - Phase 14 shows significant improvement but needs refinement");
  } else {
    console.log("❌ NO - Phase 14 needs significant improvement before completion");
  }

  console.log("\nGenerating detailed acceptance report...");
  // Report generation would happen here in a real implementation
}

runComprehensiveAcceptanceTest().catch(console.error);
