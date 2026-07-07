/**
 * Entity Hub Page - Production-quality Knowledge Hub
 * 
 * All data fetched from database - no hardcoded content
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface EntityPageProps {
  params: {
    lang: string;
    slug: string;
  };
}

interface EntityHubData {
  entity: any;
  relatedEntities: any[];
  latestArticles: any[];
  knowledgePackages: any[];
  statistics: {
    articleCount: number;
    relationshipCount: number;
    knowledgePackageCount: number;
    lastUpdated: string;
  };
}

async function getEntityHubData(slug: string): Promise<EntityHubData | null> {
  const supabase = createAdminClient();

  console.log(`[Entity Hub] Fetching data for slug: ${slug}`);

  // Get entity
  const { data: entity, error: entityError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (entityError || !entity) {
    console.log("[Entity Hub] Entity not found:", entityError);
    return null;
  }

  // Get related entities (fix query to avoid embedding error)
  const { data: edges, error: edgesError } = await supabase
    .from("knowledge_graph_edges")
    .select("*")
    .eq("source_id", entity.id)
    .limit(20);

  let relatedEntities: any[] = [];
  if (!edgesError && edges) {
    // Fetch target nodes separately
    const targetIds = edges.map(e => e.target_id).filter(Boolean);
    if (targetIds.length > 0) {
      const { data: targetNodes } = await supabase
        .from("knowledge_graph_nodes")
        .select("*")
        .in("id", targetIds);
      
      relatedEntities = edges.map(edge => {
        const targetNode = targetNodes?.find(n => n.id === edge.target_id);
        return {
          name: targetNode?.name || "Unknown",
          type: targetNode?.node_type || "Unknown",
          relationship: edge.edge_type || "related",
          slug: targetNode?.slug || "",
        };
      }).filter(rel => rel.slug);
    }
  }

  // Get latest articles mentioning this entity
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("*")
    .ilike("content", `%${entity.name}%`)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get knowledge packages
  const { data: packages, error: packagesError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .limit(10);

  return {
    entity,
    relatedEntities,
    latestArticles: topics || [],
    knowledgePackages: packages || [],
    statistics: {
      articleCount: entity.article_count || 0,
      relationshipCount: relatedEntities.length,
      knowledgePackageCount: packages?.length || 0,
      lastUpdated: entity.last_updated_at || entity.updated_at,
    },
  };
}

export default async function EntityPage({ params }: EntityPageProps) {
  const data = await getEntityHubData(params.slug);

  if (!data) {
    notFound();
  }

  const { entity, relatedEntities, latestArticles, knowledgePackages, statistics } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {entity.node_type}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {Math.round((entity.confidence_score || 0) * 100)}% confidence
              </span>
            </div>
            <h1 className="text-5xl font-bold mb-4">{entity.name}</h1>
            <p className="text-xl text-gray-600 mb-6">{entity.description}</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <div>
                <span className="font-medium">First discovered:</span>{" "}
                {new Date(entity.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Last updated:</span>{" "}
                {new Date(entity.last_updated_at || entity.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-12">
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-3xl font-bold text-blue-600">{statistics.articleCount}</div>
              <div className="text-sm text-gray-500 mt-1">Articles</div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-3xl font-bold text-green-600">{statistics.relationshipCount}</div>
              <div className="text-sm text-gray-500 mt-1">Relationships</div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-3xl font-bold text-purple-600">{statistics.knowledgePackageCount}</div>
              <div className="text-sm text-gray-500 mt-1">Knowledge Packages</div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="text-3xl font-bold text-orange-600">
                {Math.round((entity.confidence_score || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Confidence</div>
            </div>
          </div>

          {/* Overview */}
          <div className="bg-white p-8 rounded-lg border mb-8">
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              {entity.description} This entity has been mentioned in {statistics.articleCount} articles 
              and is connected to {statistics.relationshipCount} other entities in the knowledge graph.
              The knowledge confidence score of {Math.round((entity.confidence_score || 0) * 100)}% 
              indicates the reliability of the information about {entity.name}.
            </p>
          </div>

          {/* Latest Articles */}
          {latestArticles.length > 0 && (
            <div className="bg-white p-8 rounded-lg border mb-8">
              <h2 className="text-2xl font-bold mb-4">Latest Articles</h2>
              <div className="space-y-3">
                {latestArticles.map((article: any) => (
                  <a
                    key={article.id}
                    href={`/${params.lang}/topics/${article.slug}`}
                    className="block p-4 border rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div className="font-semibold text-lg">{article.slug}</div>
                    <div className="text-sm text-gray-500">
                      Published: {new Date(article.created_at).toLocaleDateString()}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Related Entities */}
          {relatedEntities.length > 0 && (
            <div className="bg-white p-8 rounded-lg border mb-8">
              <h2 className="text-2xl font-bold mb-4">Related Entities</h2>
              <div className="grid grid-cols-2 gap-4">
                {relatedEntities.map((rel, index) => (
                  <a
                    key={index}
                    href={`/${params.lang}/entity/${rel.slug}`}
                    className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div className="font-semibold">{rel.name}</div>
                    <div className="text-sm text-gray-500">{rel.type} • {rel.relationship}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Graph */}
          <div className="bg-white p-8 rounded-lg border mb-8">
            <h2 className="text-2xl font-bold mb-4">Knowledge Graph</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{entity.name}
{relatedEntities.slice(0, 10).map((rel, index) => (
  <div key={index}>
    ├── {rel.relationship} → {rel.name} ({rel.type})
  </div>
))}
              </pre>
            </div>
          </div>

          {/* Knowledge Packages */}
          {knowledgePackages.length > 0 && (
            <div className="bg-white p-8 rounded-lg border mb-8">
              <h2 className="text-2xl font-bold mb-4">Knowledge Packages</h2>
              <div className="grid grid-cols-2 gap-4">
                {knowledgePackages.map((pkg: any) => (
                  <div key={pkg.id} className="p-4 border rounded-lg">
                    <div className="font-semibold">{pkg.slug}</div>
                    <div className="text-sm text-gray-500">
                      Status: {pkg.status} • {pkg.fact_count || 0} facts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white p-8 rounded-lg border mb-8">
            <h2 className="text-2xl font-bold mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24 text-sm text-gray-500">
                  {new Date(entity.created_at).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Entity first discovered</div>
                  <div className="text-sm text-gray-600">
                    {entity.name} was added to the knowledge graph
                  </div>
                </div>
              </div>
              {entity.last_updated_at && entity.last_updated_at !== entity.created_at && (
                <div className="flex gap-4">
                  <div className="w-24 text-sm text-gray-500">
                    {new Date(entity.last_updated_at).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Last knowledge update</div>
                    <div className="text-sm text-gray-600">
                      Entity information was last updated
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white p-8 rounded-lg border mb-8">
            <h2 className="text-2xl font-bold mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {entity.node_type}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                Knowledge Graph
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Entities
              </span>
            </div>
          </div>

          {/* References */}
          <div className="bg-white p-8 rounded-lg border">
            <h2 className="text-2xl font-bold mb-4">References</h2>
            <div className="text-sm text-gray-500">
              This entity hub is generated from {statistics.articleCount} articles in the knowledge base.
              Data is sourced from the knowledge graph and updated automatically as new information is discovered.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: EntityPageProps) {
  const data = await getEntityHubData(params.slug);

  if (!data) {
    return {
      title: "Entity Not Found",
    };
  }

  return {
    title: `${data.entity.name} - Knowledge Hub`,
    description: data.entity.description,
  };
}
