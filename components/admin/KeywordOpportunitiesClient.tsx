"use client";

import { useState, useMemo, useCallback } from "react";
import type { KeywordDecisionRow } from "@/services/admin/dashboardData";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "approved" | "backlog" | "rejected" | "researching";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDecision(row: KeywordDecisionRow): string {
  return row.research?.decision ?? row.status ?? "unknown";
}

function getTabMatch(row: KeywordDecisionRow, tab: FilterTab): boolean {
  const d = getDecision(row);
  const s = row.status;
  if (tab === "all") return true;
  if (tab === "approved") return s === "approved" || d === "publish";
  if (tab === "backlog") return d === "backlog" || s === "pending";
  if (tab === "rejected") return s === "rejected" || d === "reject";
  if (tab === "researching") return !row.research;
  return true;
}

function scoreColor(score: number) {
  if (score >= 58) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 38) return "text-amber-600 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

function decisionBadgeClass(d: string) {
  const map: Record<string, string> = {
    publish:      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    approved:     "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    backlog:      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    pending:      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    reject:       "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    rejected:     "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    duplicate:    "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
    cannibalized: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  };
  return `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[d] ?? "bg-muted text-muted-foreground border-border"}`;
}

function intentBadgeClass(intent: string) {
  const map: Record<string, string> = {
    how_to:       "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    educational:  "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    informational:"bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    comparison:   "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    buying_guide: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    commercial:   "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    news:         "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    entertainment:"bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    blocked:      "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };
  return `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${map[intent] ?? "bg-muted text-muted-foreground"}`;
}

function ScoreBar({ value, invert = false }: { value: number; invert?: boolean }) {
  const effective = invert ? 100 - value : value;
  const color = effective >= 58 ? "bg-emerald-500" : effective >= 38 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground w-6 text-right shrink-0">{value}</span>
    </div>
  );
}

// ─── Side Panel ───────────────────────────────────────────────────────────────

