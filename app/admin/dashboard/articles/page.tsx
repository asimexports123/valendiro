"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { 
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Article {
  id: string;
  slug: string;
  status: string;
  article_type: string;
  published_at: string;
  updated_at: string;
  article_translations: Array<{
    title: string;
    excerpt: string;
    language_code: string;
  }>;
  topics: {
    slug: string;
    topic_translations: Array<{
      title: string;
    }>;
  };
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchArticles();
  }, [page, statusFilter, searchQuery]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/dashboard/dashboard/articles?${params}`);
      if (!res.ok) {
        console.error("Failed to fetch articles:", res.statusText);
        setArticles([]);
        setTotal(0);
        return;
      }
      const data = await res.json();
      setArticles(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleArticleSelection = (articleId: string) => {
    const newSelection = new Set(selectedArticles);
    if (newSelection.has(articleId)) {
      newSelection.delete(articleId);
    } else {
      newSelection.add(articleId);
    }
    setSelectedArticles(newSelection);
  };

  const selectAll = () => {
    if (selectedArticles.size === articles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(articles.map(a => a.id)));
    }
  };

  const bulkRepublish = async () => {
    if (selectedArticles.size === 0) return;
    if (!confirm(`Republish ${selectedArticles.size} articles?`)) return;
    
    try {
      await Promise.all(
        Array.from(selectedArticles).map(id =>
          fetch(`/api/admin/dashboard/dashboard/articles/${id}/republish`, { method: "POST" })
        )
      );
      setSelectedArticles(new Set());
      fetchArticles();
    } catch (error) {
      console.error("Failed to bulk republish:", error);
      alert("Failed to republish articles. Please try again.");
    }
  };

  const bulkDelete = async () => {
    if (selectedArticles.size === 0) return;
    if (!confirm(`Delete ${selectedArticles.size} articles? This action cannot be undone.`)) return;
    
    try {
      await Promise.all(
        Array.from(selectedArticles).map(id =>
          fetch(`/api/admin/delete`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "article", id })
          })
        )
      );
      setSelectedArticles(new Set());
      fetchArticles();
    } catch (error) {
      console.error("Failed to bulk delete:", error);
      alert("Failed to delete articles. Please try again.");
    }
  };

  const regenerateArticle = async (articleId: string) => {
    try {
      await fetch(`/api/admin/dashboard/dashboard/articles/${articleId}/regenerate`, { method: "POST" });
      fetchArticles();
    } catch (error) {
      console.error("Failed to regenerate article:", error);
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) return;
    
    try {
      await fetch(`/api/admin/delete`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "article", id: articleId })
      });
      fetchArticles();
    } catch (error) {
      console.error("Failed to delete article:", error);
      alert("Failed to delete article. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-600">Published</Badge>;
      case "draft":
        return <Badge className="bg-yellow-600">Draft</Badge>;
      case "review":
        return <Badge className="bg-blue-600">Needs Review</Badge>;
      case "failed":
        return <Badge className="bg-red-600">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Articles</h1>
          <p className="text-gray-400 mt-1">Manage all published and draft articles</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Create Article
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md px-4 py-2 w-full"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white rounded-md px-4 py-2"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="review">Needs Review</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedArticles.size > 0 && (
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <span className="font-semibold">{selectedArticles.size}</span> articles selected
              </div>
              <div className="flex gap-2">
                <Button onClick={bulkRepublish} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Republish
                </Button>
                <Button onClick={bulkDelete} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              {total} Articles
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedArticles.size === articles.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => {
                const translation = article.article_translations?.[0];
                const topic = article.topics?.topic_translations?.[0];
                
                return (
                  <div
                    key={article.id}
                    className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedArticles.has(article.id)}
                      onChange={() => toggleArticleSelection(article.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {translation?.title || article.slug}
                        </span>
                        {getStatusBadge(article.status)}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {topic?.title && `Topic: ${topic.title} • `}
                        {article.slug} • {article.article_type}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Updated: {new Date(article.updated_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => regenerateArticle(article.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteArticle(article.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= total}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
