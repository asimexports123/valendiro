/**
 * Revalidate cache for topics
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SECRET = process.env.ADMIN_SECRET || "your-secret-here";

const TOPICS = [
  "python-programming-fundamentals",
  "git-version-control",
  "investing-basics",
  "data-structures",
];

async function revalidateTopic(slug: string) {
  const url = `https://valendiro.com/api/revalidate?secret=${SECRET}&slug=${slug}`;
  
  try {
    const response = await fetch(url, { method: "POST" });
    const text = await response.text();
    console.log(`${slug}: ${response.status} - ${text}`);
  } catch (error: any) {
    console.log(`${slug}: Error - ${error.message}`);
  }
}

async function revalidateAll() {
  console.log("=== Revalidating Cache ===\n");
  
  for (const slug of TOPICS) {
    await revalidateTopic(slug);
  }
}

revalidateAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
