/** Build downloadable Mission Control reports for CEO / AI review */

export type ReportPayload = {
  generatedAt: string;
  live: boolean;
  metrics: {
    topicsPublished: number;
    topicsDraft: number;
    topicsToday: number;
    packagesReady: number;
    packagesToday: number;
    entities: number;
    facts: number;
    citations: number;
    relationships: number;
    assetsPending: number;
    assetsAccepted: number;
    assetsError: number;
    assetsToday: number;
    renderedPublished: number;
    renderedToday: number;
    sourcesActive: number;
    sourcesPaused: number;
    queuePending: number;
    queueFailed: number;
    queueInProgress: number;
    qualityScore: number;
    qualityDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
      total: number;
    };
  };
  pipeline: { id: string; label: string; count: number; status: string }[];
  categories: { slug: string; name: string; topicCount: number; pct: number }[];
  sources: { id: string; name: string; status: string; type: string }[];
  thinTopics: { slug: string; title: string; words: number; factCount?: number }[];
  failedAssets: { id: string; title: string | null; reason: string | null; at: string }[];
  recentPublished: { slug: string; title: string; updatedAt: string }[];
  health: Record<string, string>;
  bottlenecks: { severity: string; title: string; why: string; action: string }[];
  activity: { type: string; message: string; at: string }[];
  ceoSummary: {
    headline: string;
    growthToday: { topics: number; packages: number; assets: number; publishedRenders: number };
    trustSignal: string;
    recommendedActions: { label: string; severity: string }[];
  };
  workers: {
    updateQueuePending: number;
    updateQueueRunning: number;
    updateQueueFailed: number;
    crons: { path: string; schedule: string; purpose: string }[];
  };
  trust: { citationCount: number; lastVerifiedPackages: number };
  seo: { note: string; topicsIndexedEstimate: number; available: boolean };
  revenue: { available: boolean; note: string };
};

