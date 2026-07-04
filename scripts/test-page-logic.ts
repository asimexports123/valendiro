/**
 * Test page logic to verify content rendering
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { getTopicBySlug } from "../services/public/publicData";

async function testPageLogic(): Promise<void> {
  console.log("Testing page logic for budgeting-fundamentals...");

  const topic = await getTopicBySlug("budgeting-fundamentals");
  
  if (!topic) {
    console.log("Topic not found");
    return;
  }

  console.log("Topic found");
  console.log("Title:", topic.title);
  console.log("Content exists:", !!topic.content);
  console.log("Content length:", topic.content?.length || 0);
  console.log("Content:", topic.content);
  console.log("Should render:", topic.content ? "YES" : "NO");
}

testPageLogic()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
