import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const ids = [
    "ea3f9ac1-b0fd-4ae7-8552-75245331ef9e",
    "0e9e7def-de47-45f3-a1e7-b3cfcffd0b85",
    "30a11d2a-0413-491f-ac1b-e6574fbabd69",
    "952ae4c7-c3f6-4383-8e6b-f82498448644",
    "da30b63d-6ae6-4067-bc49-9c73b1803fe8",
  ];
  for (const id of ids) {
    const { data: pkg } = await sb.from("knowledge_packages").select("slug, topic_id").eq("id", id).single();
    const { data: topic } = await sb.from("topics").select("slug, title").eq("id", pkg?.topic_id ?? "").maybeSingle();
    console.log({ id, slug: pkg?.slug, topicSlug: topic?.slug, url: topic?.slug ? `https://valendiro.com/en/topics/${topic.slug}` : null });
  }
}
main();
