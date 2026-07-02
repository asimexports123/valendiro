async function main() {
  const url = "https://valendiro.com/en/topics/python";
  const res = await fetch(url);
  console.log(`GET ${url} → ${res.status} ${res.statusText}`);
  // Also check that it's draft in DB
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    "https://diwwvkbztvhwouttajha.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
  );
  const { data } = await sb.from("topics").select("slug, status").eq("slug", "python").single();
  console.log("DB status:", data);
}
main().catch(console.error);
