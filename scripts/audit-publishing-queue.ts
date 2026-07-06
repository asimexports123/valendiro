import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function auditPublishingQueue() {
  const supabase = createAdminClient();

  console.log("=== Step 1: Check content_generation_queue for article items ===");
  const { data: queueItems, error: queueError } = await supabase
    .from("content_generation_queue")
    .select("*")
    .eq("object_type", "article")
    .limit(10);

  if (queueError) {
    console.error("Error checking queue:", queueError);
  } else {
    console.log(`Found ${queueItems?.length || 0} article items in queue`);
    if (queueItems && queueItems.length > 0) {
      console.log("Queue items:");
      queueItems.forEach((item: any) => {
        console.log(`- ${item.title} (status: ${item.status}, topic_id: ${item.topic_id})`);
      });
    }
  }

  console.log("\n=== Step 2: Check content_generation_queue for all items ===");
  const { data: allQueueItems, error: allQueueError } = await supabase
    .from("content_generation_queue")
    .select("object_type, status, count")
    .then(res => {
      const counts: Record<string, Record<string, number>> = {};
      res.data?.forEach((item: any) => {
        if (!counts[item.object_type]) counts[item.object_type] = {};
        counts[item.object_type][item.status] = (counts[item.object_type][item.status] || 0) + 1;
      });
      return { data: counts, error: res.error };
    });

  if (allQueueError) {
    console.error("Error checking all queue items:", allQueueError);
  } else {
    console.log("Queue counts by object_type and status:", allQueueItems);
  }

  console.log("\n=== Step 3: Check if rendered_outputs table exists and has data ===");
  const { data: renderedOutputs, error: renderedError } = await supabase
    .from("rendered_outputs")
    .select("*")
    .limit(5);

  if (renderedError) {
    console.error("Error checking rendered_outputs:", renderedError);
  } else {
    console.log(`Found ${renderedOutputs?.length || 0} rendered outputs`);
    if (renderedOutputs && renderedOutputs.length > 0) {
      console.log("Sample rendered output:", JSON.stringify(renderedOutputs[0], null, 2));
    }
  }

  console.log("\n=== Step 4: Check published topics count ===");
  const { count: topicCount } = await supabase
    .from("topics")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  console.log(`Published topics: ${topicCount}`);

  console.log("\n=== Step 5: Check knowledge_packages count ===");
  const { count: packageCount } = await supabase
    .from("knowledge_packages")
    .select("*", { count: "exact", head: true });

  console.log(`Knowledge packages: ${packageCount}`);

  console.log("\n=== Step 6: Check environment variables ===");
  console.log(`ARTICLE_PUBLISHING_ENABLED: ${process.env.ARTICLE_PUBLISHING_ENABLED}`);
  console.log(`TOPIC_PUBLISH_LIMIT: ${process.env.TOPIC_PUBLISH_LIMIT}`);
  console.log(`ARTICLE_PUBLISH_LIMIT: ${process.env.ARTICLE_PUBLISH_LIMIT}`);
}

auditPublishingQueue().catch(console.error);
