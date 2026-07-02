import { createClient } from "@supabase/supabase-js";

const sb = createClient("https://diwwvkbztvhwouttajha.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY");

async function main() {
  const { data: topic } = await sb
    .from("topics")
    .select("updated_at")
    .eq("slug", "machine-learning-basics")
    .single();

  if (!topic) {
    console.log("Topic not found");
    return;
  }

  console.log("Topic updated_at:", topic.updated_at);
  console.log("Current time:", new Date().toISOString());
  
  const updateTime = new Date(topic.updated_at);
  const now = new Date();
  const minutesSinceUpdate = Math.floor((now.getTime() - updateTime.getTime()) / 60000);
  
  console.log("\nMinutes since database update:", minutesSinceUpdate);
  console.log("ISR cache expires after 60 minutes");
  console.log("Cache expires in:", 60 - minutesSinceUpdate, "minutes");
}

main();
