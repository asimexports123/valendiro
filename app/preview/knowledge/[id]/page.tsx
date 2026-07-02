"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  KnowledgePackageRow,
  KnowledgeFactRow,
  KnowledgeCitationRow,
  KnowledgeEvidenceRow,
  KnowledgeProvenanceRow,
  KnowledgeRelationshipRow,
} from "@/lib/types";

interface FactWithRelations extends KnowledgeFactRow {
  knowledge_evidence: KnowledgeEvidenceRow[];
  knowledge_provenance: KnowledgeProvenanceRow[];
}

type TabId = "overview" | "facts" | "citations" | "relationships" | "provenance";

export default function KnowledgePackageDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [pkg, setPkg] = useState<KnowledgePackageRow | null>(null);
  const [facts, setFacts] = useState<FactWithRelations[]>([]);
  const [citations, setCitations] = useState<KnowledgeCitationRow[]>([]);
  const [relationships, setRelationships] = useState<KnowledgeRelationshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    async function load() {
      const sb = createClient();

      const { data: pkgData } = await sb
        .from("knowledge_packages")
        .select("*")
        .eq("id", id)
        .single();

      const { data: factsData } = await sb
        .from("knowledge_facts")
        .select("*, knowledge_evidence(*), knowledge_provenance(*)")
        .eq("package_id", id)
        .order("created_at");

      const { data: citData } = await sb
        .from("knowledge_citations")
        .select("*")
        .eq("package_id", id);

      const factIds = (factsData ?? []).map((f: any) => f.id);
      let relData: KnowledgeRelationshipRow[] = [];
      if (factIds.length > 0) {
        const { data } = await sb
          .from("knowledge_relationships")
          .select("*")
          .or(`source_id.in.(${factIds.join(",")}),target_id.in.(${factIds.join(",")})`);
        relData = data ?? [];
      }

      setPkg(pkgData);
      setFacts((factsData as FactWithRelations[]) ?? []);
      setCitations(citData ?? []);
      setRelationships(relData);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading package...</div>;
  if (!pkg) return <div className="p-8 text-red-500">Package not found.</div>;

  // ─── Computed Stats ──────────────────────────────────────────────────────────

  const confidenceDist = facts.reduce((acc, f) => {
    acc[f.confidence] = (acc[f.confidence] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeDist = facts.reduce((acc, f) => {
    acc[f.fact_type] = (acc[f.fact_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const relTypeDist = relationships.reduce((acc, r) => {
    acc[r.relationship_type] = (acc[r.relationship_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEvidence = facts.reduce((sum, f) => sum + f.knowledge_evidence.length, 0);

  // ─── Color Maps ──────────────────────────────────────────────────────────────

  const confidenceColor: Record<string, string> = {
    verified: "bg-green-100 text-green-800",
    high: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-orange-100 text-orange-800",
    disputed: "bg-red-100 text-red-800",
  };

  const authorityColor: Record<string, string> = {
    official: "bg-green-100 text-green-700",
    encyclopedic: "bg-blue-100 text-blue-700",
    academic: "bg-purple-100 text-purple-700",
    community: "bg-yellow-100 text-yellow-700",
    unknown: "bg-gray-100 text-gray-600",
  };

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "overview", label: "Overview", count: 0 },
    { id: "facts", label: "Facts", count: facts.length },
    { id: "citations", label: "Citations", count: citations.length },
    { id: "relationships", label: "Relationships", count: relationships.length },
    { id: "provenance", label: "Provenance", count: facts.reduce((s, f) => s + f.knowledge_provenance.length, 0) },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <a href="/preview/knowledge" className="text-blue-500 text-sm hover:underline">
          &larr; All Packages
        </a>
        <h1 className="text-3xl font-bold mt-2 font-mono">{pkg.slug}</h1>
        <div className="flex gap-3 mt-2 text-sm flex-wrap">
          <span className="bg-gray-100 px-2 py-0.5 rounded">v{pkg.version}</span>
          <span className={`px-2 py-0.5 rounded ${
            pkg.status === "ready" ? "bg-green-100 text-green-700" :
            pkg.status === "stale" ? "bg-yellow-100 text-yellow-700" :
            pkg.status === "draft" ? "bg-gray-100 text-gray-600" :
            "bg-red-100 text-red-700"
          }`}>
            {pkg.status}
          </span>
          <span className="text-gray-400 font-mono text-xs self-center">
            {pkg.knowledge_hash.slice(0, 24)}...
          </span>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="mb-6 bg-gray-50 border rounded p-4">
        <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Discovery</span>
          <span className="text-gray-400">&rarr;</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Assembler</span>
          <span className="text-gray-400">&rarr;</span>
          <span className="bg-green-200 text-green-800 px-2 py-1 rounded font-bold">Knowledge Package</span>
          <span className="text-gray-400">&rarr;</span>
          <span className="bg-gray-200 text-gray-500 px-2 py-1 rounded">Renderer</span>
          <span className="text-gray-400">&rarr;</span>
          <span className="bg-gray-200 text-gray-500 px-2 py-1 rounded">Output</span>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          You are viewing Layer 1: the canonical source of truth.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6 flex gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{facts.length}</div>
              <div className="text-xs text-gray-500">Atomic Facts</div>
            </div>
            <div className="border rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{citations.length}</div>
              <div className="text-xs text-gray-500">Citations</div>
            </div>
            <div className="border rounded p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{relationships.length}</div>
              <div className="text-xs text-gray-500">Relationships</div>
            </div>
            <div className="border rounded p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{totalEvidence}</div>
              <div className="text-xs text-gray-500">Evidence Links</div>
            </div>
          </div>

          {/* Confidence Distribution */}
          <div className="border rounded p-4">
            <h3 className="text-sm font-semibold mb-3">Confidence Distribution</h3>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(confidenceDist).sort().map(([level, count]) => (
                <div key={level} className={`px-3 py-1.5 rounded text-xs font-medium ${confidenceColor[level]}`}>
                  {level}: {count}
                </div>
              ))}
            </div>
            {/* Bar */}
            <div className="mt-3 flex h-3 rounded overflow-hidden">
              {Object.entries(confidenceDist).map(([level, count]) => {
                const pct = (count / facts.length) * 100;
                const colors: Record<string, string> = {
                  verified: "bg-green-400", high: "bg-blue-400", medium: "bg-yellow-400",
                  low: "bg-orange-400", disputed: "bg-red-400",
                };
                return <div key={level} className={colors[level]} style={{ width: `${pct}%` }} title={`${level}: ${count}`} />;
              })}
            </div>
          </div>

          {/* Fact Type Distribution */}
          <div className="border rounded p-4">
            <h3 className="text-sm font-semibold mb-3">Fact Type Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(typeDist).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="bg-gray-50 rounded px-2 py-1.5 text-xs text-center">
                  <div className="font-semibold text-gray-700">{count}</div>
                  <div className="text-gray-500">{type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Relationship Type Distribution */}
          {relationships.length > 0 && (
            <div className="border rounded p-4">
              <h3 className="text-sm font-semibold mb-3">Relationship Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(relTypeDist).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} className="bg-indigo-50 rounded px-2 py-1.5 text-xs text-center">
                    <div className="font-semibold text-indigo-700">{count}</div>
                    <div className="text-indigo-500 font-mono">{type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Package Metadata */}
          <div className="border rounded p-4">
            <h3 className="text-sm font-semibold mb-3">Metadata</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-gray-500">Created</dt>
              <dd>{new Date(pkg.created_at).toLocaleString()}</dd>
              <dt className="text-gray-500">Last Updated</dt>
              <dd>{new Date(pkg.last_updated_at).toLocaleString()}</dd>
              <dt className="text-gray-500">Last Verified</dt>
              <dd>{pkg.last_verified_at ? new Date(pkg.last_verified_at).toLocaleString() : "—"}</dd>
              <dt className="text-gray-500">Knowledge Hash</dt>
              <dd className="font-mono break-all">{pkg.knowledge_hash}</dd>
              <dt className="text-gray-500">Discovery Runs</dt>
              <dd>{pkg.discovery_run_ids?.length ?? 0}</dd>
            </dl>
          </div>
        </div>
      )}

      {activeTab === "facts" && (
        <div className="space-y-3">
          {facts.map((fact) => (
            <div key={fact.id} className="border rounded p-4">
              <div className="flex items-start justify-between">
                <p className="font-medium flex-1">{fact.statement}</p>
                <div className="flex gap-2 ml-4 shrink-0">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{fact.fact_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${confidenceColor[fact.confidence]}`}>
                    {fact.confidence}
                  </span>
                  <span className="text-xs bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">{fact.scope}</span>
                </div>
              </div>

              {fact.tags.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {fact.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {fact.knowledge_evidence.length > 0 && (
                <div className="mt-3 pl-3 border-l-2 border-green-200">
                  <div className="text-xs font-medium text-green-700 mb-1">
                    Evidence ({fact.knowledge_evidence.length})
                  </div>
                  {fact.knowledge_evidence.map((ev) => (
                    <div key={ev.id} className="text-xs text-gray-500 mb-1">
                      <span className="italic">&ldquo;{ev.excerpt}&rdquo;</span>
                      <span className="ml-1 text-gray-400">
                        ({citations.find(c => c.id === ev.citation_id)?.source_name ?? ev.citation_id.slice(0, 8)})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {fact.knowledge_provenance.length > 0 && (
                <div className="mt-2 pl-3 border-l-2 border-purple-200">
                  <div className="text-xs font-medium text-purple-700 mb-1">Provenance</div>
                  {fact.knowledge_provenance.map((prov) => (
                    <div key={prov.id} className="text-xs text-gray-500">
                      {prov.adapter_name} / {prov.source_slug}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "citations" && (
        <div className="space-y-3">
          {citations.map((cit) => (
            <div key={cit.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold">{cit.source_name}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${authorityColor[cit.source_authority]}`}>
                    {cit.source_authority}
                  </span>
                </div>
                {cit.source_url && (
                  <a href={cit.source_url} target="_blank" className="text-xs text-blue-500 hover:underline">
                    Open source &rarr;
                  </a>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex gap-4">
                <span>Adapter: <strong>{cit.adapter_name}</strong></span>
                <span>Method: <strong>{cit.extraction_method}</strong></span>
                <span>Retrieved: {new Date(cit.retrieved_at).toLocaleDateString()}</span>
              </div>
              {/* Facts backed by this citation */}
              <div className="mt-3 pl-3 border-l-2 border-blue-100">
                <div className="text-xs text-blue-600 font-medium mb-1">
                  Facts backed by this citation:
                </div>
                {facts
                  .filter(f => f.knowledge_evidence.some(e => e.citation_id === cit.id))
                  .slice(0, 5)
                  .map(f => (
                    <div key={f.id} className="text-xs text-gray-500 mb-0.5">
                      &bull; {f.statement.slice(0, 80)}{f.statement.length > 80 ? "..." : ""}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "relationships" && (
        <div>
          {relationships.length === 0 ? (
            <div className="text-gray-400 text-sm">No relationships for this package.</div>
          ) : (
            <div className="space-y-2">
              {/* Group by type */}
              {Object.entries(relTypeDist).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <details key={type} className="border rounded" open={count <= 10}>
                  <summary className="px-4 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 text-sm font-medium flex justify-between">
                    <span className="font-mono text-indigo-700">{type}</span>
                    <span className="text-gray-400">{count}</span>
                  </summary>
                  <div className="p-3 space-y-1.5">
                    {relationships
                      .filter(r => r.relationship_type === type)
                      .map((rel) => {
                        const srcFact = facts.find(f => f.id === rel.source_id);
                        const tgtFact = facts.find(f => f.id === rel.target_id);
                        return (
                          <div key={rel.id} className="text-xs flex items-start gap-2 py-1 border-b border-gray-50 last:border-0">
                            <span className={`shrink-0 px-1.5 py-0.5 rounded ${
                              rel.strength === "strong" ? "bg-green-50 text-green-600" :
                              rel.strength === "moderate" ? "bg-yellow-50 text-yellow-600" :
                              "bg-gray-50 text-gray-500"
                            }`}>
                              {rel.strength}
                            </span>
                            <span className="text-gray-600">
                              {srcFact ? srcFact.statement.slice(0, 50) + (srcFact.statement.length > 50 ? "..." : "") : rel.source_id.slice(0, 8)}
                            </span>
                            <span className="text-gray-300 shrink-0">&rarr;</span>
                            <span className="text-gray-600">
                              {tgtFact ? tgtFact.statement.slice(0, 50) + (tgtFact.statement.length > 50 ? "..." : "") : rel.target_id.slice(0, 8)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "provenance" && (
        <div className="space-y-3">
          {facts.filter(f => f.knowledge_provenance.length > 0).map((fact) => (
            <div key={fact.id} className="border rounded p-3">
              <p className="text-sm font-medium mb-2">{fact.statement}</p>
              <div className="pl-3 border-l-2 border-purple-200 space-y-1">
                {fact.knowledge_provenance.map((prov) => (
                  <div key={prov.id} className="text-xs text-gray-500 flex gap-3">
                    <span className="font-medium text-purple-600">{prov.adapter_name}</span>
                    <span>{prov.source_slug}</span>
                    {prov.discovery_run_id && (
                      <span className="text-gray-400">run: {prov.discovery_run_id.slice(0, 8)}...</span>
                    )}
                    {prov.discovery_candidate_id && (
                      <span className="text-gray-400">cand: {prov.discovery_candidate_id.slice(0, 8)}...</span>
                    )}
                    <span className="text-gray-400">{new Date(prov.extracted_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
