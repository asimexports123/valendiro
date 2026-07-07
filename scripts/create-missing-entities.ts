/**
 * Create missing entities in knowledge graph
 */

import { createAdminClient } from "../lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

const supabase = createAdminClient();

async function createMissingEntities() {
  console.log("=" + "=".repeat(79));
  console.log("CREATE MISSING ENTITIES");
  console.log("=".repeat(80));
  console.log();

  const missingEntities = [
    {
      name: "Black Forest Labs",
      slug: "black-forest-labs",
      type: "Company",
      description: "Black Forest Labs is an AI research company focused on developing advanced artificial intelligence models and technologies.",
    },
    {
      name: "Hugging Face",
      slug: "hugging-face",
      type: "Company",
      description: "Hugging Face is a company that specializes in natural language processing and machine learning tools, particularly known for its Transformers library.",
    },
    {
      name: "Mozilla Corporation",
      slug: "mozilla-corporation",
      type: "Company",
      description: "Mozilla Corporation is a non-profit organization that develops the Firefox web browser and promotes open web standards.",
    },
    {
      name: "Forest Labs",
      slug: "forest-labs",
      type: "Company",
      description: "Forest Labs is a technology company involved in AI research and development.",
    },
    {
      name: "Open Source Coalition",
      slug: "open-source-coalition",
      type: "Organization",
      description: "The Open Source Coalition is an organization that advocates for open source software policies and practices.",
    },
    {
      name: "SB 942",
      slug: "sb-942",
      type: "Law",
      description: "SB 942 is a California legislative bill related to AI transparency and regulation.",
    },
    {
      name: "SB 1000",
      slug: "sb-1000",
      type: "Law",
      description: "SB 1000 is a California legislative bill related to technology and AI policy.",
    },
    {
      name: "AI Act",
      slug: "ai-act",
      type: "Law",
      description: "The AI Act is comprehensive legislation regulating artificial intelligence in the European Union.",
    },
  ];

  console.log("STEP 1: CREATE MISSING ENTITIES");
  console.log("-".repeat(80));

  for (const entity of missingEntities) {
    const { data: existing } = await supabase
      .from("knowledge_graph_nodes")
      .select("*")
      .eq("slug", entity.slug)
      .single();

    if (existing) {
      console.log(`✓ ${entity.name} already exists`);
    } else {
      const entityId = uuidv4();
      const { error } = await supabase
        .from("knowledge_graph_nodes")
        .insert({
          id: entityId,
          node_type: entity.type,
          name: entity.name,
          slug: entity.slug,
          description: entity.description,
          confidence_score: 0.8,
          article_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.log(`✗ Error creating ${entity.name}: ${error.message}`);
      } else {
        console.log(`✓ Created ${entity.name}`);
      }
    }
  }
  console.log();

  console.log("STEP 2: VERIFY ALL ENTITIES");
  console.log("-".repeat(80));

  const { data: allNodes } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .in("slug", missingEntities.map(e => e.slug));

  console.log(`Created/Verified ${allNodes?.length || 0} entities`);
  console.log();
}

createMissingEntities()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
