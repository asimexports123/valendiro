-- Migration 000013: Entity Types & Blueprint Templates
-- Valendiro v1.0 Knowledge Platform Architecture
--
-- Entity Types define reusable blueprint structures for Knowledge Hubs.
-- Each Entity Type has Sections (knowledge layers) and Slots (individual concepts).
-- Topics inherit their blueprint from their assigned Entity Type.
--
-- This migration is PURELY ADDITIVE — no existing tables are modified.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Entity Types (e.g., "Programming Language", "Disease", "Financial Instrument")
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS entity_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entity_type_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type_id UUID NOT NULL REFERENCES entity_types(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type_id, language_code)
);

-- ═══════════════════════════════════════════════════════════════════
-- 2. Entity Type Sections (knowledge layers within a blueprint)
--    e.g., "Foundations", "Core", "Advanced", "Reference", "Applied"
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS entity_type_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type_id UUID NOT NULL REFERENCES entity_types(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type_id, slug)
);

CREATE TABLE IF NOT EXISTS entity_type_section_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES entity_type_sections(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section_id, language_code)
);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Entity Type Slots (individual knowledge concepts within a section)
--    e.g., "Installation", "Variables", "Functions", "OOP"
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS entity_type_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES entity_type_sections(id) ON DELETE CASCADE,
  entity_type_id UUID NOT NULL REFERENCES entity_types(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type_id, slug)
);

CREATE TABLE IF NOT EXISTS entity_type_slot_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES entity_type_slots(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_entity_type_sections_type ON entity_type_sections(entity_type_id);
CREATE INDEX IF NOT EXISTS idx_entity_type_slots_section ON entity_type_slots(section_id);
CREATE INDEX IF NOT EXISTS idx_entity_type_slots_type ON entity_type_slots(entity_type_id);

-- ═══════════════════════════════════════════════════════════════════
-- 5. Triggers for updated_at
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_entity_types_updated_at ON entity_types;
CREATE TRIGGER update_entity_types_updated_at
  BEFORE UPDATE ON entity_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entity_type_translations_updated_at ON entity_type_translations;
CREATE TRIGGER update_entity_type_translations_updated_at
  BEFORE UPDATE ON entity_type_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entity_type_sections_updated_at ON entity_type_sections;
CREATE TRIGGER update_entity_type_sections_updated_at
  BEFORE UPDATE ON entity_type_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entity_type_section_translations_updated_at ON entity_type_section_translations;
CREATE TRIGGER update_entity_type_section_translations_updated_at
  BEFORE UPDATE ON entity_type_section_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entity_type_slots_updated_at ON entity_type_slots;
CREATE TRIGGER update_entity_type_slots_updated_at
  BEFORE UPDATE ON entity_type_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entity_type_slot_translations_updated_at ON entity_type_slot_translations;
CREATE TRIGGER update_entity_type_slot_translations_updated_at
  BEFORE UPDATE ON entity_type_slot_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
