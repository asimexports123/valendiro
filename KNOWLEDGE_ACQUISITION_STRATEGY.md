# Knowledge Acquisition Strategy v1.0

**Document Version**: 1.0  
**Date**: July 4, 2026  
**Status**: ACTIVE  
**Purpose**: Permanent business policy governing how knowledge enters the Knowledge OS

---

## Executive Summary

This document defines the permanent business rules that govern how trusted knowledge enters the Knowledge OS. These rules protect the long-term quality, accuracy, and trustworthiness of Valendiro's knowledge base.

**Core Principle**: The system must prefer not publishing over publishing uncertain knowledge.

---

## Deliverable 1 – Source Trust Model

### Tier 1: Primary Authoritative Sources

**Definition**: Official, definitive sources that establish truth for their domain.

**Examples**:
- Official documentation (Python.org, MDN, W3C, ISO standards)
- Government publications (FDA, CDC, SEC, Federal Reserve)
- International standards bodies (IEEE, ISO, IETF)
- Official organizations (WHO, UN, OECD)
- Primary research publications (original peer-reviewed studies)

**Usage Rules**:
- **MAY BE USED**: As primary evidence for any claim
- **MAY BE USED**: As definitive resolution for conflicts
- **MUST BE CITED**: When used as primary evidence
- **CONFIDENCE**: Automatically assigned "Verified" confidence

**Never Use For**:
- Personal opinions or interpretations
- Unofficial derivatives
- Outdated versions (use latest official version only)

---

### Tier 2: Highly Trusted Secondary References

**Definition**: Educational institutions and peer-reviewed sources that synthesize primary sources.

**Examples**:
- University publications (MIT, Stanford, Oxford course materials)
- Major educational organizations (Khan Academy, Coursera university partners)
- Peer-reviewed journals (Nature, Science, ACM, IEEE journals)
- Academic textbooks from reputable publishers
- Government-affiliated research institutions

**Usage Rules**:
- **MAY BE USED**: As supporting evidence for claims
- **MAY BE USED**: When Tier 1 sources are unavailable but Tier 2 provides equivalent information
- **MUST BE CITED**: When used as evidence
- **CONFIDENCE**: Automatically assigned "High" confidence

**Never Use For**:
- Conflicts with Tier 1 sources (Tier 1 always wins)
- Controversial or disputed topics without Tier 1 support
- Medical or financial advice without Tier 1 backing

---

### Tier 3: Respected Educational Publishers

**Definition**: High-quality educational content from established publishers and industry leaders.

