/**
 * Phase 19 - Create semantic knowledge relationships
 * 
 * This script maps logical relationships between the 47 published topics
 * to create a connected learning graph.
 */

const fs = require("fs");

const topics = JSON.parse(fs.readFileSync("phase19-published-topics.json", "utf-8"));

// Create a lookup map
const topicMap = new Map();
for (const topic of topics) {
  topicMap.set(topic.slug, topic.id);
}

// Define semantic relationships
const relationships = [];

// Helper function to add relationships
function addRelationship(sourceSlug, targetSlug, type) {
  const sourceId = topicMap.get(sourceSlug);
  const targetId = topicMap.get(targetSlug);
  
  if (!sourceId || !targetId) {
    console.warn(`Missing topic ID for ${sourceSlug} or ${targetSlug}`);
    return;
  }
  
  relationships.push({
    source_id: sourceId,
    target_id: targetId,
    relationship_type: type,
  });
}

// PROGRAMMING SUBCATEGORY - Core learning path
addRelationship("html-fundamentals", "css-fundamentals", "next_topic");
addRelationship("css-fundamentals", "javascript-fundamentals", "next_topic");
addRelationship("javascript-fundamentals", "typescript-language", "next_topic");
addRelationship("typescript-language", "react-library", "next_topic");
addRelationship("react-library", "nextjs-framework", "next_topic");

// Programming prerequisites
addRelationship("javascript-fundamentals", "html-fundamentals", "prerequisite");
addRelationship("javascript-fundamentals", "css-fundamentals", "prerequisite");
addRelationship("typescript-language", "javascript-fundamentals", "prerequisite");
addRelationship("react-library", "javascript-fundamentals", "prerequisite");
addRelationship("react-library", "typescript-language", "prerequisite");
addRelationship("nextjs-framework", "react-library", "prerequisite");

// Programming related topics
addRelationship("python-programming-fundamentals", "javascript-fundamentals", "related_topic");
addRelationship("python-programming-fundamentals", "typescript-language", "related_topic");
addRelationship("python-programming-fundamentals", "rust-programming-language", "related_topic");
addRelationship("rust-programming-language", "go-programming-language", "related_topic");
addRelationship("sql-fundamentals", "python-programming-fundamentals", "related_topic");
addRelationship("sql-fundamentals", "javascript-fundamentals", "related_topic");

// Programming applications
addRelationship("python-programming-fundamentals", "machine-learning-basics", "application");
addRelationship("python-programming-fundamentals", "pandas-data-analysis", "application");
addRelationship("python-programming-fundamentals", "data-structures", "application");
addRelationship("javascript-fundamentals", "react-library", "application");
addRelationship("javascript-fundamentals", "nextjs-framework", "application");
addRelationship("typescript-language", "react-library", "application");

// Programming broader/narrower
addRelationship("programming", "python-programming-fundamentals", "broader_topic");
addRelationship("programming", "javascript-fundamentals", "broader_topic");
addRelationship("python-programming-fundamentals", "programming", "narrower_topic");

// DATA SCIENCE SUBCATEGORY - Learning path
addRelationship("statistics-fundamentals", "machine-learning-fundamentals", "next_topic");
addRelationship("machine-learning-fundamentals", "neural-networks", "next_topic");
addRelationship("machine-learning-fundamentals", "pandas-data-analysis", "next_topic");
addRelationship("pandas-data-analysis", "data-visualization", "next_topic");

// Data science prerequisites
addRelationship("machine-learning-fundamentals", "python-programming-fundamentals", "prerequisite");
addRelationship("machine-learning-fundamentals", "statistics-fundamentals", "prerequisite");
addRelationship("neural-networks", "machine-learning-fundamentals", "prerequisite");
addRelationship("pandas-data-analysis", "python-programming-fundamentals", "prerequisite");
addRelationship("pandas-data-analysis", "statistics-fundamentals", "prerequisite");
addRelationship("data-visualization", "pandas-data-analysis", "prerequisite");
addRelationship("data-visualization", "statistics-fundamentals", "prerequisite");

// Data science related topics
addRelationship("machine-learning-fundamentals", "machine-learning-basics", "related_topic");
addRelationship("neural-networks", "machine-learning-basics", "related_topic");
addRelationship("data-visualization", "machine-learning-fundamentals", "related_topic");
addRelationship("data-visualization", "statistics-fundamentals", "related_topic");

// Data science applications
addRelationship("statistics-fundamentals", "pandas-data-analysis", "application");
addRelationship("statistics-fundamentals", "data-visualization", "application");
addRelationship("machine-learning-fundamentals", "neural-networks", "application");
addRelationship("neural-networks", "machine-learning-basics", "application");