function SidePanel({ row, onClose }: { row: KeywordDecisionRow; onClose: () => void }) {
  const r = row.research;
  const decision = getDecision(row);
  const finalScore = r?.finalDecisionScore ?? row.opportunity_score ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/20 dark:bg-black/50" />
      {/* Panel */}
      <div
        className="w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/60 sticky top-0 bg-card z-10">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Keyword</p>
            <h2 className="text-base font-bold text-foreground leading-snug break-words">{row.keyword}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-0.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 flex-1">
          {/* Decision + score */}
          <div className="flex items-center gap-3">
            <span className={decisionBadgeClass(decision)}>{decision}</span>
            <span className={`text-2xl font-bold tabular-nums ${scoreColor(finalScore)}`}>{finalScore}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>

          {/* Decision reason */}
          {(r?.decisionReason || row.rejection_reason) && (
            <div className="rounded-xl bg-muted/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Decision Reason</p>
              <p className="text-sm text-foreground leading-relaxed">{r?.decisionReason ?? row.rejection_reason}</p>
              {r && (r.newsPenalty > 0 || r.celebrityPenalty > 0 || r.localPenalty > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.newsPenalty > 0 && <span className="rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 px-2 py-0.5 text-[10px] font-medium">news penalty −{r.newsPenalty}</span>}
                  {r.celebrityPenalty > 0 && <span className="rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 px-2 py-0.5 text-[10px] font-medium">celebrity −{r.celebrityPenalty}</span>}
                  {r.localPenalty > 0 && <span className="rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 px-2 py-0.5 text-[10px] font-medium">local −{r.localPenalty}</span>}
                </div>
              )}
            </div>
          )}

          {r ? (
            <>
              {/* Classification */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Classification</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Intent</span>
                    <span className={intentBadgeClass(r.searchIntent)}>{r.searchIntent.replace(/_/g, " ")}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Category</span>
                    <span className={`text-xs font-medium ${r.categoryInScope ? "text-foreground" : "text-muted-foreground italic"}`}>
                      {r.categoryLabel}
                      {!r.categoryInScope && <span className="ml-1 text-amber-600">(out of scope)</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Entity</span>
                    <span className="text-xs text-foreground">{r.detectedEntity ?? <span className="italic text-muted-foreground">unresolved</span>}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Confidence</span>
                    <span className={`text-xs font-semibold ${r.entityConfidence === "high" ? "text-emerald-600" : r.entityConfidence === "medium" ? "text-amber-600" : "text-rose-500"}`}>
                      {r.entityConfidence}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score breakdown */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Score Breakdown</p>
                <div className="space-y-2">
                  {[
                    { label: "Search Demand",     value: r.searchDemandScore },
                    { label: "Ranking Opportunity",value: r.rankingOpportunityScore },
                    { label: "Evergreen",          value: r.evergreenScore },
                    { label: "Business Value",     value: r.businessValueScore },
                    { label: "Knowledge Gap",      value: r.knowledgeGapScore },
                    { label: "Category Fit",       value: r.categoryFitScore },
                    { label: "Entity Confidence",  value: r.entityConfidenceScore },
                  ].map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <ScoreBar value={value} />
                    </div>
                  ))}
                  <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                    <span className="text-xs text-muted-foreground">Competition</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ScoreBar value={r.competitionScore} invert />
                      <span className="text-[10px] text-muted-foreground shrink-0">({r.competitionLevel})</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-muted/50 px-4 py-5 text-center">
              <p className="text-sm text-muted-foreground">No research data available yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Run the keyword research pipeline to analyse this keyword.</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground">
              Discovered {new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "approved",    label: "Approved" },
  { key: "backlog",     label: "Backlog" },
  { key: "rejected",    label: "Rejected" },
  { key: "researching", label: "Researching" },
];

export function KeywordOpportunitiesClient({ rows }: { rows: KeywordDecisionRow[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openRow, setOpenRow] = useState<KeywordDecisionRow | null>(null);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = { all: rows.length, approved: 0, backlog: 0, rejected: 0, researching: 0 };
    for (const row of rows) {
      if (getTabMatch(row, "approved"))    counts.approved++;
      if (getTabMatch(row, "backlog"))     counts.backlog++;
      if (getTabMatch(row, "rejected"))    counts.rejected++;
      if (getTabMatch(row, "researching")) counts.researching++;
    }
    return counts;
  }, [rows]);

  // Filtered rows
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!getTabMatch(row, activeTab)) return false;
      if (q && !row.keyword.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, activeTab, search]);

  // Bulk select helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }, [allFilteredSelected, filtered]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <>
      {/* Search + Filters bar */}
      <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keywords…"
              className="w-full rounded-xl border border-border/60 bg-muted/40 pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 tabular-nums ${activeTab === tab.key ? "opacity-80" : "opacity-60"}`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="sm:ml-auto shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {filtered.length} of {rows.length}
          </div>
        </div>

        {/* Bulk actions bar */}
        {someSelected && (
          <div className="px-4 py-2 bg-primary/5 border-b border-border/60 flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                Approve
              </button>
              <button className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                Move to Backlog
              </button>
              <button className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
                Reject
              </button>
            </div>
            <button onClick={clearSelection} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary"
                    title="Select all visible"
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Keyword</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Intent</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-28">Opportunity</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-28">Evergreen</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-28">Biz Value</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((row) => {
                const r = row.research;
                const finalScore = r?.finalDecisionScore ?? row.opportunity_score ?? 0;
                const decision = getDecision(row);
                const isSelected = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors cursor-pointer ${isSelected ? "bg-primary/5" : "hover:bg-muted/20"}`}
                  >
                    <td className="px-3 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(row.id)}
                        className="rounded border-border accent-primary"
                      />
                    </td>
                    <td
                      className="px-3 py-2.5 font-medium text-foreground max-w-[200px]"
                      onClick={() => setOpenRow(row)}
                    >
                      <span className="block truncate hover:text-primary transition-colors" title={row.keyword}>
                        {row.keyword}
                      </span>
                    </td>
                    <td className="px-3 py-2.5" onClick={() => setOpenRow(row)}>
                      {r ? (
                        <span className={intentBadgeClass(r.searchIntent)}>
                          {r.searchIntent.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-[130px]" onClick={() => setOpenRow(row)}>
                      {r ? (
                        <span className={`text-xs font-medium truncate block ${r.categoryInScope ? "text-foreground" : "text-muted-foreground italic"}`}>
                          {r.categoryLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 w-28" onClick={() => setOpenRow(row)}>
                      {r ? <ScoreBar value={r.rankingOpportunityScore} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 w-28" onClick={() => setOpenRow(row)}>
                      {r ? <ScoreBar value={r.evergreenScore} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 w-28" onClick={() => setOpenRow(row)}>
                      {r ? <ScoreBar value={r.businessValueScore} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center" onClick={() => setOpenRow(row)}>
                      <span className={`text-sm font-bold tabular-nums ${scoreColor(finalScore)}`}>
                        {finalScore}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center" onClick={() => setOpenRow(row)}>
                      <span className={decisionBadgeClass(decision)}>{decision}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {rows.length === 0
                      ? "No keyword research data yet. Run the pipeline to populate Content Opportunities."
                      : `No keywords match "${search || activeTab}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side panel */}
      {openRow && <SidePanel row={openRow} onClose={() => setOpenRow(null)} />}
    </>
  );
}
