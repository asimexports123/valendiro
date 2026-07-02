-- Migration 000016: Knowledge Package Foundation
-- Architecture: KNOWLEDGE_PACKAGE_ARCHITECTURE.md v3.1 (FROZEN)
-- Date: 2 July 2026

-- ─── Domain Glossary ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS domain_glossary (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abbreviation    TEXT NOT NULL UNIQUE,
  canonical_form  TEXT NOT NULL,
  domain          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_domain_glossary_abbrev ON domain_glossary(abbreviation);

-- ─── Knowledge Packages ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_packages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_slot_id         UUID REFERENCES hub_slots(id) ON DELETE SET NULL,
  topic_id            UUID REFERENCES topics(id) ON DELETE SET NULL,
  slug                TEXT NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1,
  knowledge_hash      TEXT NOT NULL,
  source_count        INTEGER NOT NULL DEFAULT 0,
  fact_count          INTEGER NOT NULL DEFAULT 0,
  relationship_count  INTEGER NOT NULL DEFAULT 0,
  discovery_run_ids   UUID[] DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'ready', 'stale', 'archived')),
  last_updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_packages_slot ON knowledge_packages(hub_slot_id);
CREATE INDEX idx_knowledge_packages_topic ON knowledge_packages(topic_id);
CREATE INDEX idx_knowledge_packages_status ON knowledge_packages(status);
CREATE INDEX idx_knowledge_packages_slug ON knowledge_packages(slug);

-- ─── Knowledge Citations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_citations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id          UUID NOT NULL REFERENCES knowledge_packages(id) ON DELETE CASCADE,
  source_name         TEXT NOT NULL,
  source_url          TEXT,
  adapter_name        TEXT NOT NULL,
  extraction_method   TEXT NOT NULL,
  source_authority    TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (source_authority IN ('official', 'encyclopedic', 'community', 'academic', 'unknown')),
  retrieved_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_citations_package ON knowledge_citations(package_id);

-- ─── Knowledge Facts ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_facts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      UUID NOT NULL REFERENCES knowledge_packages(id) ON DELETE CASCADE,
  statement       TEXT NOT NULL,
  fact_type       TEXT NOT NULL
                  CHECK (fact_type IN (
                    'definition', 'property', 'rule', 'measurement',
                    'historical', 'causal', 'procedural', 'warning',
                    'comparison', 'opinion'
                  )),
  confidence      TEXT NOT NULL DEFAULT 'medium'
                  CHECK (confidence IN ('verified', 'high', 'medium', 'low', 'disputed')),
  domain          TEXT,
  scope           TEXT NOT NULL DEFAULT 'contextual'
                  CHECK (scope IN ('universal', 'contextual', 'narrow')),
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_facts_package ON knowledge_facts(package_id);
CREATE INDEX idx_knowledge_facts_type ON knowledge_facts(fact_type);
CREATE INDEX idx_knowledge_facts_confidence ON knowledge_facts(confidence);

-- ─── Knowledge Evidence ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_evidence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id         UUID NOT NULL REFERENCES knowledge_facts(id) ON DELETE CASCADE,
  citation_id     UUID NOT NULL REFERENCES knowledge_citations(id) ON DELETE CASCADE,
  excerpt         TEXT,
  retrieved_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_evidence_fact ON knowledge_evidence(fact_id);
CREATE INDEX idx_knowledge_evidence_citation ON knowledge_evidence(citation_id);

-- ─── Knowledge Provenance ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_provenance (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id                 UUID NOT NULL REFERENCES knowledge_facts(id) ON DELETE CASCADE,
  discovery_run_id        UUID REFERENCES discovery_runs(id) ON DELETE SET NULL,
  discovery_candidate_id  UUID REFERENCES discovery_candidates(id) ON DELETE SET NULL,
  adapter_name            TEXT NOT NULL,
  source_slug             TEXT NOT NULL,
  extracted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_provenance_fact ON knowledge_provenance(fact_id);
CREATE INDEX idx_knowledge_provenance_run ON knowledge_provenance(discovery_run_id);
CREATE INDEX idx_knowledge_provenance_candidate ON knowledge_provenance(discovery_candidate_id);

-- ─── Knowledge Relationships ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL,
  source_level    TEXT NOT NULL
                  CHECK (source_level IN ('fact', 'package', 'slot', 'topic')),
  target_id       UUID NOT NULL,
  target_level    TEXT NOT NULL
                  CHECK (target_level IN ('fact', 'package', 'slot', 'topic')),
  relationship_type TEXT NOT NULL
                  CHECK (relationship_type IN (
                    'requires', 'depends_on', 'contradicts', 'extends',
                    'replaces', 'related_to', 'part_of', 'causes',
                    'prevents', 'precedes', 'specializes', 'generalizes'
                  )),
  strength        TEXT NOT NULL DEFAULT 'moderate'
                  CHECK (strength IN ('strong', 'moderate', 'weak')),
  explanation     TEXT,
  bidirectional   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_relationships_source ON knowledge_relationships(source_id, source_level);
CREATE INDEX idx_knowledge_relationships_target ON knowledge_relationships(target_id, target_level);
CREATE INDEX idx_knowledge_relationships_type ON knowledge_relationships(relationship_type);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE domain_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on domain_glossary"
  ON domain_glossary FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on knowledge_packages"
  ON knowledge_packages FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on knowledge_citations"
  ON knowledge_citations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on knowledge_facts"
  ON knowledge_facts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on knowledge_evidence"
  ON knowledge_evidence FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on knowledge_provenance"
  ON knowledge_provenance FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on knowledge_relationships"
  ON knowledge_relationships FOR ALL USING (true) WITH CHECK (true);
