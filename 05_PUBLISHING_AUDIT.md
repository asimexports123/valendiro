# 05 — Publishing Audit

**Question:** Why are quality pages not publishing consistently?  
**Constraint:** Do NOT redesign the pipeline. Diagnose with evidence.

---

## Executive Summary

Publishing **works mechanically** — Phase 3/5 proved render → publication → live page parity.  
Publishing **fails product-wise** because:

1. **Input quality is thin** (RSS/single-source excerpts, not full articles)  
2. **Quality gates block or warn but publish continues** on critical-short content  
3. **Catalog sprawl outruns editorial standards** (362 published, ~3% B or above)  
4. **Category imbalance** — tech auto-publishes; travel/health starved  
5. **Operational skips** — travel-planning had zero rebuild candidates  

**Publishing is consistent. Quality publishing is not.**

---

## Funnel Evidence (Best Available Metrics)

| Stage | Rate (estimated) | Evidence |
|-------|------------------|----------|
| RSS / sources ingested | Active cron | `/api/cron/discovery-pipeline` documented |
| KnowledgeAssets created | Unknown/day* | Pipeline active; no daily dashboard published |
| KnowledgeAssets → accepted | Partial | Many stuck pending/processing possible |
| Knowledge Packages assembled | Batch-limited (10) | `articlePipeline` BATCH_LIMIT = 10 |
| Packages passing quality | Low % | Most pages 1 min read despite gates |
| Rendered outputs | Tracks packages | Phase 3 parity confirmed |
| Published to live | High once rendered | Publication pipeline accepts markdown |
| Reader-quality publish | **~3%** | Product triage A+B tier |

*Requires production metrics dashboard — **currently a blind spot (P0 ops gap).**

---

## Category Publish Imbalance (Homepage Evidence)

| Category | Topics published | Subcategories | Problem |
|----------|-----------------|---------------|---------|
| Technology | **85** | 13 | Over-published vs depth |
| Business | **38** | 12 | Junk slugs (Strategy *) included |
| Personal Finance | **11** | 12 | Under-published |
| Home & Lifestyle | **10** | 12 | Under-published |
| Health | **6** | 12 | Severely under-published |
| Travel | **3** | 11 | **Effectively empty** |
| Education | **~0 visible** | 10 | Subcategories with no topics |

**Conclusion:** Pipeline publishes what's ingested. Ingestion favors tech RSS. Travel/health/education lack source throughput.

---

## Top Rejection / Skip Reasons (Evidence-Based)

| Reason | Source | Frequency | Product fix |
|--------|--------|-----------|-------------|
| **No candidates for reassembly** | Phase 5: travel-planning SKIP | Confirmed | Add multi-source assets for topic |
| **Article too short for meaningful content** | Composition Engine CRITICAL on health-insurance, business-process-automation, AIO pages | Every Phase 5 run | Raise publish gate; enrich package first |
| **Duplicate content blocks** | Phase 4 validation failures (pre-fix) | Historical; partial fix | Summary dedup in composition |
| **Thin fact count from single source** | articlePipeline passes 1 candidate | Systemic | Multi-source gather (Phase 5 wired, needs assets) |
| **Extraction pollution (HTML in facts)** | AIO page sample facts contain `<p>`, `</p>` | Observed in Phase 5 results | Reject at QA gate |
| **Internal artifact leak** | "Valendiro Knowledge Blueprint" in business-process-automation facts | Phase 5 after sample | Publish gate blocklist |
| **Wrong topic mapping** | production/discovery slug → home-renovation | Phase 5 | Editorial slug review |
| **Validation passed but product failed** | validationPassed: true + 1 min page | Systemic | Product quality bar ≠ engineering validation |

---

## Top Duplicate Reasons

| Reason | Evidence | Impact |
|--------|----------|--------|
| Same topic, discovery + production slug pair | production-how-i-get... + discovery-how-i-get... | 2 packages, same topic |
| Summary takeaways repeat body | index-funds, health-insurance pages | Reader distrust |
| Homepage sections repeat same 6 topics | Latest = Featured = Articles overlap | Feels low inventory |
| Semantic duplicate facts in large packages | Phase 5: 35 duplicates merged on AIO page | 344→356 facts, minimal gain |

---

## Why Quality Pages Don't Publish Consistently

### Root Cause 1: Validation ≠ Product Quality

Engineering validation checks: format, duplicates, HTML leaks, composition score.  
Product quality requires: depth, sources, examples, decision support.

**A page passes at quality score 45/100 and publishes.**  
Reader sees 1-minute page. CEO sees failure.

**Fix (product):** Publish gate on minimum word depth + sources visible + no CRITICAL composition flags.

---

### Root Cause 2: Single-Source Ingestion

Production `articlePipeline` historically processed **one asset per topic**.  
Multi-source merge exists but **needs multiple assets per topic**.

**Fix (ops):** Prioritize ingesting 2–3 sources per flagship before assemble.

---

### Root Cause 3: Publish Without Editorial Review

No human or product-owner gate between "validation passed" and live.

**Fix (process):** Flagship pages require checklist sign-off before publish.

---

### Root Cause 4: Throughput Optimized Over Quality

362 pages published. ~12 are good.  
System succeeded at **volume**, failed at **utility**.

**Fix (policy):** Freeze new publishes except flagship 50 waves.

---

## Publishing Throughput Targets (Product KPIs)

| Metric | Current est. | 30-day target | 90-day target |
|--------|-------------|---------------|---------------|
| Quality pages published / week | ~0 | 3–5 flagships | 5–8 flagships |
| Thin pages newly published / week | ~many | **0** | **0** |
| Publish rejection rate (product gate) | ~0% | 60% | 70% |
| Multi-source packages (flagship) | ~0% | 80% | 95% |
| Avg word count (new publishes) | ~300 | 1,500+ | 2,000+ |
| Pages with sources at publish | 0% | 100% | 100% |

---

## Recommended Publishing Policy (No Pipeline Redesign)

```
INGEST (existing) 
  → ASSEMBLE (existing)
  → ENGINEERING VALIDATION (existing)
  → **PRODUCT GATE (NEW PROCESS)**
       ✓ Flagship checklist
       ✓ Min depth by domain
       ✓ Sources present in package
       ✓ No CRITICAL composition flags
       ✓ No artifact/placeholder strings
       ✓ Human spot-check for YMYL
  → RENDER (existing)
  → PUBLISH (existing)
```

---

## Measurable Evidence Needed (Ops Dashboard — Not Architecture)

Track daily and review in CEO weekly:

| Metric | Why |
|--------|-----|
| RSS items received / day | Input health |
| KnowledgeAssets created / day | Ingest throughput |
| Assets by status (pending/accepted/error) | Bottleneck ID |
| Packages assembled / day | Assembly throughput |
| Packages rejected by reason | Top fix target |
| Renders / day | Projection throughput |
| Published / day | Output throughput |
| **Product gate rejected / day** | Quality enforcement |
| Avg word count at publish | Depth trend |
| % multi-source packages | Richness trend |

**Today these are not visible to the CEO. That itself is a publishing failure.**

---

*Next: `06_EXECUTION_PRIORITY.md`*
