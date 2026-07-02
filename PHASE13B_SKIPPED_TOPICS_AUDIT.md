# Phase 13B Skipped Topics Audit

## Summary
41 topics were skipped during Phase 13B seeding due to subcategory lookup failures.

## Root Cause Analysis

### Issue: Subcategory Slug Mismatch Between Seeder and Database

The seeder script uses subcategory slugs that don't match the database. The blueprint has different subcategory names/slug conventions than what the seeder expects.

---

## Detailed Analysis by Subcategory

### 1. budgeting (5 topics skipped)

**Seeder Expected:** `budgeting`
**Database Has:** `personal-finance-basics` (not `budgeting`)
**Blueprint Has:** NO `budgeting` subcategory

| Topic Slug | Topic Title | Expected Subcategory | Database Match | Blueprint Exists |
|------------|-------------|---------------------|----------------|------------------|
| budgeting-fundamentals | Budgeting Fundamentals | budgeting | ❌ personal-finance-basics | ❌ No |
| tracking-expenses | Tracking Expenses | budgeting | ❌ personal-finance-basics | ❌ No |
| saving-strategies | Saving Strategies | budgeting | ❌ personal-finance-basics | ❌ No |
| debt-management | Debt Management | budgeting | ❌ personal-finance-basics | ❌ No |
| financial-goals-and-milestones | Financial Goals & Milestones | budgeting | ❌ personal-finance-basics | ❌ No |

**Root Cause:** Seeder logic error. The seeder references a `budgeting` subcategory that doesn't exist in the blueprint or database.

