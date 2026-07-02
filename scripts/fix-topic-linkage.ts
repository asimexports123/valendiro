import { createClient } from "@supabase/supabase-js";

const sb = createClient("https://diwwvkbztvhwouttajha.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY");

const topics = [
  { slug: "machine-learning-basics", category: "technology", subcategory: "artificial-intelligence" },
  { slug: "docker-containers", category: "technology", subcategory: "web-development" },
  { slug: "css-fundamentals", category: "technology", subcategory: "web-development" },
  { slug: "retirement-planning-fundamentals", category: "personal-finance", subcategory: "retirement-planning" },
  { slug: "business-strategy-fundamentals", category: "business", subcategory: "entrepreneurship" },
  { slug: "nutrition-fundamentals", category: "health-wellness", subcategory: "nutrition-diet" },
  { slug: "cybersecurity-fundamentals", category: "technology", subcategory: "cybersecurity" },
  { slug: "cloud-computing-fundamentals", category: "technology", subcategory: "web-development" },
  { slug: "project-management-fundamentals", category: "business", subcategory: "leadership" },
];

async function main() {
  console.log("Fixing topic category linkage...\n");

  for (const { slug, category, subcategory } of topics) {
    console.log(slug);

    // Get category ID
    const { data: cat } = await sb.from("categories").select("id").eq("slug", category).single();
    if (!cat) {
      console.log(`  ✗ Category ${category} not found`);
      continue;
    }

    // Get subcategory ID
    const { data: sub } = await sb.from("subcategories").select("id").eq("slug", subcategory).single();
    if (!sub) {
      console.log(`  ✗ Subcategory ${subcategory} not found`);
      continue;
    }

    // Get topic ID
    const { data: topic } = await sb.from("topics").select("id").eq("slug", slug).single();
    if (!topic) {
      console.log(`  ✗ Topic not found`);
      continue;
    }

    // Update topic with category and subcategory
    await sb.from("topics").update({ category_id: cat.id, subcategory_id: sub.id }).eq("id", topic.id);
    console.log(`  ✓ Linked to ${category}/${subcategory}`);
  }

  console.log("\nAll topics linked. Site should now show articles.");
}

main();