function stamp(iso: string) {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function buildMissionControlMarkdown(data: ReportPayload): string {
  const m = data.metrics;
  const q = m.qualityDistribution;
  const lines: string[] = [];

  lines.push("# Valendiro Mission Control Report");
  lines.push("");
  lines.push(`- **Generated:** ${stamp(data.generatedAt)}`);
  lines.push(`- **Data source:** Production database (live=${data.live})`);
  lines.push(`- **Platform:** Valendiro Knowledge OS`);
  lines.push("");
  lines.push("> Paste this report into an AI assistant for operational analysis, prioritization, or action planning.");
  lines.push("");

  lines.push("## CEO Summary");
  lines.push("");
  lines.push(data.ceoSummary.headline);
  lines.push("");
  lines.push(`- Trust: ${data.ceoSummary.trustSignal}`);
  lines.push(
    `- Today: +${data.ceoSummary.growthToday.topics} topics, +${data.ceoSummary.growthToday.packages} packages, +${data.ceoSummary.growthToday.assets} assets, ${data.ceoSummary.growthToday.publishedRenders} publishes`
  );
  if (data.ceoSummary.recommendedActions.length) {
    lines.push("- Recommended actions:");
    for (const a of data.ceoSummary.recommendedActions) {
      lines.push(`  - [${a.severity}] ${a.label}`);
    }
  }
  lines.push("");

  lines.push("## Key Metrics");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|------:|");
  lines.push(`| Published topics | ${m.topicsPublished} (+${m.topicsToday} today) |`);
  lines.push(`| Draft topics | ${m.topicsDraft} |`);
  lines.push(`| Knowledge packages (ready) | ${m.packagesReady} (+${m.packagesToday} today) |`);
  lines.push(`| Entities | ${m.entities} |`);
  lines.push(`| Graph relationships | ${m.relationships} |`);
  lines.push(`| Facts | ${m.facts} |`);
  lines.push(`| Citations | ${m.citations} |`);
  lines.push(`| Published renders | ${m.renderedPublished} (+${m.renderedToday} today) |`);
  lines.push(`| Assets pending | ${m.assetsPending} |`);
  lines.push(`| Asset errors | ${m.assetsError} |`);
  lines.push(`| Active sources | ${m.sourcesActive} (${m.sourcesPaused} paused) |`);
  lines.push(`| Queue pending / running / failed | ${m.queuePending} / ${m.queueInProgress} / ${m.queueFailed} |`);
  lines.push(`| Quality score | ${m.qualityScore}/100 |`);
  lines.push("");

  lines.push("## Quality Distribution");
  lines.push("");
  lines.push(`- Excellent (30+ facts): ${q.excellent}`);
  lines.push(`- Good (15–29): ${q.good}`);
  lines.push(`- Average (5–14): ${q.average}`);
  lines.push(`- Poor (<5): ${q.poor}`);
  lines.push("");

  lines.push("## Pipeline");
  lines.push("");
  for (const stage of data.pipeline) {
    lines.push(`- **${stage.label}:** ${stage.count} (${stage.status})`);
  }
  lines.push("");

  if (data.bottlenecks.length) {
    lines.push("## Bottlenecks");
    lines.push("");
    for (const b of data.bottlenecks) {
      lines.push(`### [${b.severity.toUpperCase()}] ${b.title}`);
      lines.push(b.why);
      lines.push(`Action: ${b.action}`);
      lines.push("");
    }
  }

  if (data.categories.length) {
    lines.push("## Top Categories");
    lines.push("");
    for (const c of data.categories.slice(0, 10)) {
      lines.push(`- ${c.name}: ${c.topicCount} topics (${c.pct}%)`);
    }
    lines.push("");
  }

  if (data.thinTopics.length) {
    lines.push("## Weakest Topics (learning targets)");
    lines.push("");
    for (const t of data.thinTopics) {
      const strength =
        typeof t.factCount === "number" ? `${t.factCount} facts` : `${t.words} words (est.)`;
      lines.push(`- ${t.title} (\`${t.slug}\`): ${strength}`);
    }
    lines.push("");
  }

  if (data.sources.length) {
    lines.push("## Discovery Sources");
    lines.push("");
    for (const s of data.sources.slice(0, 15)) {
      lines.push(`- ${s.name} — ${s.status} (${s.type})`);
    }
    lines.push("");
  }

  lines.push("## System Health");
  lines.push("");
  for (const [key, value] of Object.entries(data.health)) {
    if (key.endsWith("Detail")) continue;
    const detail = data.health[`${key}Detail`] ?? "";
    lines.push(`- **${key}:** ${value}${detail ? ` — ${detail}` : ""}`);
  }
  lines.push("");

  lines.push("## Workers & Cron");
  lines.push("");
  lines.push(
    `- Queue: ${data.workers.updateQueuePending} pending, ${data.workers.updateQueueRunning} running, ${data.workers.updateQueueFailed} failed`
  );
  for (const c of data.workers.crons) {
    lines.push(`- ${c.purpose}: \`${c.path}\` (${c.schedule})`);
  }
  lines.push("");

  if (data.recentPublished.length) {
    lines.push("## Recently Updated Topics");
    lines.push("");
    for (const t of data.recentPublished.slice(0, 10)) {
      lines.push(`- ${t.title} (\`${t.slug}\`) — ${stamp(t.updatedAt)}`);
    }
    lines.push("");
  }

  if (data.activity.length) {
    lines.push("## Recent Activity");
    lines.push("");
    for (const a of data.activity.slice(0, 15)) {
      lines.push(`- [${a.type}] ${a.message} — ${stamp(a.at)}`);
    }
    lines.push("");
  }

  if (data.failedAssets.length) {
    lines.push("## Failed Assets");
    lines.push("");
    for (const f of data.failedAssets) {
      lines.push(`- ${f.title ?? f.id}: ${f.reason ?? "no reason recorded"} (${stamp(f.at)})`);
    }
    lines.push("");
  }

  lines.push("## Coverage Gaps (not wired)");
  lines.push("");
  lines.push(`- SEO / traffic: ${data.seo.available ? `~${data.seo.topicsIndexedEstimate} topics` : data.seo.note}`);
  lines.push(`- Revenue: ${data.revenue.available ? "connected" : data.revenue.note}`);
  lines.push(`- Citations in DB: ${data.trust.citationCount}; recently verified packages: ${data.trust.lastVerifiedPackages}`);
  lines.push("");
  lines.push("---");
  lines.push("*End of report — all counts from live production DB at generation time.*");

  return lines.join("\n");
}

export function buildMissionControlPlainText(data: ReportPayload): string {
  const m = data.metrics;
  const q = m.qualityDistribution;
  const lines: string[] = [];

  lines.push("VALENDIRO MISSION CONTROL REPORT");
  lines.push("=".repeat(40));
  lines.push(`Generated: ${stamp(data.generatedAt)}`);
  lines.push(`Data source: Production database (live=${data.live})`);
  lines.push("Platform: Valendiro Knowledge OS");
  lines.push("");
  lines.push("Paste this report into an AI assistant for operational analysis.");
  lines.push("");

  lines.push("CEO SUMMARY");
  lines.push("-".repeat(40));
  lines.push(data.ceoSummary.headline);
  lines.push(`Trust: ${data.ceoSummary.trustSignal}`);
  lines.push(
    `Today: +${data.ceoSummary.growthToday.topics} topics, +${data.ceoSummary.growthToday.packages} packages, +${data.ceoSummary.growthToday.assets} assets, ${data.ceoSummary.growthToday.publishedRenders} publishes`
  );
  for (const a of data.ceoSummary.recommendedActions) {
    lines.push(`  [${a.severity}] ${a.label}`);
  }
  lines.push("");

  lines.push("KEY METRICS");
  lines.push("-".repeat(40));
  lines.push(`Published topics: ${m.topicsPublished} (+${m.topicsToday} today)`);
  lines.push(`Draft topics: ${m.topicsDraft}`);
  lines.push(`Knowledge packages (ready): ${m.packagesReady} (+${m.packagesToday} today)`);
  lines.push(`Entities: ${m.entities}`);
  lines.push(`Graph relationships: ${m.relationships}`);
  lines.push(`Facts: ${m.facts}`);
  lines.push(`Citations: ${m.citations}`);
  lines.push(`Published renders: ${m.renderedPublished} (+${m.renderedToday} today)`);
  lines.push(`Assets pending: ${m.assetsPending}`);
  lines.push(`Asset errors: ${m.assetsError}`);
  lines.push(`Active sources: ${m.sourcesActive} (${m.sourcesPaused} paused)`);
  lines.push(`Queue pending / running / failed: ${m.queuePending} / ${m.queueInProgress} / ${m.queueFailed}`);
  lines.push(`Quality score: ${m.qualityScore}/100`);
  lines.push("");

  lines.push("QUALITY DISTRIBUTION");
  lines.push("-".repeat(40));
  lines.push(`Excellent (30+ facts): ${q.excellent}`);
  lines.push(`Good (15-29): ${q.good}`);
  lines.push(`Average (5-14): ${q.average}`);
  lines.push(`Poor (<5): ${q.poor}`);
  lines.push("");

  lines.push("PIPELINE");
  lines.push("-".repeat(40));
  for (const stage of data.pipeline) {
    lines.push(`${stage.label}: ${stage.count} (${stage.status})`);
  }
  lines.push("");

  if (data.bottlenecks.length) {
    lines.push("BOTTLENECKS");
    lines.push("-".repeat(40));
    for (const b of data.bottlenecks) {
      lines.push(`[${b.severity.toUpperCase()}] ${b.title}`);
      lines.push(b.why);
      lines.push(`Action: ${b.action}`);
      lines.push("");
    }
  }

  if (data.categories.length) {
    lines.push("TOP CATEGORIES");
    lines.push("-".repeat(40));
    for (const c of data.categories.slice(0, 10)) {
      lines.push(`${c.name}: ${c.topicCount} topics (${c.pct}%)`);
    }
    lines.push("");
  }

  if (data.thinTopics.length) {
    lines.push("WEAKEST TOPICS (learning targets)");
    lines.push("-".repeat(40));
    for (const t of data.thinTopics) {
      const strength =
        typeof t.factCount === "number" ? `${t.factCount} facts` : `${t.words} words (est.)`;
      lines.push(`${t.title} (${t.slug}): ${strength}`);
    }
    lines.push("");
  }

  if (data.sources.length) {
    lines.push("DISCOVERY SOURCES");
    lines.push("-".repeat(40));
    for (const s of data.sources.slice(0, 15)) {
      lines.push(`${s.name} — ${s.status} (${s.type})`);
    }
    lines.push("");
  }

  lines.push("SYSTEM HEALTH");
  lines.push("-".repeat(40));
  for (const [key, value] of Object.entries(data.health)) {
    if (key.endsWith("Detail")) continue;
    const detail = data.health[`${key}Detail`] ?? "";
    lines.push(`${key}: ${value}${detail ? ` — ${detail}` : ""}`);
  }
  lines.push("");

  lines.push("WORKERS & CRON");
  lines.push("-".repeat(40));
  lines.push(
    `Queue: ${data.workers.updateQueuePending} pending, ${data.workers.updateQueueRunning} running, ${data.workers.updateQueueFailed} failed`
  );
  for (const c of data.workers.crons) {
    lines.push(`${c.purpose}: ${c.path} (${c.schedule})`);
  }
  lines.push("");

  if (data.recentPublished.length) {
    lines.push("RECENTLY UPDATED TOPICS");
    lines.push("-".repeat(40));
    for (const t of data.recentPublished.slice(0, 10)) {
      lines.push(`${t.title} (${t.slug}) — ${stamp(t.updatedAt)}`);
    }
    lines.push("");
  }

  if (data.activity.length) {
    lines.push("RECENT ACTIVITY");
    lines.push("-".repeat(40));
    for (const a of data.activity.slice(0, 15)) {
      lines.push(`[${a.type}] ${a.message} — ${stamp(a.at)}`);
    }
    lines.push("");
  }

  if (data.failedAssets.length) {
    lines.push("FAILED ASSETS");
    lines.push("-".repeat(40));
    for (const f of data.failedAssets) {
      lines.push(`${f.title ?? f.id}: ${f.reason ?? "no reason recorded"} (${stamp(f.at)})`);
    }
    lines.push("");
  }

  lines.push("COVERAGE GAPS (not wired)");
  lines.push("-".repeat(40));
  lines.push(`SEO / traffic: ${data.seo.available ? `~${data.seo.topicsIndexedEstimate} topics` : data.seo.note}`);
  lines.push(`Revenue: ${data.revenue.available ? "connected" : data.revenue.note}`);
  lines.push(
    `Citations in DB: ${data.trust.citationCount}; recently verified packages: ${data.trust.lastVerifiedPackages}`
  );
  lines.push("");
  lines.push("End of report — all counts from live production DB at generation time.");

  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type ReportFormat = "text" | "pdf" | "markdown" | "json";

function reportFilename(date: string, ext: string) {
  return `valendiro-mission-control-${date}.${ext}`;
}

export async function downloadMissionControlReport(
  data: ReportPayload,
  format: ReportFormat = "text"
) {
  const date = data.generatedAt.slice(0, 10);

  if (format === "json") {
    downloadFile(
      reportFilename(date, "json"),
      JSON.stringify(data, null, 2),
      "application/json"
    );
    return;
  }

  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 4.5;
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Valendiro Mission Control Report", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const body = buildMissionControlPlainText(data);
    const wrapped = doc.splitTextToSize(body, maxWidth);

    for (const line of wrapped) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }

    doc.save(reportFilename(date, "pdf"));
    return;
  }

  if (format === "markdown") {
    downloadFile(
      reportFilename(date, "md"),
      buildMissionControlMarkdown(data),
      "text/markdown;charset=utf-8"
    );
    return;
  }

  downloadFile(
    reportFilename(date, "txt"),
    buildMissionControlPlainText(data),
    "text/plain;charset=utf-8"
  );
}
