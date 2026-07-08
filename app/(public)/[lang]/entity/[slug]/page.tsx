/**
 * Entity Hub Page — production-quality Knowledge Hub
 * All data from canonical entityHubData service (no placeholder queries).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getEntityHubData } from "@/services/public/entityHubData";

interface EntityPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export default async function EntityPage({ params }: EntityPageProps) {
  const { lang, slug } = await params;
  const data = await getEntityHubData(slug);

  if (!data) notFound();

  const { entity, facts, sources, relatedEntities, relatedTopics, latestArticles, knowledgePackages, statistics, overview, latestNewsSummary } = data;
  const allRelated = [...relatedTopics, ...relatedEntities];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                {entity.nodeType}
              </span>
              {statistics.confidenceScore > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {statistics.confidenceScore}% confidence
                </span>
              )}
              {statistics.confidenceScore === 0 && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  Awaiting enrichment
                </span>
              )}
            </div>
            <h1 className="text-5xl font-bold mb-4">{entity.name}</h1>
            {entity.description && <p className="text-xl text-gray-600 mb-6">{entity.description}</p>}
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div>
                <span className="font-medium">First discovered:</span>{" "}
                {new Date(entity.createdAt).toLocaleDateString()}
              </div>
              {entity.lastUpdatedAt && (
                <div>
                  <span className="font-medium">Last updated:</span>{" "}
                  {new Date(entity.lastUpdatedAt).toLocaleDateString()}
                </div>
              )}
              {statistics.lastKnowledgeUpdate && (
                <div>
                  <span className="font-medium">Knowledge update:</span>{" "}
                  {new Date(statistics.lastKnowledgeUpdate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            <StatCard value={statistics.articleCount} label="Articles" color="blue" />
            <StatCard value={statistics.relationshipCount} label="Relationships" color="green" />
            <StatCard value={statistics.factCount} label="Facts" color="purple" />
            <StatCard value={statistics.sourceCount} label="Sources" color="orange" />
          </div>

          {overview && (
            <Section title="Overview">
              <p className="text-gray-700 leading-relaxed">{overview}</p>
            </Section>
          )}

          {!overview && statistics.factCount === 0 && (
            <Section title="Overview">
              <p className="text-gray-600 leading-relaxed">
                {entity.name} is in the knowledge graph but has not yet accumulated verified facts from published packages.
                Related topics and packages will appear here as the autonomous learner enriches this entity.
              </p>
            </Section>
          )}

          {latestNewsSummary && (
            <Section title="Latest Developments">
              <p className="text-gray-700 leading-relaxed">{latestNewsSummary}</p>
            </Section>
          )}

          {facts.length > 0 && (
            <Section title="Key Facts">
              <div className="space-y-3">
                {facts.map((fact, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{fact}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {latestArticles.length > 0 && (
            <Section title="Related Topics">
              <div className="space-y-3">
                {latestArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/${lang}/topics/${article.slug}`}
                    className="block p-4 border rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div className="font-semibold text-lg">{article.title}</div>
                    <div className="text-sm text-gray-500">
                      Updated: {new Date(article.updatedAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {allRelated.length > 0 && (
            <Section title="Knowledge Graph">
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="text-center mb-4">
                  <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                    {entity.name}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {allRelated.slice(0, 8).map((rel) => (
                    <div key={`${rel.slug}-${rel.direction}`} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-gray-400 rounded-full shrink-0" />
                      <span className="text-gray-600 capitalize">{rel.relationship.replace(/_/g, " ")}</span>
                      <span className="text-gray-400">→</span>
                      <Link href={`/${lang}/${rel.type === "topic" ? "topics" : "entity"}/${rel.slug}`} className="text-blue-600 hover:underline truncate">
                        {rel.name}
                      </Link>
                      <span className="text-gray-400 shrink-0">({rel.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {relatedEntities.length > 0 && (
            <Section title="Related Entities">
              <div className="grid sm:grid-cols-2 gap-4">
                {relatedEntities.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/${lang}/entity/${rel.slug}`}
                    className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div className="font-semibold">{rel.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{rel.type} · {rel.relationship.replace(/_/g, " ")}</div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {knowledgePackages.length > 0 && (
            <Section title="Knowledge Packages">
              <div className="grid sm:grid-cols-2 gap-4">
                {knowledgePackages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    href={`/${lang}/topics/${pkg.slug}`}
                    className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div className="font-semibold">{pkg.slug.replace(/-/g, " ")}</div>
                    <div className="text-sm text-gray-500">
                      {pkg.status} · {pkg.factCount} facts
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {sources.length > 0 && (
            <Section title="Sources">
              <div className="space-y-2">
                {sources.map((src) => (
                  <div key={src.id} className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-700">{src.sourceName}</span>
                    {src.sourceUrl ? (
                      <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate ml-4 max-w-[50%]">
                        {src.sourceUrl.replace(/^https?:\/\//, "").slice(0, 60)}
                      </a>
                    ) : (
                      <span className="text-gray-400">{src.packageSlug}</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {statistics.factCount === 0 && statistics.relationshipCount === 0 && knowledgePackages.length === 0 && (
            <Section title="Enrichment Status">
              <p className="text-gray-600 text-sm">
                No verified facts, packages, or graph relationships are linked to this entity yet.
                Confidence is derived from live knowledge — not placeholder defaults.
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: "blue" | "green" | "purple" | "orange" }) {
  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };
  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className={`text-3xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-lg border mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

export async function generateMetadata({ params }: EntityPageProps) {
  const { slug } = await params;
  const data = await getEntityHubData(slug);
  if (!data) return { title: "Entity Not Found" };
  return {
    title: `${data.entity.name} - Knowledge Hub`,
    description: data.entity.description ?? `Knowledge hub for ${data.entity.name}`,
  };
}
