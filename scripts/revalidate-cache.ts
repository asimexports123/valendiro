/**
 * Revalidate cache for topics
 */

const TOPICS = [
  "/en/topics/python-programming-fundamentals",
  "/en/topics/git-version-control",
  "/en/topics/investing-basics",
  "/en/topics/data-structures",
];

async function revalidateTopic(path: string) {
  const url = `https://valendiro.com/api/revalidate`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });
    const text = await response.text();
    console.log(`${path}: ${response.status} - ${text}`);
  } catch (error: any) {
    console.log(`${path}: Error - ${error.message}`);
  }
}

async function revalidateAll() {
  console.log("=== Revalidating Cache ===\n");
  
  for (const path of TOPICS) {
    await revalidateTopic(path);
  }
}

revalidateAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