// WEB DEVELOPMENT SUBCATEGORY - Learning path
addRelationship("html-fundamentals", "css-fundamentals", "next_topic");
addRelationship("css-fundamentals", "javascript-fundamentals", "next_topic");
addRelationship("javascript-fundamentals", "restful-apis", "next_topic");
addRelationship("restful-apis", "docker-containers", "next_topic");
addRelationship("docker-containers", "cloud-computing-fundamentals", "next_topic");

// Web dev prerequisites
addRelationship("css-fundamentals", "html-fundamentals", "prerequisite");
addRelationship("javascript-fundamentals", "html-fundamentals", "prerequisite");
addRelationship("restful-apis", "javascript-fundamentals", "prerequisite");
addRelationship("docker-containers", "restful-apis", "prerequisite");
addRelationship("cloud-computing-fundamentals", "docker-containers", "prerequisite");

// Web dev related topics
addRelationship("computer-networks", "restful-apis", "related_topic");
addRelationship("computer-networks", "cloud-computing-fundamentals", "related_topic");
addRelationship("react-library", "javascript-fundamentals", "related_topic");
addRelationship("nextjs-framework", "react-library", "related_topic");

// Web dev applications
addRelationship("html-fundamentals", "react-library", "application");
addRelationship("css-fundamentals", "react-library", "application");
addRelationship("javascript-fundamentals", "restful-apis", "application");
addRelationship("restful-apis", "cloud-computing-fundamentals", "application");

// SOFTWARE ENGINEERING SUBCATEGORY - Learning path
addRelationship("git-version-control", "agile-development", "next_topic");
addRelationship("agile-development", "design-patterns", "next_topic");
addRelationship("design-patterns", "software-testing", "next_topic");

// Software engineering prerequisites
addRelationship("agile-development", "git-version-control", "prerequisite");
addRelationship("design-patterns", "git-version-control", "prerequisite");
addRelationship("software-testing", "git-version-control", "prerequisite");
addRelationship("software-testing", "design-patterns", "prerequisite");

// Software engineering related topics
addRelationship("git-version-control", "project-management-fundamentals", "related_topic");
addRelationship("agile-development", "project-management-fundamentals", "related_topic");
addRelationship("design-patterns", "algorithms-fundamentals", "related_topic");
addRelationship("software-testing", "agile-development", "related_topic");

// Software engineering applications
addRelationship("git-version-control", "python-programming-fundamentals", "application");
addRelationship("git-version-control", "javascript-fundamentals", "application");
addRelationship("design-patterns", "react-library", "application");
addRelationship("design-patterns", "nextjs-framework", "application");

// ALGORITHMS & DATA STRUCTURES
addRelationship("data-structures", "algorithms-fundamentals", "next_topic");
addRelationship("algorithms-fundamentals", "data-structures", "prerequisite");
addRelationship("data-structures", "python-programming-fundamentals", "prerequisite");
addRelationship("algorithms-fundamentals", "python-programming-fundamentals", "prerequisite");
addRelationship("data-structures", "javascript-fundamentals", "related_topic");
addRelationship("algorithms-fundamentals", "javascript-fundamentals", "related_topic");
addRelationship("data-structures", "machine-learning-fundamentals", "application");
addRelationship("algorithms-fundamentals", "machine-learning-fundamentals", "application");

// DATABASES
addRelationship("database-design", "sql-fundamentals", "next_topic");
addRelationship("sql-fundamentals", "database-design", "prerequisite");
addRelationship("database-design", "python-programming-fundamentals", "related_topic");
addRelationship("sql-fundamentals", "python-programming-fundamentals", "related_topic");
addRelationship("database-design", "restful-apis", "application");
addRelationship("sql-fundamentals", "pandas-data-analysis", "application");

// PERSONAL FINANCE SUBCATEGORY - Learning path
addRelationship("budgeting-fundamentals", "investing-basics", "next_topic");
addRelationship("investing-basics", "retirement-planning-fundamentals", "next_topic");

// Personal finance prerequisites
addRelationship("investing-basics", "budgeting-fundamentals", "prerequisite");
addRelationship("retirement-planning-fundamentals", "investing-basics", "prerequisite");
addRelationship("retirement-planning-fundamentals", "budgeting-fundamentals", "prerequisite");

// Personal finance related topics
addRelationship("budgeting-fundamentals", "entrepreneurship-fundamentals", "related_topic");
addRelationship("investing-basics", "cryptocurrency-fundamentals", "related_topic");
addRelationship("cryptocurrency-fundamentals", "investing-basics", "related_topic");

// Personal finance applications
addRelationship("budgeting-fundamentals", "financial-literacy", "application");
addRelationship("investing-basics", "wealth-building", "application");

