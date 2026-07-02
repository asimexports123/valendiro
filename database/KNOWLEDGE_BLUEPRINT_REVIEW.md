# KNOWLEDGE BLUEPRINT REVIEW
# Valendiro Knowledge Graph — Phase 13A
# Status: PENDING APPROVAL — No database changes until approved
# Generated: 2026-07-02
# This document is split across 4 parts for manageability.
# See: BLUEPRINT_REVIEW_PART2.md, PART3.md, PART4.md

---

## EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Categories reviewed | 7 |
| Subcategories reviewed | 60 |
| Total topics proposed | 306 |
| Exact duplicate slugs | **0** |
| Near-duplicate concepts | **11 pairs** |
| Critical issues (blocking) | **6** |
| Recommended additions | **14** |
| Subcategories with weak beginner coverage | 6 |
| Overall blueprint quality | **STRONG — conditionally approved pending 6 critical fixes** |

---

## CRITICAL ISSUES — Must resolve before seeding

| # | Issue | Fix |
|---|---|---|
| **C1** | `operations-management` (management subcategory) has near-identical reader outcome to `operations-fundamentals` (operations subcategory) | Narrow `operations-management` scope to: *a manager's view of team throughput and process KPIs* — not the operations function itself |
| **C2** | `preventive-health` (healthy-lifestyle) duplicates the entire `preventive-care` subcategory | **Remove** `preventive-health` from healthy-lifestyle. Cross-link to preventive-care subcategory instead |
| **C3** | `tax-efficient-investing` (mutual-funds) has identical reader outcome to `investment-taxes` (taxes) | Narrow to mutual-fund-specific mechanics only: capital gains distributions, turnover ratios, wash-sale in fund context |
| **C4** | `index-funds` (mutual-funds) vs `index-etfs` (etfs) — near-identical reader outcomes | Both kept. Subtitles and content must explicitly distinguish: ETFs trade intraday at market price; mutual funds price at end-of-day NAV. Tax treatment and minimum investment also differ |
| **C5** | `health-before-travel` (travel-safety) mentions travel insurance, duplicating `travel-insurance` (same subcategory) | Scope `health-before-travel` strictly to vaccinations, travel medicine, and medical prep only. Remove all insurance content |
| **C6** | DevOps path jumps from CI/CD directly to Kubernetes — missing Docker/containerization entirely | **Add** `containerization-with-docker` at position 3 in the devops path, before Kubernetes |

---

## RECOMMENDED ADDITIONS — Not blocking, but improve coverage

| Subcategory | Topic to Add | Slug | Reason |
|---|---|---|---|
| artificial-intelligence | Using AI APIs & Tools | `using-ai-apis-and-tools` | Path is academic without a practical "build with AI" topic |
| cloud-computing | Choosing a Cloud Platform | `choosing-a-cloud-platform` | Beginners have no basis to choose AWS vs GCP vs Azure without this |
| cloud-computing | Cloud Cost Management | `cloud-cost-management` | Cost surprises are the #1 cloud operations mistake |
| cybersecurity | Threat Modeling | `threat-modeling` | Core practical skill between fundamentals and specific attack types |
| networking | Network Troubleshooting | `network-troubleshooting` | ping, traceroute, Wireshark — practical applied topic |
| leadership | Emotional Intelligence | `emotional-intelligence` | EQ is foundational to every other leadership topic |
| e-commerce | E-Commerce Marketing | `e-commerce-marketing` | No traffic acquisition = incomplete store operating path |
| insurance | Disability Insurance | `disability-insurance` | Most underowned insurance; statistically more likely than death for workers |
| language-learning | Reading & Listening Skills | `reading-and-listening-in-a-new-language` | Two of four core language skills absent from path |
| diseases-conditions | Mental Health Conditions | `mental-health-conditions` | As prevalent as heart disease; notable omission |
| alternative-medicine | Supplements & Vitamins | `supplements-and-vitamins` | Most-used CAM category; completely absent |
| hardware-iot | IoT Security | `iot-security` | IoT devices are notoriously insecure; critical practical gap |
| startups | Go-to-Market Strategy | `go-to-market-strategy` | How a startup finds first customers — missing from founding journey |
| customer-service | Customer Service Metrics | `customer-service-metrics` | CSAT, NPS, CES — no measurement = no feedback loop |

