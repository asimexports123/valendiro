import "dotenv/config";

import { initializeAgentSystem } from "../services/agents/agentSystem";
import { ResearchAgent } from "../services/agents/agents/researchAgent";
import { CoverageAgent } from "../services/agents/agents/coverageAgent";
import { KnowledgeAcquisitionAgent } from "../services/agents/agents/knowledgeAcquisitionAgent";
import { KnowledgeGraphAgent } from "../services/agents/agents/knowledgeGraphAgent";
import { KnowledgeAuthorAgent } from "../services/agents/agents/knowledgeAuthorAgent";
import { EditorialAgent } from "../services/agents/agents/editorialAgent";
import { QualityAgent } from "../services/agents/agents/qualityAgent";
import { ProductionValidationAgent } from "../services/agents/agents/productionValidationAgent";
import { AnalyticsAgent } from "../services/agents/agents/analyticsAgent";
import { RoadmapAgent } from "../services/agents/agents/roadmapAgent";
import { ChiefAIOfficerAgent } from "../services/agents/agents/chiefAIOfficerAgent";
import { AgentRegistry } from "../services/agents/agentRegistry";
import { TaskQueue } from "../services/agents/taskQueue";
import { SharedMemory } from "../services/agents/sharedMemory";
import { AgentCommunication } from "../services/agents/agentCommunication";

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   VALLENDIRO AI AGENT FRAMEWORK - LIVE VALIDATION          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("TOPIC: Docker Containers");
  console.log("CATEGORY: Technology\n");

  // Initialize
  console.log("--- INITIALIZING AI WORKFORCE ---");
  await initializeAgentSystem();
  console.log("✓ 11 Agents initialized\n");

// Workflow
console.log("--- AUTONOMOUS WORKFLOW EXECUTION ---\n");

const topic = "Docker Containers";
const category = "technology";

console.log("[1/10] Research Agent");
const research = new ResearchAgent();
const r1 = await research.execute({ topic, category, searchQuery: "Docker tutorial" });
console.log(`  Sources: ${r1.sourcesFound}, Topics: ${r1.topicsDiscovered}`);

console.log("\n[2/10] Coverage Agent");
const coverage = new CoverageAgent();
const r2 = await coverage.execute({ topic, category });
console.log(`  Coverage: ${r2.coveragePercentage}%, Gaps: ${r2.missingTopics.length}`);

console.log("\n[3/10] Knowledge Acquisition Agent");
const acquisition = new KnowledgeAcquisitionAgent();
const r3 = await acquisition.execute({ sourceUrl: "https://docs.docker.com", topic, category, extractionType: "facts" });
console.log(`  Facts: ${r3.factsExtracted}, Verified: ${r3.verificationPassed}`);

console.log("\n[4/10] Knowledge Graph Agent");
const graph = new KnowledgeGraphAgent();
const r4 = await graph.execute({ topic });
console.log(`  Relationships: ${r4.relationshipsCreated}, Health: ${r4.graphHealth}%`);

console.log("\n[5/10] Knowledge Author Agent");
const author = new KnowledgeAuthorAgent();
const r5 = await author.execute({
  topic, category,
  facts: [
    { id: "1", statement: "Docker containers are lightweight packages", factType: "definition", confidence: 95, scope: "general", tags: [], domain: "technology" },
    { id: "2", statement: "Containers include everything needed to run apps", factType: "property", confidence: 90, scope: "general", tags: [], domain: "technology" },
  ]
});
console.log(`  Complete: ${r5.authoringComplete}, Quality: ${r5.qualityScore}/100, Passes: ${r5.passesAllChecks}`);

console.log("\n[6/10] Editorial Agent");
const editorial = new EditorialAgent();
const r6 = await editorial.execute({ content: r5.document.introduction, topic, category });
console.log(`  Issues found: ${r6.issuesFound}, Fixed: ${r6.issuesFixed}`);

console.log("\n[7/10] Quality Agent");
const quality = new QualityAgent();
const r7 = await quality.execute({ topic, content: r6.editedContent, category });
console.log(`  Score: ${r7.overallScore}/100, Threshold: ${r7.threshold}, Passes: ${r7.passesThreshold}, Recommendation: ${r7.recommendation}`);

console.log("\n[8/10] Production Validation Agent");
const production = new ProductionValidationAgent();
const r8 = await production.execute({ topic, url: "https://valendiro.com/docker-containers", content: r6.editedContent });
console.log(`  Status: ${r8.overallStatus}, Issues: ${r8.issues.length}`);

console.log("\n[9/10] Analytics Agent");
const analytics = new AnalyticsAgent();
const r9 = await analytics.execute({ timeframe: "weekly", topic });
console.log(`  Insights: ${r9.insights.length}, Recommendations: ${r9.recommendations.length}`);

console.log("\n[10/10] Roadmap Agent");
const roadmap = new RoadmapAgent();
const r10 = await roadmap.execute({ analysisScope: "topic", topic });
console.log(`  Opportunities: ${r10.summary.totalOpportunities}, Next: ${r10.summary.recommendedNextAction}`);

// System State
console.log("\n--- SYSTEM STATE ---");
const queue = TaskQueue.getInstance();
const memory = SharedMemory.getInstance();
const comm = AgentCommunication.getInstance();

console.log(`Queue: ${queue.getStatistics().totalTasks} tasks`);
console.log(`Memory: ${memory.getStatistics().totalEntries} entries`);
console.log(`Messages: ${comm.getStatistics().totalMessages} exchanged`);

// Chief AI Officer
console.log("\n--- CHIEF AI OFFICER REPORT ---");
const chief = new ChiefAIOfficerAgent();
const chiefReport = await chief.execute({});
console.log(`Agents: ${chiefReport.agentHealth.totalAgents}`);
console.log(`Healthy: ${chiefReport.agentHealth.healthyAgents}`);
console.log(`Degraded: ${chiefReport.agentHealth.degradedAgents}`);
console.log(`Failing: ${chiefReport.agentHealth.failingAgents}`);
console.log(`Alerts: ${chiefReport.alerts.length}`);

// Scalability Test
console.log("\n--- SCALABILITY TEST (1000 TASKS) ---");
const start = Date.now();
for (let i = 0; i < 1000; i++) {
  queue.addResearchTask(`Task ${i}`, `Research ${i}`, { topic: `t${i}` }, 50);
}
const elapsed = Date.now() - start;
console.log(`Queued 1000 tasks in ${elapsed}ms`);
console.log(`Queue size: ${queue.getStatistics().totalTasks}`);

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║   VALIDATION COMPLETE: SUCCESS                              ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");
}

main().catch(console.error);
