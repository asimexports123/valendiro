-- Migration 000014: Hub Slots (Topic Instance Layer)
-- When a Topic is assigned an Entity Type, its blueprint materializes into
-- hub_sections and hub_slots specific to that topic.
-- Articles are linked to individual slots to track coverage.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Add entity_type_id to topics (nullable — non-breaking)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE topics
ADD COLUMN IF NOT EXISTS entity_type_id UUID REFERENCES entity_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_topics_entity_type ON topics(entity_type_id);

-- ═══════════════════════════════════════════════════════════════════
-- 2. Hub Sections (materialized from entity_type_sections per topic)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hub_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  entity_type_section_id UUID REFERENCES entity_type_sections(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topic_id, slug)
);

CREATE TABLE IF NOT EXISTS hub_section_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES hub_sections(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section_id, language_code)
);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Hub Slots (materialized from entity_type_slots per topic)
--    Each slot can be linked to one article when filled.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hub_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES hub_sections(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  entity_type_slot_id UUID REFERENCES entity_type_slots(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'drafted', 'published')),
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topic_id, slug)
);

CREATE TABLE IF NOT EXISTS hub_slot_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES hub_slots(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slot_id, language_code)
);

-- ═══════════════════════════════════════════════════════════════════
-- 4. Indexes
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_hub_sections_topic ON hub_sections(topic_id);
CREATE INDEX IF NOT EXISTS idx_hub_slots_section ON hub_slots(section_id);
CREATE INDEX IF NOT EXISTS idx_hub_slots_topic ON hub_slots(topic_id);
CREATE INDEX IF NOT EXISTS idx_hub_slots_status ON hub_slots(status);
CREATE INDEX IF NOT EXISTS idx_hub_slots_article ON hub_slots(article_id);

-- ═══════════════════════════════════════════════════════════════════
-- 5. Triggers for updated_at
-- ═══════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS update_hub_sections_updated_at ON hub_sections;
CREATE TRIGGER update_hub_sections_updated_at
  BEFORE UPDATE ON hub_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hub_section_translations_updated_at ON hub_section_translations;
CREATE TRIGGER update_hub_section_translations_updated_at
  BEFORE UPDATE ON hub_section_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hub_slots_updated_at ON hub_slots;
CREATE TRIGGER update_hub_slots_updated_at
  BEFORE UPDATE ON hub_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hub_slot_translations_updated_at ON hub_slot_translations;
CREATE TRIGGER update_hub_slot_translations_updated_at
  BEFORE UPDATE ON hub_slot_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
