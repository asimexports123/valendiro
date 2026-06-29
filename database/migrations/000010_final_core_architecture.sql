-- Migration: Final Core Architecture Hierarchy
-- Category -> Collection -> Topic -> Article
-- Enables self-growing knowledge platform.

-- Collections: curated knowledge hubs within a category
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, language_code)
);

-- Link topics to collections and articles to topics
ALTER TABLE topics
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;

-- Optional: link generation queue back to the topic being expanded
ALTER TABLE content_generation_queue
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;

-- Link queued demand topics to the collection they belong to
ALTER TABLE demand_topic_queue
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Link clusters to the collection they generated
ALTER TABLE demand_topic_clusters
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Indexes for the hierarchy
CREATE INDEX IF NOT EXISTS idx_collections_category ON collections(category_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_topics_collection ON topics(collection_id);
CREATE INDEX IF NOT EXISTS idx_articles_topic ON articles(topic_id);
CREATE INDEX IF NOT EXISTS idx_generation_queue_topic ON content_generation_queue(topic_id);
CREATE INDEX IF NOT EXISTS idx_demand_topic_queue_collection ON demand_topic_queue(collection_id);
CREATE INDEX IF NOT EXISTS idx_demand_topic_clusters_collection ON demand_topic_clusters(collection_id);

-- Expand internal link object types to include category and collection
ALTER TABLE internal_links
DROP CONSTRAINT IF EXISTS internal_links_source_type_check;
ALTER TABLE internal_links
DROP CONSTRAINT IF EXISTS internal_links_target_type_check;
ALTER TABLE internal_links
ADD CONSTRAINT internal_links_source_type_check
  CHECK (source_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'collection'));
ALTER TABLE internal_links
ADD CONSTRAINT internal_links_target_type_check
  CHECK (target_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'collection'));

ALTER TABLE internal_link_suggestions
DROP CONSTRAINT IF EXISTS internal_link_suggestions_source_object_type_check;
ALTER TABLE internal_link_suggestions
DROP CONSTRAINT IF EXISTS internal_link_suggestions_target_object_type_check;
ALTER TABLE internal_link_suggestions
ADD CONSTRAINT internal_link_suggestions_source_object_type_check
  CHECK (source_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'collection'));
ALTER TABLE internal_link_suggestions
ADD CONSTRAINT internal_link_suggestions_target_object_type_check
  CHECK (target_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'collection'));

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_collection_translations_updated_at
  BEFORE UPDATE ON collection_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read collections" ON collections
  FOR SELECT USING (true);

CREATE POLICY "Admin and editor manage collections" ON collections
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE POLICY "Public read collection translations" ON collection_translations
  FOR SELECT USING (true);

CREATE POLICY "Admin and editor manage collection translations" ON collection_translations
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());