**Examples**:
- Well-maintained documentation (Stripe Docs, AWS Documentation, Google Cloud Docs)
- Industry leaders' official blogs (Google Engineering Blog, Netflix Tech Blog)
- High-quality tutorials (freeCodeCamp, Codecademy official content)
- Professional certification materials (AWS, Google Cloud, Microsoft)
- Established tech publications (O'Reilly, Apress, Manning books)

**Usage Rules**:
- **MAY BE USED**: For practical implementation guidance
- **MAY BE USED**: For best practices and industry standards
- **MUST BE CITED**: When used as evidence
- **REQUIRES**: Additional corroboration for controversial claims
- **CONFIDENCE**: Automatically assigned "Medium" confidence

**Never Use For**:
- Factual disputes without Tier 1 or Tier 2 support
- Medical, financial, or legal advice
- Scientific claims without academic backing

---

### Tier 4: Community Knowledge

**Definition**: User-generated content and community discussions.

**Examples**:
- Stack Overflow (highly voted answers with accepted status)
- Reddit (specialized subreddits with expert moderation)
- GitHub discussions (official repository discussions)
- Community forums (official vendor forums)
- Q&A sites (Quora answers from verified experts)

**Usage Rules**:
- **MAY BE USED**: For practical troubleshooting and edge cases
- **MAY BE USED**: For implementation examples and code snippets
- **MUST BE CITED**: When used
- **REQUIRES**: Minimum of 3 corroborating sources from different Tier 4 sources
- **REQUIRES**: Expert verification (accepted answer, high votes, moderator approval)
- **CONFIDENCE**: Automatically assigned "Low" confidence

**Never Use For**:
- Core factual claims
- Medical, financial, or legal advice
- Scientific or technical definitions
- Anything that contradicts Tier 1-3 sources

---

## Deliverable 2 – Knowledge Acceptance Policy

### Acceptance Criteria

New knowledge is accepted into the Knowledge OS when ALL of the following are met:

1. **Sufficient Evidence**
   - Tier 1 sources: Single source sufficient
   - Tier 2 sources: Single source sufficient
   - Tier 3 sources: Requires 2 corroborating sources
   - Tier 4 sources: Requires 3 corroborating sources from different platforms

2. **Source Agreement**
   - No conflicts between sources
   - If conflicts exist, follow Conflict Resolution policy (Deliverable 3)

3. **Confidence Threshold**
   - Minimum confidence: 0.7 (70%)
   - High-risk categories (Health, Finance, Legal): Minimum 0.85 (85%)
   - Confidence calculated from source tier, corroboration, and recency

4. **Citation Requirements**
   - Every factual claim must have at least one citation
   - Controversial claims require multiple citations (minimum 2)
   - Medical, financial, legal claims require Tier 1 or Tier 2 citations only

5. **Freshness Requirements**
   - Technology: Maximum 2 years old
   - Finance: Maximum 1 year old
   - Health: Maximum 3 years old
   - Travel: Maximum 2 years old
   - History: No maximum (timeless)
   - Programming: Maximum 2 years old

### Rejection Criteria

Knowledge is REJECTED when ANY of the following are met:

1. No trusted source exists (all sources are below Tier 4)
2. Evidence conflicts cannot be resolved
3. Confidence below threshold
4. Citations missing or insufficient
5. Information is outdated (exceeds freshness requirements)
6. Source is deprecated or officially superseded
7. Claim is controversial without Tier 1 or Tier 2 support

---

## Deliverable 3 – Conflict Resolution

### When Two Trusted Sources Disagree

**Decision Process**:

1. **Tier Priority Rule**
   - Tier 1 always overrides Tier 2, 3, and 4
   - Tier 2 always overrides Tier 3 and 4
   - Tier 3 always overrides Tier 4
   - Within same tier: proceed to step 2

2. **Recency Rule**
   - More recent source wins if within 12 months
   - If age difference > 12 months: prefer more recent
   - If age difference < 12 months: proceed to step 3

3. **Authority Rule**
   - Official source wins over derivative source
   - Primary source wins over secondary source
   - Original publication wins over reprint/summary

4. **Corroboration Rule**
   - Source with more corroborating sources wins
   - If equal corroboration: proceed to step 5

5. **Consensus Rule**
   - Check if majority of trusted sources agree
   - If 3+ sources agree with one, follow majority
   - If split 50/50: proceed to step 6

6. **Human Review Rule**
   - Escalate to human reviewer
   - Document the conflict
   - Human makes final decision
   - Decision becomes precedent for future conflicts

### Never Invent an Answer

**Rule**: If conflict cannot be resolved through the above process:
- DO NOT invent a compromise
- DO NOT guess
- DO NOT publish conflicting information
- REJECT the knowledge until conflict can be resolved
- Flag for human review

---

## Deliverable 4 – Knowledge Versioning

### Fact Versioning

**Definition**: Individual facts have versions to track changes over time.

**Version Structure**:
- Format: `factId_v{major}.{minor}`
- Major version: Content change (statement modified)
- Minor version: Metadata change (confidence updated, citation added)

**Version Triggers**:
- Major version increment: Fact statement changes
- Minor version increment: Confidence score changes, citation added/removed

**Storage**:
- Current version in `knowledge_facts` table
- Version history in `fact_versions` table (if exists) or audit log

---

### Citation Versioning

**Definition**: Citations have versions to track source changes.

**Version Structure**:
- Format: `citationId_v{major}.{minor}`
- Major version: Source URL changes
- Minor version: Access date changes, metadata updates

**Version Triggers**:
- Major version increment: Source URL changes, source deprecated
- Minor version increment: Access date updated, source metadata updated

---

### Package Versioning

**Definition**: Knowledge packages have versions to track overall knowledge changes.

**Version Structure**:
- Format: Semantic versioning (major.minor.patch)
- Major: Breaking changes (facts removed, structure changed)
- Minor: New facts added (backward compatible)
- Patch: Confidence updates, citation updates (backward compatible)

**Version Triggers**:
- Major: Facts removed, schema changes, breaking changes
- Minor: New facts added, non-breaking changes
- Patch: Confidence updates, citation metadata updates

**Hash-Based Versioning**:
- Knowledge hash computed from all facts (SHA-256)
- If hash changes → version increments
- If hash unchanged → version unchanged (only metadata updates)

---

### Publication Versioning

**Definition**: Published content has versions to track published changes.

**Version Structure**:
- Format: ISO timestamp (e.g., 2026-07-04T12:00:00Z)
- Each publication creates a new version
- Previous versions remain accessible for rollback

**Version Triggers**:
- Every publication creates a new version
- Version stored in `rendered_outputs` table
- Current version marked as "published"
- Previous versions marked as "stale"

---

## Deliverable 5 – Human Review Policy

### Categories Requiring Human Approval

**Mandatory Human Review Required For**:

1. **Health**
   - All medical claims
   - Drug interactions
   - Treatment recommendations
   - Disease information
   - Mental health claims

2. **Finance**
   - Investment recommendations
   - Tax advice
   - Financial planning
   - Market predictions
   - Regulatory compliance

3. **Legal**
   - Legal advice
   - Regulatory information
   - Compliance requirements
   - Contract law
   - Intellectual property

4. **Medical**
   - Similar to Health category
   - Clinical information
   - Pharmaceutical information
   - Medical procedures

5. **Scientific Claims**
   - Controversial scientific topics
   - Climate change claims
   - Evolutionary biology
   - Physics breakthroughs
   - Any claim contradicting established scientific consensus

### Human Review Process

1. **Automated Pre-Check**
   - Quality Agent evaluates content
   - Confidence score calculated
   - Citations verified

2. **Human Review Trigger**
   - Category matches mandatory review list
   - OR Confidence score < 85%
   - OR Controversial claim detected

3. **Human Review Actions**
   - Approve: Content proceeds to publication
   - Reject: Content rejected with reason
   - Request Changes: Content returned for revision
   - Escalate: Flagged for senior reviewer

4. **Review Audit Trail**
   - Reviewer ID recorded
   - Review timestamp recorded
   - Decision recorded
   - Reason for decision recorded

---

## Deliverable 6 – Freshness Policy

### Review Schedules by Category

**Technology**
- Review interval: Every 6 months
- Maximum age: 2 years
- Priority: High
- Reason: Technology changes rapidly

**Finance**
- Review interval: Every 3 months
- Maximum age: 1 year
- Priority: Critical
- Reason: Financial information time-sensitive

**Health**
- Review interval: Every 12 months
- Maximum age: 3 years
- Priority: High
- Reason: Medical knowledge evolves but core principles stable

**Travel**
- Review interval: Every 12 months
- Maximum age: 2 years
- Priority: Medium
- Reason: Travel regulations and recommendations change

**History**
- Review interval: Every 5 years
- Maximum age: None (timeless)
- Priority: Low
- Reason: Historical facts don't change

**Programming**
- Review interval: Every 6 months
- Maximum age: 2 years
- Priority: High
- Reason: Programming languages and frameworks evolve

### Freshness Degradation

**Confidence Decay Over Time**:
- < 6 months old: No confidence decay
- 6-12 months old: Confidence reduced by 5%
- 12-18 months old: Confidence reduced by 10%
- 18-24 months old: Confidence reduced by 20%
- > 24 months old: Confidence reduced by 30% (mark for review)

**Automatic Flagging**:
- Content exceeding maximum age automatically flagged for review
- Confidence below threshold automatically flagged for review
- Deprecated source detected automatically flagged for review

---

## Deliverable 7 – Citation Policy

### Minimum Citations

**By Fact Type**:
- Definition: Minimum 1 citation
- Procedural: Minimum 1 citation
- Property: Minimum 1 citation
- Comparison: Minimum 2 citations (one for each compared item)
- Warning: Minimum 1 citation
- Rule: Minimum 1 citation
- Historical: Minimum 1 citation
- Causal: Minimum 1 citation

**By Category**:
- Health: Minimum 2 citations (Tier 1 or Tier 2 only)
- Finance: Minimum 2 citations (Tier 1 or Tier 2 only)
- Legal: Minimum 2 citations (Tier 1 or Tier 2 only)
- Technology: Minimum 1 citation
- Travel: Minimum 1 citation
- Programming: Minimum 1 citation

### Maximum Unsupported Statements

**Rule**: Zero tolerance for unsupported statements

- Every factual claim must have at least one citation
- Opinions must be explicitly labeled as opinions
- Generalizations must be supported by examples with citations
- Statistics must have citations

### When Citations Are Mandatory

**Always Required**:
- Statistics and data
- Specific numbers or measurements
- Direct quotes
- Medical claims
- Financial advice
- Legal information
- Scientific claims
- Technical specifications
- API documentation details

**Optional**:
- Common knowledge (widely known facts)
- Self-evident statements
- General introductions (when not making factual claims)

### When Multiple Citations Are Required

**Required For**:
- Controversial claims: Minimum 2 citations
- Conflicting information: Minimum 3 citations with conflict resolution
- Medical/Financial/Legal: Minimum 2 citations (Tier 1 or Tier 2 only)
- Statistics: Minimum 2 citations for verification
- Best practices: Minimum 2 citations from different sources

---

## Deliverable 8 – Knowledge Confidence Model

### Confidence Levels

**Verified** (1.0)
- Definition: Factually verified by Tier 1 primary source
- Source: Official documentation, government publications, standards bodies
- Decay: No confidence decay for 5 years
- Action: Automatic acceptance, no human review required

**High** (0.85 - 0.99)
- Definition: High confidence from Tier 2 or multiple Tier 3 sources
- Source: University publications, peer-reviewed journals, multiple corroborating sources
- Decay: 5% confidence decay per year after 2 years
- Action: Automatic acceptance for most categories, human review for high-risk categories

**Medium** (0.70 - 0.84)
- Definition: Moderate confidence from Tier 3 or multiple Tier 4 sources
- Source: Respected publishers, industry leaders, well-maintained documentation
- Decay: 10% confidence decay per year after 1 year
- Action: Acceptable for low-risk categories, requires review for high-risk categories

**Low** (0.50 - 0.69)
- Definition: Low confidence from Tier 4 or limited corroboration
- Source: Community knowledge, single source, limited evidence
- Decay: 20% confidence decay per year after 6 months
- Action: Acceptable only for practical examples, not for core claims

**Deprecated** (< 0.50)
- Definition: Confidence too low for publication
- Reason: Outdated, conflicting, insufficient evidence
- Action: Reject publication, flag for update or removal

### Confidence Calculation

**Base Confidence by Source Tier**:
- Tier 1: 1.0 (Verified)
- Tier 2: 0.9 (High)
- Tier 3: 0.75 (Medium)
- Tier 4: 0.6 (Low)

**Confidence Modifiers**:
- +0.05: Multiple corroborating sources (2+ sources)
- +0.05: Source recency (< 6 months old)
- -0.05: Source age (> 12 months old)
- -0.10: Source age (> 24 months old)
- -0.10: Single source (no corroboration)
- -0.15: Controversial claim
- -0.20: Conflicts with other sources

**Final Confidence Formula**:
```
Final Confidence = Base Confidence + Modifiers
Final Confidence = min(1.0, max(0.0, Final Confidence))
```

### Confidence Changes Over Time

**Automatic Decay**:
- Apply freshness policy degradation (Deliverable 6)
- Re-calculate confidence on each review cycle
- Flag if confidence drops below threshold

**Manual Adjustment**:
- Human reviewer can adjust confidence
- Requires justification in audit trail
- Adjustment becomes precedent for similar facts

**Confidence Restoration**:
- New evidence can restore confidence
- Requires citation update
- Requires version increment

---

## Deliverable 9 – Knowledge Acquisition Pipeline

### Complete Conceptual Flow

```
1. TRUSTED SOURCES
   - Identify potential sources
   - Classify by tier (Tier 1-4)
   - Validate source credibility
   ↓
2. SOURCE VALIDATION
   - Verify source authenticity
   - Check source recency
   - Confirm source authority
   - Reject if below Tier 4
   ↓
3. EVIDENCE EVALUATION
   - Extract factual claims
   - Assess evidence quality
   - Calculate base confidence
   - Check citation requirements
   ↓
4. CONFLICT DETECTION
   - Compare with existing knowledge
   - Identify conflicts
   - Apply Conflict Resolution policy
   - Escalate to human if unresolved
   ↓
5. KNOWLEDGE EXTRACTION
   - Extract structured facts
   - Classify fact types
   - Assign metadata
   - Store in knowledge_facts
   ↓
6. KNOWLEDGE PACKAGE UPDATE
   - Update knowledge_packages
   - Recalculate knowledge hash
   - Increment package version
   - Apply versioning policy
   ↓
7. KNOWLEDGE AUTHORING
   - Knowledge Author Agent consumes facts
   - Generate documents
   - Apply category personality
   ↓
8. EDITORIAL
   - Editorial Agent improves clarity
   - Remove AI patterns
   - Fix transitions
   ↓
9. QUALITY
   - Quality Agent evaluates metrics
   - Apply confidence threshold
   - Reject if below threshold
   - Human review for high-risk categories
   ↓
10. PUBLICATION
    - Publication Pipeline validates
    - Write to topic_translations
    - Trigger cache revalidation
    - Log publication
```

### Pipeline Gates

**Gate 1: Source Validation**
- Reject if source below Tier 4
- Reject if source deprecated
- Reject if source recency exceeds category limits

**Gate 2: Evidence Evaluation**
- Reject if insufficient evidence
- Reject if citations missing
- Reject if confidence below threshold

**Gate 3: Conflict Detection**
- Reject if conflicts cannot be resolved
- Escalate to human if conflict resolution fails

**Gate 4: Quality Evaluation**
- Reject if quality score below threshold
- Reject if confidence below threshold
- Escalate to human for high-risk categories

**Gate 5: Human Review** (for mandatory categories)
- Approve, reject, or request changes
- Final decision before publication

---

## Deliverable 10 – Failure Policy

### When No Trusted Source Exists

**Action**: REJECT knowledge acquisition

**Process**:
1. Flag topic as "insufficient sources"
2. Log in acquisition failure queue
3. Do NOT attempt to use lower-tier sources
4. Do NOT publish placeholder content
5. Notify human reviewer of gap

**Outcome**: Knowledge gap remains unfilled until trusted source becomes available

---

### When Evidence Conflicts

**Action**: APPLY CONFLICT RESOLUTION (Deliverable 3)

**Process**:
1. Apply tier priority (higher tier wins)
2. Apply recency rule (more recent wins)
3. Apply authority rule (official wins)
4. Apply corroboration rule (more sources wins)
5. Apply consensus rule (majority wins)
6. If still unresolved: ESCALATE TO HUMAN

**Outcome**: 
- Resolved: Proceed with accepted source
- Unresolved: REJECT, flag for human review

---

### When Confidence Too Low

**Action**: REJECT publication

**Process**:
1. Calculate final confidence
2. Compare to threshold (0.7 general, 0.85 high-risk)
3. If below threshold: REJECT
4. Flag for evidence gathering
5. Do NOT publish low-confidence content

**Outcome**: Content not published until confidence can be improved

---

### When Citations Missing

**Action**: REJECT knowledge

**Process**:
1. Verify citation requirements (Deliverable 7)
2. If citations missing: REJECT
3. Do NOT accept uncited claims
4. Do NOT publish without citations

**Outcome**: Knowledge not accepted until citations provided

---

### When Information Is Outdated

**Action**: FLAG FOR REVIEW OR DEPRECATE

**Process**:
1. Check freshness policy (Deliverable 6)
2. If exceeds maximum age: FLAG FOR REVIEW
3. If source deprecated: MARK AS DEPRECATED
4. Apply confidence decay
5. If confidence below threshold: DEPRECATE

**Outcome**:
- Flagged: Scheduled for review
- Deprecated: Marked as deprecated, not published
- Updated: If new evidence available, update and republish

---

## Core Principle

**The system must prefer not publishing over publishing uncertain knowledge.**

This principle overrides all other policies. When in doubt:
- Do NOT publish
- Do NOT guess
- Do NOT invent
- Reject and flag for human review

---

## Document Control

**Version**: 1.0  
**Effective Date**: July 4, 2026  
**Review Date**: July 4, 2027  
**Owner**: Valendiro Knowledge Team  
**Approval**: Required for any changes

**Change History**:
- v1.0 (2026-07-04): Initial release
