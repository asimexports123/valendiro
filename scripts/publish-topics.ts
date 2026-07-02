import { createClient } from "@supabase/supabase-js";

const sb = createClient("https://diwwvkbztvhwouttajha.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY");

const topics = ["machine-learning-basics", "retirement-planning-fundamentals", "business-strategy-fundamentals", "nutrition-fundamentals", "cybersecurity-fundamentals", "cloud-computing-fundamentals", "project-management-fundamentals"];

async function main() {
  for (const slug of topics) {
    const { data: topic } = await sb.from("topics").select("id").eq("slug", slug).single();
    if (topic) {
      await sb.from("topics").update({ status: "published" }).eq("id", topic.id);
      console.log(`✓ Published ${slug}`);
    }
  }
}

main();