// BUSINESS SUBCATEGORY
addRelationship("entrepreneurship-fundamentals", "business-strategy-fundamentals", "next_topic");
addRelationship("business-strategy-fundamentals", "entrepreneurship-fundamentals", "prerequisite");
addRelationship("entrepreneurship-fundamentals", "marketing-fundamentals", "related_topic");
addRelationship("business-strategy-fundamentals", "project-management-fundamentals", "related_topic");
addRelationship("entrepreneurship-fundamentals", "budgeting-fundamentals", "application");
addRelationship("marketing-fundamentals", "entrepreneurship-fundamentals", "application");

// MARKETING
addRelationship("marketing-fundamentals", "business-strategy-fundamentals", "related_topic");
addRelationship("marketing-fundamentals", "entrepreneurship-fundamentals", "related_topic");

// LEADERSHIP
addRelationship("project-management-fundamentals", "agile-development", "related_topic");
addRelationship("project-management-fundamentals", "git-version-control", "related_topic");
addRelationship("project-management-fundamentals", "business-strategy-fundamentals", "related_topic");

// LEARNING & STUDY SKILLS
addRelationship("online-learning-strategies", "effective-study-techniques", "next_topic");
addRelationship("effective-study-techniques", "online-learning-strategies", "prerequisite");
addRelationship("online-learning-strategies", "machine-learning-fundamentals", "related_topic");
addRelationship("effective-study-techniques", "python-programming-fundamentals", "related_topic");
addRelationship("online-learning-strategies", "career-development-fundamentals", "application");
addRelationship("effective-study-techniques", "python-programming-fundamentals", "application");

// CAREER DEVELOPMENT
addRelationship("career-development-fundamentals", "project-management-fundamentals", "related_topic");
addRelationship("career-development-fundamentals", "entrepreneurship-fundamentals", "related_topic");

// HEALTH & WELLNESS
addRelationship("mental-health-fundamentals", "fitness-fundamentals", "related_topic");
addRelationship("fitness-fundamentals", "mental-health-fundamentals", "related_topic");
addRelationship("nutrition-fundamentals", "fitness-fundamentals", "related_topic");
addRelationship("fitness-fundamentals", "nutrition-fundamentals", "related_topic");

// TRAVEL
addRelationship("budget-travel-strategies", "travel-planning-fundamentals", "next_topic");
addRelationship("travel-planning-fundamentals", "budget-travel-strategies", "prerequisite");
addRelationship("budget-travel-strategies", "budgeting-fundamentals", "related_topic");
addRelationship("travel-planning-fundamentals", "budgeting-fundamentals", "related_topic");

// CROSS-DOMAIN CONNECTIONS
// Programming to AI/ML
addRelationship("python-programming-fundamentals", "machine-learning-basics", "next_topic");
addRelationship("machine-learning-basics", "neural-networks", "next_topic");

// Programming to Web Dev
addRelationship("python-programming-fundamentals", "restful-apis", "related_topic");
addRelationship("sql-fundamentals", "database-design", "next_topic");

// Programming to Software Engineering
addRelationship("python-programming-fundamentals", "git-version-control", "next_topic");
addRelationship("javascript-fundamentals", "git-version-control", "next_topic");

// Business to Personal Finance
addRelationship("entrepreneurship-fundamentals", "investing-basics", "related_topic");
addRelationship("business-strategy-fundamentals", "budgeting-fundamentals", "related_topic");

// Data Science to Business
addRelationship("data-visualization", "business-strategy-fundamentals", "application");
addRelationship("statistics-fundamentals", "marketing-fundamentals", "application");

// Reverse relationships (previous_topic is the inverse of next_topic)
const reverseRelationships = [];
for (const rel of relationships) {
  if (rel.relationship_type === "next_topic") {
    reverseRelationships.push({
      source_id: rel.target_id,
      target_id: rel.source_id,
      relationship_type: "previous_topic",
    });
  }
}

// Combine all relationships
const allRelationships = [...relationships, ...reverseRelationships];

console.log(`Created ${allRelationships.length} semantic relationships`);
console.log(`  - Direct relationships: ${relationships.length}`);
console.log(`  - Reverse relationships: ${reverseRelationships.length}`);

// Save to file
fs.writeFileSync("phase19-relationships.json", JSON.stringify(allRelationships, null, 2));
console.log("\nSaved to: phase19-relationships.json");

// Statistics by topic
const bySource = new Map();
for (const rel of allRelationships) {
  const count = bySource.get(rel.source_id) || 0;
  bySource.set(rel.source_id, count + 1);
}

console.log("\nRelationships per topic:");
for (const topic of topics) {
  const count = bySource.get(topic.id) || 0;
  console.log(`  ${topic.slug}: ${count} relationships`);
}
