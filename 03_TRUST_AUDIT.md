# 03 — Trust Audit

**Scope:** All 50 Flagship Library topics + site-wide trust infrastructure  
**Standard:** Healthline trust × NerdWallet practicality × Wikipedia sourcing

---

## Executive Trust Verdict

**Current trust score: 22/100**

Valendiro **claims** trust on homepage and About page. Valendiro **does not demonstrate** trust on topic pages. For YMYL (finance, health), this is a **launch blocker**.

---

## Site-Wide Trust: What's Missing

| Element | Status | Impact |
|---------|--------|--------|
| Visible source citations per page | ❌ Missing | Critical |
| Author or editorial team | ❌ Missing | Critical |
| "Last reviewed" date (separate from updated) | ❌ Missing | High |
| Methodology page ("How we verify") | ❌ Missing | High |
| Correction / feedback mechanism | ❌ Missing | High |
| Expert review badge (YMYL) | ❌ Missing | Critical for health/finance |
| Conflict of interest disclosure | ❌ Missing | Medium |
| Build timestamp in footer | ❌ Present (damages trust) | Medium |
| "Expert-reviewed" claim without proof | ❌ Misleading | Critical |
| Fact-checking process described | ❌ Missing | High |
| Confidence indicators | ❌ Backend only | Medium |

---

## Per-Flagship Trust Question

> **Why should a reader trust this?**

### Finance flagships (index-funds, retirement, credit, etc.)

**Currently missing:**
1. Linked sources (SEC, Bogleheads, provider official pages)
2. Disclaimer ("not financial advice; consult advisor")
3. Date facts were verified
4. Named reviewer or "reviewed against [source]"
5. Comparison data with attribution
6. No promotional language
7. Clear distinction fact vs opinion

**Why reader shouldn't trust today:** Anonymous, unsourced, 1-minute page making authoritative-sounding claims about money.

**Target trust statement:**  
*"Every fact links to a primary source. Reviewed [date]. Not financial advice."*

---

### Health flagships (health-insurance, mental-health, nutrition, etc.)

**Currently missing:**
1. Medical disclaimer
2. Sources (CDC, WHO, Healthcare.gov)
3. "When to see a doctor" escalation boxes
4. Expert review (RN, MD, or certified health editor)
5. Date sensitivity (plans change annually)
6. No dangerous oversimplification flags

**Why reader shouldn't trust today:** YMYL content without credentials = liability + bounce.

**Target trust statement:**  
*"Health content reviewed for accuracy [date]. Not a substitute for professional medical advice."*

---

### Technology flagships (javascript, react, git, etc.)

**Currently missing:**
1. Links to MDN, official docs, RFCs
2. Version/date for API behavior ("Tested with Node 20.x")
3. Code examples that readers can verify
4. Correction history for breaking changes

**Why reader shouldn't trust today:** Could be outdated or AI-generated — no way to verify.

**Target trust statement:**  
*"Examples tested against [version]. Primary source: MDN / official docs."*

---

### Business flagships

**Currently missing:**
1. Case study attribution
2. Framework sources (Porter, etc.)
3. Distinguish opinion from established practice

---

### Travel flagships

**Currently missing:**
1. Date-stamped pricing/visa info
2. Government travel advisory links
3. "Verify before booking" disclaimers

---

## Trust Audit by Flagship (Summary Table)

| Topic | Can trust for decisions? | Missing #1 | Missing #2 | Missing #3 |
|-------|-------------------------|------------|------------|------------|
| index-funds | No | Sources | Comparison data | Disclaimer |
| health-insurance | No | Sources | HMO/PPO table | Medical disclaimer |
| javascript-fundamentals | Partial | MDN links | Code verify | Version date |
| nodejs-cluster | Partial | Official Node docs link | Code samples | Version date |
| git-version-control | Partial | Git docs link | Command examples | — |
| business-process-automation | No | Tool sources | Internal artifact leak | — |
| travel-planning | No | No content | Sources | — |
| strategy-seo | **Actively distrust** | Everything | Junk slug | Featured on homepage |

---

## Trust Implementation Priority (Product, Not Architecture)

| Priority | Action | Reader-visible? | Effort |
|----------|--------|-----------------|--------|
| P0 | Sources block on every flagship page | Yes | M |
| P0 | Remove false "expert-reviewed" until real | Yes | S |
| P0 | Remove footer build timestamp | Yes | S |
| P0 | YMYL disclaimer blocks (finance + health) | Yes | S |
| P1 | Editorial standards page | Yes | S |
| P1 | "Last reviewed" field displayed | Yes | M |
| P1 | "Report an error" link per page | Yes | S |
| P2 | Named editorial team | Yes | S |
| P2 | Confidence/corroboration badge | Yes | M |
| P3 | Expert reviewer program | Yes | L |

---

## Trust KPIs (Track Weekly)

| Metric | Baseline | 30-day target | 90-day target |
|--------|----------|---------------|---------------|
| Flagship pages with visible sources | ~0% | 100% | 100% |
| "Would you trust for important decision?" (survey) | Unknown | 40% | 60% |
| Error reports per 1,000 views | 0 (no mechanism) | Track | ↓ |
| YMYL pages with disclaimer | 0% | 100% | 100% |

---

## Competitor Trust Benchmark

| Platform | What they do better |
|----------|---------------------|
| **Wikipedia** | Every claim has citation footnote |
| **Healthline** | Medical review badge + named reviewers |
| **NerdWallet** | Methodology + "how we make money" |
| **Investopedia** | Author bios + editorial policy |
| **MDN** | Community + browser vendor backing |

**Valendiro must match citation visibility before claiming "trusted knowledge platform."**

---

*Next: `04_NAVIGATION_AUDIT.md`*
