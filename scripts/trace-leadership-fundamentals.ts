import { createAdminClient } from "@/lib/env";

async function traceArticle() {
  const supabase = createAdminClient();

  console.log("=== Step 1: Find topics with actual translations ===");
  const { data: topics, error: topicError } = await supabase
    .from("topics")
    .select("*, topic_translations(*)")
    .eq("status", "published")
    .limit(20);

  if (topicError) {
    console.error("Error finding topic:", topicError);
    return;
  }

  if (!topics || topics.length === 0) {
    console.log("No published topics found");
    return;
  }

  console.log(`Found ${topics.length} published topics`);
  const topicsWithTranslations = topics.filter((t: any) => t.topic_translations && t.topic_translations.length > 0);
  console.log(`Found ${topicsWithTranslations.length} topics with translations`);

  if (topicsWithTranslations.length === 0) {
    console.log("No topics with translations found");
    return;
  }

  console.log("\nTopics with translations:");
  topicsWithTranslations.forEach((t: any, i: number) => {
    const translation = t.topic_translations?.[0];
    console.log(`${i + 1}. ${t.slug} - ${translation?.title || 'No translation'} (ID: ${t.id})`);
  });

  const topic = topicsWithTranslations[0];

  console.log(`\nTracing topic: ${topic.slug} (ID: ${topic.id})`);
  console.log("Topic row:", JSON.stringify(topic, null, 2));

  console.log("\n=== Step 2: Find knowledge_package for the topic ===");
  const { data: knowledgePackages, error: packageError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topic.id);

  if (packageError) {
    console.error("Error finding knowledge package:", packageError);
  } else {
    console.log(`Found ${knowledgePackages?.length || 0} knowledge packages`);
    if (knowledgePackages && knowledgePackages.length > 0) {
      console.log("Knowledge package:", JSON.stringify(knowledgePackages[0], null, 2));
    }
  }

  console.log("\n=== Step 3: Find rendered_output for the topic ===");
  const { data: renderedOutput, error: outputError } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("topic_id", topic.id)
    .maybeSingle();

  if (outputError) {
    console.error("Error finding rendered output:", outputError);
  } else {
    console.log("Rendered output:", renderedOutput ? JSON.stringify(renderedOutput, null, 2) : "None");
  }

  console.log("\n=== Step 4: Find published article record ===");
  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("*, article_translations(*)")
    .eq("topic_id", topic.id)
    .eq("status", "published");

  if (articleError) {
    console.error("Error finding article:", articleError);
  } else {
    console.log(`Found ${articles?.length || 0} published articles`);
    if (articles && articles.length > 0) {
      console.log("Article:", JSON.stringify(articles[0], null, 2));
    }
  }

  console.log("\n=== Step 5: Check category linkage ===");
  if (topic.category_id) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", topic.category_id)
      .single();

    if (categoryError) {
      console.error("Error finding category:", categoryError);
    } else {
      console.log("Category:", JSON.stringify(category, null, 2));
    }
  } else {
    console.log("Topic has no category_id (null)");
  }

  console.log("\n=== Step 6: Check subcategory linkage ===");
  if (topic.subcategory_id) {
    const { data: subcategory, error: subcategoryError } = await supabase
      .from("subcategories")
      .select("*")
      .eq("id", topic.subcategory_id)
      .single();

    if (subcategoryError) {
      console.error("Error finding subcategory:", subcategoryError);
    } else {
      console.log("Subcategory:", JSON.stringify(subcategory, null, 2));
    }
  } else {
    console.log("Topic has no subcategory_id (null)");
  }
}

traceArticle().catch(console.error);
