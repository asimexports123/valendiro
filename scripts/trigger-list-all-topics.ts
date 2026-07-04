import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerListAllTopics() {
  console.log("Listing all topics for strategic selection...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/list-all-topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log(`Total topics: ${data.total_topics}\n`);

    // Categorize and analyze topics
    const categorized: any = {
      Technology: [],
      Business: [],
      Finance: [],
      Health: [],
      Home: [],
      Travel: [],
      Education: [],
    };

    data.all_topics.forEach((topic: any) => {
      const title = topic.topic_translations?.[0]?.title || topic.slug;
      const difficulty = topic.difficulty || "unknown";
      const status = topic.status || "unknown";
      const slug = topic.slug;

      // Categorize by slug patterns
      if (slug.includes("python") || slug.includes("javascript") || slug.includes("react") || slug.includes("nextjs") || slug.includes("docker") || slug.includes("kubernetes") || slug.includes("aws") || slug.includes("azure") || slug.includes("cloud") || slug.includes("cybersecurity") || slug.includes("network") || slug.includes("algorithm") || slug.includes("data-structure") || slug.includes("machine-learning") || slug.includes("ai") || slug.includes("git") || slug.includes("devops") || slug.includes("mobile") || slug.includes("web") || slug.includes("programming") || slug.includes("coding") || slug.includes("software") || slug.includes("database") || slug.includes("api") || slug.includes("testing") || slug.includes("iot") || slug.includes("embedded") || slug.includes("hardware") || slug.includes("cryptography") || slug.includes("security") || slug.includes("monitoring") || slug.includes("observability") || slug.includes("sre")) {
        categorized.Technology.push({ slug, title, difficulty, status });
      } else if (slug.includes("investing") || slug.includes("fund") || slug.includes("etf") || slug.includes("stock") || slug.includes("bond") || slug.includes("credit-card") || slug.includes("credit") || slug.includes("debt") || slug.includes("budget") || slug.includes("insurance") || slug.includes("mortgage") || slug.includes("retirement") || slug.includes("ira") || slug.includes("tax") || slug.includes("loan") || slug.includes("portfolio") || slug.includes("dividend") || slug.includes("cryptocurrency")) {
        categorized.Finance.push({ slug, title, difficulty, status });
      } else if (slug.includes("management") || slug.includes("leadership") || slug.includes("marketing") || slug.includes("sales") || slug.includes("strategy") || slug.includes("hr") || slug.includes("recruiting") || slug.includes("operations") || slug.includes("project") || slug.includes("entrepreneur") || slug.includes("startup") || slug.includes("b2b") || slug.includes("e-commerce") || slug.includes("competitive") || slug.includes("customer") || slug.includes("compensation") || slug.includes("team") || slug.includes("negotiation") || slug.includes("networking") || slug.includes("communication") || slug.includes("innovation") || slug.includes("change-management")) {
        categorized.Business.push({ slug, title, difficulty, status });
      } else if (slug.includes("health") || slug.includes("diabetes") || slug.includes("heart") || slug.includes("cancer") || slug.includes("mental") || slug.includes("nutrition") || slug.includes("fitness") || slug.includes("sleep") || slug.includes("screening") || slug.includes("diagnostic") || slug.includes("chronic") || slug.includes("autoimmune") || slug.includes("lab") || slug.includes("genetic")) {
        categorized.Health.push({ slug, title, difficulty, status });
      } else if (slug.includes("home") || slug.includes("diy") || slug.includes("cooking") || slug.includes("baking") || slug.includes("kitchen") || slug.includes("maintenance") || slug.includes("renovation") || slug.includes("organization") || slug.includes("food-safety") || slug.includes("meal") || slug.includes("equipment")) {
        categorized.Home.push({ slug, title, difficulty, status });
      } else if (slug.includes("travel") || slug.includes("visa") || slug.includes("passport") || slug.includes("cruise") || slug.includes("road-trip") || slug.includes("solo") || slug.includes("family") || slug.includes("rail") || slug.includes("ground") || slug.includes("car-rental") || slug.includes("digital-security") || slug.includes("tourist") || slug.includes("long-term")) {
        categorized.Travel.push({ slug, title, difficulty, status });
      } else if (slug.includes("learning") || slug.includes("study") || slug.includes("education") || slug.includes("online") || slug.includes("self-directed") || slug.includes("language") || slug.includes("english") || slug.includes("mandarin") || slug.includes("spanish") || slug.includes("bootcamp") || slug.includes("certification") || slug.includes("career") || slug.includes("job") || slug.includes("resume")) {
        categorized.Education.push({ slug, title, difficulty, status });
      }
    });

    console.log("=== CATEGORY DISTRIBUTION ===\n");
    Object.entries(categorized).forEach(([category, topics]: [string, any]) => {
      console.log(`${category}: ${topics.length} topics`);
      if (topics.length > 0) {
        topics.slice(0, 5).forEach((t: any) => {
          console.log(`  - ${t.title} (${t.difficulty})`);
        });
      }
      console.log();
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerListAllTopics();
