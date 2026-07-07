/**
 * Entity Page
 * 
 * Displays canonical entity pages from the knowledge graph
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface EntityPageProps {
  params: {
    lang: string;
    slug: string;
  };
}

async function getEntityData(slug: string) {
  const supabase = createAdminClient();

  console.log(`[Entity Page] Looking up entity with slug: ${slug}`);

  const { data: entity, error } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .single();

  console.log(`[Entity Page] Entity query result:`, { error, entity });

  if (error || !entity) {
    console.log(`[Entity Page] Entity not found or error:`, error);
    return null;
  }

  // Get related entities
  const { data: edges } = await supabase
    .from("knowledge_graph_edges")
    .select("*, target_node:knowledge_graph_nodes(*)")
    .eq("source_id", entity.id)
    .limit(20);

  const relatedEntities = edges?.map(e => ({
    name: e.target_node?.name,
    type: e.target_node?.node_type,
    relationship: e.edge_type,
    slug: e.target_node?.slug,
  })) || [];

  // Get topics mentioning this entity
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .ilike("content", `%${entity.name}%`)
    .limit(10);

  return {
    entity,
    relatedEntities,
    latestArticles: topics || [],
  };
}

export default async function EntityPage({ params }: EntityPageProps) {
  const data = await getEntityData(params.slug);

  if (!data) {
    notFound();
  }

  const { entity, relatedEntities, latestArticles } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-2">{entity.node_type}</div>
          <h1 className="text-4xl font-bold mb-4">{entity.name}</h1>
          <p className="text-lg text-gray-700">{entity.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{entity.article_count}</div>
            <div className="text-sm text-gray-500">Articles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{relatedEntities.length}</div>
            <div className="text-sm text-gray-500">Relationships</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{(entity.confidence_score * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-500">Confidence</div>
          </div>
        </div>

        {/* Related Entities */}
        {relatedEntities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Related Entities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedEntities.map((rel, index) => (
                <a
                  key={index}
                  href={`/entity/${rel.slug}`}
                  className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="font-semibold">{rel.name}</div>
                  <div className="text-sm text-gray-500">{rel.type} • {rel.relationship}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Latest Articles */}
        {latestArticles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Latest Articles</h2>
            <div className="space-y-2">
              {latestArticles.map((article: any) => (
                <a
                  key={article.id}
                  href={`/en/topics/${article.slug}`}
                  className="block p-4 border rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="font-semibold">{article.slug}</div>
                  <div className="text-sm text-gray-500">Published: {new Date(article.created_at).toLocaleDateString()}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Graph */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Knowledge Graph</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              {entity.name}
              {relatedEntities.slice(0, 5).map((rel, index) => (
                <div key={index}>
                  ├── {rel.relationship} → {rel.name}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: EntityPageProps) {
  const data = await getEntityData(params.slug);

  if (!data) {
    return {
      title: "Entity Not Found",
    };
  }

  return {
    title: `${data.entity.name} - Knowledge Graph`,
    description: data.entity.description,
  };
}
