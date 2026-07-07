/**
 * Check available data for Entity Hub
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkEntityHubData() {
  console.log("=" + "=".repeat(79));
  console.log("CHECK ENTITY HUB DATA");
  console.log("=".repeat(80));
  console.log();

  const slug = "github";

  console.log("STEP 1: GET ENTITY FROM knowledge_graph_nodes");
  console.log("-".repeat(80));

  const { data: entity, error: entityError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (entityError) {
    console.log("Error:", entityError.message);
    return;
  }

  console.log("Entity:", entity);
  console.log();

  console.log("STEP 2: GET RELATED ENTITIES FROM knowledge_graph_edges");
  console.log("-".repeat(80));

  const { data: edges, error: edgesError } = await supabase
    .from("knowledge_graph_edges")
    .select("*, target_node:knowledge_graph_nodes(*), source_node:knowledge_graph_nodes(*)")
    .or(`source_id.eq.${entity.id},target_id.eq.${entity.id}`)
    .limit(20);

  if (edgesError) {
    console.log("Error:", edgesError.message);
  } else {
    console.log(`Found ${edges?.length || 0} edges`);
    edges?.forEach((edge, index) => {
      console.log(`  ${index + 1}. ${edge.edge_type}: ${edge.source_node?.name} → ${edge.target_node?.name}`);
    });
  }
  console.log();

  console.log("STEP 3: GET ARTICLES MENTIONING THIS ENTITY");
  console.log("-".repeat(80));

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("*")
    .ilike("content", `%${entity.name}%`)
    .limit(10);

  if (topicsError) {
    console.log("Error:", topicsError.message);
  } else {
    console.log(`Found ${topics?.length || 0} topics`);
    topics?.forEach((topic, index) => {
      console.log(`  ${index + 1}. ${topic.slug}`);
    });
  }
  console.log();

  console.log("STEP 4: GET KNOWLEDGE PACKAGES");
  console.log("-".repeat(80));

  const { data: packages, error: packagesError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .limit(10);

  if (packagesError) {
    console.log("Error:", packagesError.message);
  } else {
    console.log(`Found ${packages?.length || 0} knowledge packages`);
    packages?.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ${pkg.slug} - ${pkg.status}`);
    });
  }
  console.log();

  console.log("STEP 5: CHECK entities TABLE");
  console.log("-".repeat(80));

  const { data: entitiesTable, error: entitiesTableError } = await supabase
    .from("entities")
    .select("*")
    .limit(5);

  if (entitiesTableError) {
    console.log("Error:", entitiesTableError.message);
  } else {
    console.log(`Found ${entitiesTable?.length || 0} entities in entities table`);
    entitiesTable?.forEach((e, index) => {
      console.log(`  ${index + 1}. ${e.name}`);
    });
  }
  console.log();

  console.log("STEP 6: CHECK entity_relationships TABLE");
  console.log("-".repeat(80));

  const { data: relationships, error: relationshipsError } = await supabase
    .from("entity_relationships")
    .select("*")
    .limit(5);

  if (relationshipsError) {
    console.log("Error:", relationshipsError.message);
  } else {
    console.log(`Found ${relationships?.length || 0} entity relationships`);
    relationships?.forEach((r, index) => {
      console.log(`  ${index + 1}. ${r.source_entity_id} → ${r.target_entity_id} (${r.relationship_type})`);
    });
  }
  console.log();

  console.log("STEP 7: CHECK entity_mentions TABLE");
  console.log("-".repeat(80));

  const { data: mentions, error: mentionsError } = await supabase
    .from("entity_mentions")
    .select("*")
    .limit(5);

  if (mentionsError) {
    console.log("Error:", mentionsError.message);
  } else {
    console.log(`Found ${mentions?.length || 0} entity mentions`);
    mentions?.forEach((m, index) => {
      console.log(`  ${index + 1}. Entity ${m.entity_id} in ${m.article_id}`);
    });
  }
}

checkEntityHubData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
