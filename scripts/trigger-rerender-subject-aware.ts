import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

const TOPICS = [
  { slug: "python-programming-fundamentals", name: "Python Programming Fundamentals" },
  { slug: "git-version-control", name: "Git Version Control" },
  { slug: "investing-basics", name: "Investing Basics" },
  { slug: "data-structures", name: "Data Structures" },
];

async function rerenderTopic(slug: string, name: string) {
  console.log(`Re-rendering ${name} (${slug})...\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/admin/renderer-rerender`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
        topic_slug: slug,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Failed for ${name}:`, data.error);
      if (data.diagnostics) {
        console.error("Diagnostics:", JSON.stringify(data.diagnostics, null, 2));
      }
      return { success: false, slug, error: data.error };
    }

    console.log(`✓ ${name} re-rendered successfully`);
    if (data.rendered_url) {
      console.log(`  URL: ${data.rendered_url}`);
    }
    return { success: true, slug, url: data.rendered_url };
  } catch (error: any) {
    console.error(`Error for ${name}:`, error.message);
    return { success: false, slug, error: error.message };
  }
}

async function rerenderAllTopics() {
  console.log("=== Subject-Aware Content Regeneration ===\n");
  console.log("Re-rendering 4 topics with new subject validation:\n");

  const results = [];
  
  for (const topic of TOPICS) {
    const result = await rerenderTopic(topic.slug, topic.name);
    results.push(result);
    console.log();
  }

  console.log("=== RESULTS ===\n");
  console.log("Live URLs:\n");
  
  for (const result of results) {
    if (result.success) {
      console.log(`${result.slug}: ${result.url}`);
    } else {
      console.log(`${result.slug}: FAILED - ${result.error}`);
    }
  }

  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log(`\n${failed.length} topics failed to render`);
    process.exit(1);
  }
}

rerenderAllTopics();
