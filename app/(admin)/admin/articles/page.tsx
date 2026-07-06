"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { SearchBar } from "@/components/admin/SearchBar";
import { Pagination } from "@/components/admin/Pagination";
import { ArticleDeleteButton } from "@/components/admin/ArticleDeleteButton";
import { ArticleApproveButton } from "@/components/admin/ArticleApproveButton";
import { Button } from "@/components/ui/Button";
import { Trash2, Archive, CheckSquare, Square } from "lucide-react";

const STATUS_TABS = [
  { label: "All",       value: ""          },
  { label: "Published", value: "published" },
  { label: "Drafts",    value: "draft"     },
  { label: "Failed",    value: "failed"    },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    draft:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    failed:    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function QualityBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">-</span>;
  const color = score >= 70 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  return <span className={`text-sm font-semibold tabular-nums ${color}`}>{score}/100</span>;
}

export default function ArticlesPage() {
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchArticles();
  }, [currentPage, status, q]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const pageSize = 25;
      const offset = (currentPage - 1) * pageSize;

      const res = await fetch(`/api/admin/articles?page=${currentPage}&status=${status}&q=${q}&pageSize=${pageSize}`);
      const data = await res.json();
      setArticles(data.data || []);
      setCount(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(articles.map(a => a.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectArticle = (id: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedArticles(newSelected);
    setSelectAll(newSelected.size === articles.length);
  };

  const bulkDelete = async () => {
    if (selectedArticles.size === 0) return;
    if (!confirm(`Delete ${selectedArticles.size} articles? This action cannot be undone.`)) return;
    
    try {
      await Promise.all(
        Array.from(selectedArticles).map(id =>
          fetch(`/api/admin/articles/${id}`, { method: "DELETE" })
        )
      );
      setSelectedArticles(new Set());
      setSelectAll(false);
      fetchArticles();
    } catch (error) {
      console.error("Failed to bulk delete:", error);
      alert("Failed to delete articles. Please try again.");
    }
  };

  const bulkArchive = async () => {
    if (selectedArticles.size === 0) return;
    if (!confirm(`Archive ${selectedArticles.size} articles?`)) return;
    
    try {
      await Promise.all(
        Array.from(selectedArticles).map(id =>
          fetch(`/api/admin/articles/${id}/archive`, { method: "POST" })
        )
      );
      setSelectedArticles(new Set());
      setSelectAll(false);
      fetchArticles();
    } catch (error) {
      console.error("Failed to bulk archive:", error);
      alert("Failed to archive articles. Please try again.");
    }
  };

  const pageSize = 25;

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{count} total articles</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 border-b border-border/60">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/articles?status=${tab.value}${q ? `&q=${q}` : ""}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <SearchBar />

      {/* Bulk Actions Toolbar */}
      {selectedArticles.size > 0 && (
        <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4">
          <span className="text-white">{selectedArticles.size} articles selected</span>
          <div className="flex gap-2">
            <Button variant="danger" onClick={bulkDelete} size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Button variant="secondary" onClick={bulkArchive} size="sm">
              <Archive className="w-4 h-4 mr-2" />
              Archive Selected
            </Button>
          </div>
        </div>
      )}

      {/* Article list */}
      {articles.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-semibold text-foreground">No articles yet</p>
          <p className="text-sm text-muted-foreground mt-1">Press Start Pipeline on the dashboard to generate your first articles.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/50">
          {/* Header row with select all */}
          <div className="flex items-center gap-4 px-5 py-3 bg-muted/30 border-b border-border/50">
            <button
              onClick={handleSelectAll}
              className="text-foreground hover:text-primary transition-colors"
            >
              {selectAll ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </button>
            <span className="text-sm font-medium text-muted-foreground">Select All</span>
          </div>
          
          {articles.map((row) => (
            <div key={row.id} className="flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors">

              {/* Checkbox */}
              <button
                onClick={() => handleSelectArticle(row.id)}
                className="text-foreground hover:text-primary transition-colors"
              >
                {selectedArticles.has(row.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>

              {/* Title + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground text-sm truncate">{row.title}</p>
                  <StatusBadge status={row.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {row.category && row.category !== "-" && <span>{row.category}</span>}
                  <span>{row.publishedAt ?? row.createdAt}</span>
                  <QualityBadge score={row.quality} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/articles/${row.id}`}
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
                >
                  Edit
                </Link>
                {row.status === "draft" && (
                  <ArticleApproveButton id={row.id} />
                )}
                <ArticleDeleteButton id={row.id} />
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={count}
        basePath="/admin/articles"
        searchParams={{ q, status }}
      />

    </div>
  );
}
