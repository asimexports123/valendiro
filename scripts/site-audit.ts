#!/usr/bin/env npx tsx
/**
 * scripts/site-audit.ts
 *
 * Standalone site integrity audit. Calls the deployed /api/admin/site-audit
 * endpoint and prints a human-readable report to stdout.
 *
 * Usage:
 *   npx tsx scripts/site-audit.ts                     # uses NEXT_PUBLIC_SITE_URL
 *   SITE_URL=https://valendiro.com npx tsx scripts/site-audit.ts
 *
 * Exit codes:
 *   0  — all routes OK
 *   1  — one or more broken routes detected
 *
 * Set AUDIT_SECRET env var to authenticate as CI (no session cookie needed).
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
dotenv.config({ path: ".env.local" });

const SITE_URL = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://valendiro.com"
).replace(/\/$/, "");

const AUDIT_SECRET = process.env.AUDIT_SECRET ?? "";
const AUDIT_URL = `${SITE_URL}/api/admin/site-audit`;

// ─── Colours ──────────────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold:  "\x1b[1m",
  green: "\x1b[32m",
  red:   "\x1b[31m",
  yellow:"\x1b[33m",
  cyan:  "\x1b[36m",
  dim:   "\x1b[2m",
};

function green(s: string) { return `${C.green}${s}${C.reset}`; }
function red(s: string)   { return `${C.red}${s}${C.reset}`; }
function yellow(s: string){ return `${C.yellow}${s}${C.reset}`; }
function bold(s: string)  { return `${C.bold}${s}${C.reset}`; }
function dim(s: string)   { return `${C.dim}${s}${C.reset}`; }
function cyan(s: string)  { return `${C.cyan}${s}${C.reset}`; }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log(bold("  Valendiro Site Integrity Audit"));
  console.log(dim(`  Target: ${AUDIT_URL}`));
  console.log(dim(`  ${new Date().toISOString()}`));
  console.log("");

  let report: any;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (AUDIT_SECRET) headers["x-audit-secret"] = AUDIT_SECRET;

    const res = await fetch(AUDIT_URL, { headers });
    if (res.status === 401) {
      console.error(red("  ✗ Unauthorized — set AUDIT_SECRET or run from an authenticated session"));
      process.exit(1);
    }
    if (!res.ok) {
      console.error(red(`  ✗ Audit endpoint returned HTTP ${res.status}`));
      process.exit(1);
    }
    report = await res.json();
  } catch (err: any) {
    console.error(red(`  ✗ Failed to reach audit endpoint: ${err?.message ?? err}`));
    process.exit(1);
  }

  const s = report.summary;

  // ── Summary table ────────────────────────────────────────────────────────────
  console.log(bold("  ── Summary ──────────────────────────────────────────────"));
  console.log(`  Total URLs tested : ${bold(String(s.total_urls_tested))}`);
  console.log(`  ${green("✓")} 200 OK          : ${green(String(s["200_ok"]))}`);
  console.log(`  → 3xx Redirect    : ${String(s["3xx_redirect"])}`);
  console.log(`  ${s["404_not_found"] > 0 ? red("✗") : "✓"} 404 Not Found   : ${s["404_not_found"] > 0 ? red(String(s["404_not_found"])) : "0"}`);
  console.log(`  ${s.other_errors > 0 ? yellow("!") : " "} Other errors    : ${s.other_errors > 0 ? yellow(String(s.other_errors)) : "0"}`);
  console.log(`  ${s.unreachable > 0 ? yellow("!") : " "} Unreachable     : ${s.unreachable > 0 ? yellow(String(s.unreachable)) : "0"}`);
  console.log(`  ${s.orphan_pages > 0 ? yellow("!") : " "} Orphan pages    : ${s.orphan_pages > 0 ? yellow(String(s.orphan_pages)) : "0"}`);
  console.log(`  ${s.broken_total > 0 ? red("✗") : green("✓")} Broken total    : ${s.broken_total > 0 ? red(String(s.broken_total)) : green("0")}`);
  console.log("");

  // ── By type table ────────────────────────────────────────────────────────────
  console.log(bold("  ── By Type ──────────────────────────────────────────────"));
  const bt = report.by_type;
  const types = ["static", "nav", "footer", "categories", "collections", "topics", "articles", "sitemap"] as const;
  for (const t of types) {
    const g = bt[t];
    if (!g || g.total === 0) continue;
    const label = t.padEnd(12);
    const status = g.broken > 0 ? red(`${g.broken} broken`) : green("ok");
    console.log(`  ${cyan(label)}  ${g.ok}/${g.total} OK  ${status}`);
  }
  console.log("");

  // ── Broken routes ────────────────────────────────────────────────────────────
  if (report.broken_routes?.length > 0) {
    console.log(bold(red(`  ── Broken Routes (${report.broken_routes.length}) ─────────────────────────────`)));
    for (const r of report.broken_routes) {
      const http = r.http_status ? ` [HTTP ${r.http_status}]` : "";
      const db   = r.db_status && r.db_status !== "ok" ? ` [DB: ${r.db_status}]` : "";
      console.log(`  ${red("✗")} [${r.type}]${http}${db}`);
      console.log(`    ${dim(r.url)}`);
      if (r.reason) console.log(`    ${yellow("→")} ${r.reason}`);
    }
    console.log("");
  }

  // ── Orphan pages ─────────────────────────────────────────────────────────────
  if (report.orphan_pages?.length > 0) {
    console.log(bold(yellow(`  ── Orphan Pages (${report.orphan_pages.length}) ──────────────────────────────`)));
    for (const r of report.orphan_pages) {
      console.log(`  ${yellow("!")} [${r.type}] ${dim(r.url)}`);
      if (r.reason) console.log(`    ${dim("→")} ${r.reason}`);
    }
    console.log("");
  }

  // ── Save JSON report ─────────────────────────────────────────────────────────
  fs.writeFileSync("audit-report.json", JSON.stringify(report, null, 2));
  console.log(dim("  Report saved → audit-report.json"));
  console.log("");

  // ── Final verdict ────────────────────────────────────────────────────────────
  if (report.passed) {
    console.log(green(bold("  ✓ PASSED — No broken routes detected")));
  } else {
    console.log(red(bold(`  ✗ FAILED — ${s.broken_total} broken route(s) found`)));
  }
  console.log("");

  process.exit(report.passed ? 0 : 1);
}

main();
