"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { KnowledgePackageRow, DomainGlossaryEntry } from "@/lib/types";

export default function KnowledgePreviewPage() {
  const [packages, setPackages] = useState<KnowledgePackageRow[]>([]);
  const [glossary, setGlossary] = useState<DomainGlossaryEntry[]>([]);
  const [glossaryCount, setGlossaryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = createClient();

      const { data: pkgs } = await sb
        .from("knowledge_packages")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: gloss, count } = await sb
        .from("domain_glossary")
        .select("*", { count: "exact" })
        .order("abbreviation")
        .limit(20);

      setPackages(pkgs ?? []);
      setGlossary(gloss ?? []);
      setGlossaryCount(count ?? 0);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading Knowledge Packages...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Knowledge Packages</h1>
      <p className="text-gray-500 mb-4">
        Layer 1 — Atomic knowledge units with facts, citations, relationships, and provenance.
      </p>

      {/* Pipeline Architecture */}
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
          Knowledge Packages are the single source of truth. No shortcuts, no bypasses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{packages.length}</div>
          <div className="text-xs text-blue-600">Packages</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{glossaryCount}</div>
          <div className="text-xs text-green-600">Glossary Entries</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {packages.reduce((sum, p) => sum + p.fact_count, 0)}
          </div>
          <div className="text-xs text-purple-600">Total Facts</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">
            {packages.reduce((sum, p) => sum + p.source_count, 0)}
          </div>
          <div className="text-xs text-amber-600">Total Sources</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-indigo-700">
            {packages.reduce((sum, p) => sum + p.relationship_count, 0)}
          </div>
          <div className="text-xs text-indigo-600">Relationships</div>
        </div>
      </div>

      {/* Packages */}
      <h2 className="text-xl font-semibold mb-4">Packages</h2>
      {packages.length === 0 ? (
        <div className="text-gray-400 bg-gray-50 rounded p-6 text-center">
          No Knowledge Packages yet. Run the Knowledge Assembler to create packages from Discovery Candidates.
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <a
              key={pkg.id}
              href={`/preview/knowledge/${pkg.id}`}
              className="block border rounded p-4 hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-sm font-semibold">{pkg.slug}</span>
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">v{pkg.version}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    pkg.status === "ready" ? "bg-green-100 text-green-700" :
                    pkg.status === "stale" ? "bg-yellow-100 text-yellow-700" :
                    pkg.status === "draft" ? "bg-gray-100 text-gray-600" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {pkg.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(pkg.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500 flex gap-4">
                <span>{pkg.fact_count} facts</span>
                <span>{pkg.source_count} sources</span>
                <span>{pkg.relationship_count} relationships</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Domain Glossary Preview */}
      <h2 className="text-xl font-semibold mt-8 mb-4">
        Domain Glossary <span className="text-sm font-normal text-gray-400">({glossaryCount} entries)</span>
      </h2>
      <div className="bg-gray-50 rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2 font-medium">Abbreviation</th>
              <th className="text-left p-2 font-medium">Canonical Form</th>
              <th className="text-left p-2 font-medium">Domain</th>
            </tr>
          </thead>
          <tbody>
            {glossary.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="p-2 font-mono font-semibold">{entry.abbreviation}</td>
                <td className="p-2">{entry.canonical_form}</td>
                <td className="p-2 text-gray-500">{entry.domain ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {glossaryCount > 20 && (
          <div className="p-2 text-center text-xs text-gray-400">
            Showing 20 of {glossaryCount} entries
          </div>
        )}
      </div>
    </div>
  );
}
