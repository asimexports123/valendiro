import { readFileSync } from "fs";
import { resolve } from "path";

const topics = JSON.parse(readFileSync(resolve(__dirname, "phase19-published-topics.json"), "utf-8"));

function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

console.log("=== Phase 20: Selecting Validation Topics ===\n");
console.log(`Total published topics: ${topics.length}`);
console.log(`Selecting: 25 random topics\n`);

const shuffled = shuffleArray(topics);
const selectedTopics = shuffled.slice(0, 25);

console.log("=== SELECTED TOPICS ===");
selectedTopics.forEach((topic, i) => {
  console.log(`${i + 1}. ${topic.slug} (${topic.id.substring(0, 8)})`);
});

const fs = require("fs");
fs.writeFileSync(
  resolve(__dirname, "phase20-validation-topics.json"),
  JSON.stringify({
    timestamp: new Date().toISOString(),
    selectedTopics,
  }, null, 2)
);

console.log("\nSaved to: phase20-validation-topics.json");