---

## DUPLICATE ANALYSIS

### Exact Duplicate Slugs
**Result: 0.** All 306 proposed slugs are unique and do not collide with the 42 existing published topic slugs in the database.

### Near-Duplicate Concept Pairs (full list)

| Pair | Topic A | Topic B | Status |
|---|---|---|---|
| 1 | `operations-management` (management) | `operations-fundamentals` (operations) | ⛔ Critical C1 |
| 2 | `preventive-health` (healthy-lifestyle) | `preventive-care-fundamentals` (preventive-care) | ⛔ Critical C2 — remove |
| 3 | `tax-efficient-investing` (mutual-funds) | `investment-taxes` (taxes) | ⛔ Critical C3 — narrow |
| 4 | `index-funds` (mutual-funds) | `index-etfs` (etfs) | ⚠️ C4 — differentiate |
| 5 | `work-life-balance` (healthy-lifestyle) | `stress-management` (healthy-lifestyle) | ⚠️ Same subcategory — stress = physiology; work-life = structural boundary design |
| 6 | `travel-insurance` / `health-before-travel` | Both in travel-safety | ⛔ Critical C5 — scope fix |
| 7 | `hr-fundamentals` | `management-fundamentals` | ✅ Distinct — HR = function/compliance; management = directing people |
| 8 | `sales-fundamentals` | `customer-success` | ✅ Distinct — sales = pre-close; CS = post-sale |
| 9 | `certification-roadmaps` | `professional-certifications` | ✅ Distinct — what/why vs how/sequence |
| 10 | `online-teaching` (teaching) | online-learning subcategory | ✅ Distinct — educator vs student perspective |
| 11 | `healthy-habits` (healthy-lifestyle) | `habit-formation` (personal-development) | ⚠️ Acceptable — health domain vs behavioral science |

### Cross-Category Boundary Decisions

| Topic | Primary Subcategory | Cross-links To |
|---|---|---|
| `change-management` | leadership | management |
| `decision-making` | leadership | business-strategy |
| `estate-planning-basics` | retirement-planning | taxes, insurance |
| `market-cycles-and-psychology` | stock-market | existing investing subcategory |
| `online-teaching` | teaching | existing online-learning subcategory |
| `healthy-habits` | healthy-lifestyle | preventive-care |
| `ground-transportation` | transportation | existing travel-planning subcategory |
| `destination-research` | destinations | existing travel-planning subcategory |

---

## KNOWLEDGE GRAPH INTEGRITY

- ✅ Every topic belongs to exactly one primary subcategory
- ✅ No orphan topics (all have parent subcategory)
- ✅ No circular parent-child relationships
- ⚠️ 6 cross-subcategory near-duplicates require scope fixes (C1–C5 above)
- ✅ Learning order is logical in 56 of 60 subcategories
- ⚠️ 4 subcategories have ordering issues noted in Part 2–4 reviews:
  - `higher-education`: `academic-success` should be position 4, not 5
  - `loans-mortgages`: debt fundamentals primer missing at position 1
  - `diy-projects`: `diy-tools-and-safety` should be position 1, not position 5
  - `cloud-computing`: platform-selection topic needed before AWS/GCP/Azure

---

*Continued in BLUEPRINT_REVIEW_PART2.md (Technology + Business subcategory reviews)*
*Continued in BLUEPRINT_REVIEW_PART3.md (Personal Finance + Education subcategory reviews)*
*Continued in BLUEPRINT_REVIEW_PART4.md (Health & Wellness + Home & Lifestyle + Travel subcategory reviews)*
