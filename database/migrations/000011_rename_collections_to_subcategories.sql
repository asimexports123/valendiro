-- Migration: Rename collections → subcategories
-- Architecture Freeze: Category → Subcategory → Topic → Article
-- This is a non-destructive rename — all data is preserved.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Drop dependent constraints, triggers, policies, indexes
-- ═══════════════════════════════════════════════════════════════════

-- Drop RLS policies
DROP POLICY IF EXISTS "Public read collections" ON collections;
DROP POLICY IF EXISTS "Admin and editor manage collections" ON collections;
DROP POLICY IF EXISTS "Public read collection translations" ON collection_translations;
DROP POLICY IF EXISTS "Admin and editor manage collection translations" ON collection_translations;

-- Drop triggers
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
DROP TRIGGER IF EXISTS update_collection_translations_updated_at ON collection_translations;

-- Drop indexes
DROP INDEX IF EXISTS idx_collections_category;
DROP INDEX IF EXISTS idx_collections_slug;
DROP INDEX IF EXISTS idx_topics_collection;
DROP INDEX IF EXISTS idx_demand_topic_queue_collection;
DROP INDEX IF EXISTS idx_demand_topic_clusters_collection;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Rename tables
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE collections RENAME TO subcategories;
ALTER TABLE collection_translations RENAME TO subcategory_translations;

-- ═══════════════════════════════════════════════════════════════════
-- 3. Rename FK columns
-- ═══════════════════════════════════════════════════════════════════

-- subcategory_translations: collection_id → subcategory_id
ALTER TABLE subcategory_translations RENAME COLUMN collection_id TO subcategory_id;

-- topics: collection_id → subcategory_id
ALTER TABLE topics RENAME COLUMN collection_id TO subcategory_id;

-- demand_topic_queue: collection_id → subcategory_id (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demand_topic_queue' AND column_name='collection_id') THEN
    ALTER TABLE demand_topic_queue RENAME COLUMN collection_id TO subcategory_id;
  END IF;
END $$;

-- demand_topic_clusters: collection_id → subcategory_id (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demand_topic_clusters' AND column_name='collection_id') THEN
    ALTER TABLE demand_topic_clusters RENAME COLUMN collection_id TO subcategory_id;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. Update CHECK constraints for internal_links and link_suggestions
-- ═══════════════════════════════════════════════════════════════════

-- internal_links source_type
ALTER TABLE internal_links DROP CONSTRAINT IF EXISTS internal_links_source_type_check;
ALTER TABLE internal_links ADD CONSTRAINT internal_links_source_type_check
  CHECK (source_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'subcategory'));

-- internal_links target_type
ALTER TABLE internal_links DROP CONSTRAINT IF EXISTS internal_links_target_type_check;
ALTER TABLE internal_links ADD CONSTRAINT internal_links_target_type_check
  CHECK (target_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'subcategory'));

-- Update existing data
UPDATE internal_links SET source_type = 'subcategory' WHERE source_type = 'collection';
UPDATE internal_links SET target_type = 'subcategory' WHERE target_type = 'collection';

-- internal_link_suggestions (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='internal_link_suggestions') THEN
    ALTER TABLE internal_link_suggestions DROP CONSTRAINT IF EXISTS internal_link_suggestions_source_object_type_check;
    ALTER TABLE internal_link_suggestions ADD CONSTRAINT internal_link_suggestions_source_object_type_check
      CHECK (source_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'subcategory'));
    ALTER TABLE internal_link_suggestions DROP CONSTRAINT IF EXISTS internal_link_suggestions_target_object_type_check;
    ALTER TABLE internal_link_suggestions ADD CONSTRAINT internal_link_suggestions_target_object_type_check
      CHECK (target_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'subcategory'));
    UPDATE internal_link_suggestions SET source_object_type = 'subcategory' WHERE source_object_type = 'collection';
    UPDATE internal_link_suggestions SET target_object_type = 'subcategory' WHERE target_object_type = 'collection';
  END IF;
END $$;

-- seo_metadata object_type
ALTER TABLE seo_metadata DROP CONSTRAINT IF EXISTS seo_metadata_object_type_check;
ALTER TABLE seo_metadata ADD CONSTRAINT seo_metadata_object_type_check
  CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'subcategory', 'tag'));
UPDATE seo_metadata SET object_type = 'subcategory' WHERE object_type = 'collection';

-- ═══════════════════════════════════════════════════════════════════
-- 5. Recreate indexes
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_topics_subcategory ON topics(subcategory_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demand_topic_queue' AND column_name='subcategory_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_demand_topic_queue_subcategory ON demand_topic_queue(subcategory_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demand_topic_clusters' AND column_name='subcategory_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_demand_topic_clusters_subcategory ON demand_topic_clusters(subcategory_id)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 6. Recreate triggers
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER update_subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategory_translations_updated_at
  BEFORE UPDATE ON subcategory_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════
-- 7. Recreate RLS policies
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategory_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read subcategories" ON subcategories
  FOR SELECT USING (true);

CREATE POLICY "Admin and editor manage subcategories" ON subcategories
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE POLICY "Public read subcategory translations" ON subcategory_translations
  FOR SELECT USING (true);

CREATE POLICY "Admin and editor manage subcategory translations" ON subcategory_translations
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());
