"use client";

import { useState } from "react";

export default function RendererRerenderPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerRerender = async (mode: "pilot" | "full") => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/renderer-rerender", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to trigger rerender");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Premium Renderer Rollout</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Phase 1 - Pilot Rerender</h2>
        <p className="text-gray-600 mb-4">
          Re-render 20 published articles from different categories using the new premium renderer (long-article-v2).
        </p>
        <button
          onClick={() => triggerRerender("pilot")}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Start Pilot Rerender"}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Phase 3 - Full Rollout</h2>
        <p className="text-gray-600 mb-4">
          Re-render ALL published articles with the new premium renderer. Use with caution.
        </p>
        <button
          onClick={() => triggerRerender("full")}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Start Full Rollout"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-green-800 font-semibold mb-4">Rerender Complete</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Mode:</strong> {result.mode}</p>
            <p><strong>Total Articles:</strong> {result.totalArticles}</p>
            <p><strong>Successful:</strong> {result.successful}</p>
            <p><strong>Failed:</strong> {result.failed}</p>
            
            {result.successful > 0 && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Successfully Re-rendered:</p>
                <ul className="list-disc list-inside max-h-60 overflow-y-auto">
                  {result.results.map((r: any) => (
                    <li key={r.slug} className="text-gray-700">
                      {r.slug} (Quality: {r.qualityScore})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.failed > 0 && (
              <div className="mt-4">
                <p className="font-semibold mb-2 text-red-700">Failed:</p>
                <ul className="list-disc list-inside max-h-60 overflow-y-auto">
                  {result.errors.map((e: any, i: number) => (
                    <li key={i} className="text-red-600">
                      {e.slug}: {e.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