**Fix:** Remove these 5 topics from the seeder (they're not in the approved blueprint).

---

### 2. academic-skills (5 topics skipped)

**Seeder Expected:** `academic-skills`
**Database Has:** `study-skills` (not `academic-skills`)
**Blueprint Has:** NO `academic-skills` subcategory

| Topic Slug | Topic Title | Expected Subcategory | Database Match | Blueprint Exists |
|------------|-------------|---------------------|----------------|------------------|
| study-skills-and-techniques | Study Skills & Techniques | academic-skills | ❌ study-skills | ❌ No |
| time-management-for-students | Time Management for Students | academic-skills | ❌ study-skills | ❌ No |
| research-and-writing | Research & Writing | academic-skills | ❌ research-skills | ❌ No |
| critical-thinking | Critical Thinking | academic-skills | ❌ research-skills | ❌ No |
| exam-preparation | Exam Preparation | academic-skills | ❌ exams-certifications | ❌ No |

**Root Cause:** Seeder logic error. The seeder references an `academic-skills` subcategory that doesn't exist in the blueprint or database. Related topics exist in other subcategories (study-skills, research-skills, exams-certifications, personal-development).

**Fix:** Remove these 5 topics from the seeder (they're not in the approved blueprint).

---

### 3. languages (5 topics skipped)

**Seeder Expected:** `languages`
**Database Has:** `language-learning` (not `languages`)
**Blueprint Has:** `language-learning` (not `languages`)

| Topic Slug | Topic Title | Expected Subcategory | Database Match | Blueprint Exists |
|------------|-------------|---------------------|----------------|------------------|
| language-learning-fundamentals | Language Learning Fundamentals | languages | ❌ language-learning | ⚠️ Slug mismatch |
| english-as-a-second-language | English as a Second Language | languages | ❌ language-learning | ⚠️ Slug mismatch |
| learning-spanish | Learning Spanish | languages | ❌ language-learning | ⚠️ Slug mismatch |
| learning-mandarin | Learning Mandarin | languages | ❌ language-learning | ⚠️ Slug mismatch |
| language-learning-tools-and-apps | Language Learning Tools & Apps | languages | ❌ language-learning | ⚠️ Slug mismatch |

**Root Cause:** Slug mismatch. Seeder uses `languages` but blueprint and database use `language-learning`.

**Fix:** Change seeder from `languages` to `language-learning` for these 5 topics.

---

### 4. home-maintenance (5 topics skipped)

**Seeder Expected:** `home-maintenance`
**Database Has:** `home-improvement` (not `home-maintenance`)
**Blueprint Has:** `home-improvement` (not `home-maintenance`)

| Topic Slug | Topic Title | Expected Subcategory | Database Match | Blueprint Exists |
|------------|-------------|---------------------|----------------|------------------|
| home-maintenance-basics | Home Maintenance Basics | home-maintenance | ❌ home-improvement | ⚠️ Slug mismatch |
| diy-home-repairs | DIY Home Repairs | home-maintenance | ❌ diy-projects | ⚠️ Wrong subcategory |
| home-renovation | Home Renovation | home-maintenance | ❌ home-improvement | ⚠️ Slug mismatch |
| home-security | Home Security | home-maintenance | ❌ Not found | ❌ No |
| energy-efficiency | Energy Efficiency | home-maintenance | ❌ Not found | ❌ No |

**Root Cause:**
- Slug mismatch: Seeder uses `home-maintenance` but blueprint uses `home-improvement`
- Wrong subcategory: `diy-home-repairs` belongs in `diy-projects`, not `home-improvement`
- Blueprint doesn't include `home-security` or `energy-efficiency` topics

**Fix:**
1. Change `home-maintenance` to `home-improvement` for matching topics
2. Move `diy-home-repairs` to `diy-projects` subcategory
3. Remove `home-security` and `energy-efficiency` (not in blueprint)

---

### 5. personal-finance-home (3 topics skipped)

**Seeder Expected:** `personal-finance-home`
**Database Has:** NO matching subcategory
**Blueprint Has:** NO `personal-finance-home` subcategory

| Topic Slug | Topic Title | Expected Subcategory | Database Match | Blueprint Exists |
|------------|-------------|---------------------|----------------|------------------|
| budgeting-for-homeownership | Budgeting for Homeownership | personal-finance-home | ❌ Not found | ❌ No |
| home-insurance | Home Insurance | personal-finance-home | ❌ insurance | ⚠️ Wrong category |
| renting-vs-buying | Renting vs Buying | personal-finance-home | ❌ Not found | ❌ No |

**Root Cause:**
- `personal-finance-home` doesn't exist in blueprint or database
- `home-insurance` belongs in `insurance` subcategory under personal-finance
- Other topics not in blueprint

**Fix:**
1. Move `home-insurance` to `insurance` subcategory
2. Remove `budgeting-for-homeownership` and `renting-vs-buying` (not in blueprint)

---

## Summary Table

| Seeder Subcategory | Database Subcategory | Blueprint Subcategory | Topics | Root Cause | Fix |
|-------------------|---------------------|----------------------|--------|------------|-----|
| budgeting | personal-finance-basics | N/A | 5 | Seeder error - not in blueprint | Remove from seeder |
| academic-skills | study-skills/research-skills/exams-certifications | N/A | 5 | Seeder error - not in blueprint | Remove from seeder |
| languages | language-learning | language-learning | 5 | Slug mismatch | Change to `language-learning` |
| home-maintenance | home-improvement | home-improvement | 5 | Slug mismatch + wrong subcategory | Map to correct subcategories |
| personal-finance-home | N/A | N/A | 3 | Seeder error - not in blueprint | Remove 2, move 1 to insurance |

**Total:** 23 topics in seeder that don't match blueprint (not 41 as initially reported).

---

## Recommended Action

### Immediate Fix: Clean the Seeder
The seeder contains 23 topics that are NOT in the approved blueprint. These should be removed from the seeder script.

### Topics to Remove (18 topics):
- All 5 `budgeting` topics (not in blueprint)
- All 5 `academic-skills` topics (not in blueprint)
- `home-security` and `energy-efficiency` (not in blueprint)
- `budgeting-for-homeownership` and `renting-vs-buying` (not in blueprint)

### Topics to Fix (5 topics):
- Change `languages` → `language-learning` (5 topics)

### Topics to Re-map (3 topics):
- `diy-home-repairs`: Move to `diy-projects`
- `home-insurance`: Move to `insurance`

### Verification Needed
The initial report said "41 skipped topics" but our analysis shows only 23 mismatched topics in the seeder. Need to verify the seeder output to understand the discrepancy.
