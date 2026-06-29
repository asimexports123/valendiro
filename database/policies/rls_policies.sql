-- Knowledge OS — Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_object_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_object_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own profile; admins can read all
CREATE POLICY "Public profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Content tables: read public published content, write only for admins/editors
CREATE POLICY "Published content is readable by everyone" ON topics
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins and editors can manage topics" ON topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Published translations are readable by everyone" ON topic_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics WHERE topics.id = topic_translations.topic_id AND topics.status = 'published'
    )
  );

CREATE POLICY "Admins and editors can manage topic translations" ON topic_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Reusable helper function for admin/editor checks
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin-only tables
CREATE POLICY "Admin-only read on update_queue" ON update_queue
  FOR SELECT USING (is_admin_or_editor());

CREATE POLICY "Admin-only write on update_queue" ON update_queue
  FOR ALL USING (is_admin_or_editor());

CREATE POLICY "Admin-only read on affiliate_products" ON affiliate_products
  FOR SELECT USING (is_admin_or_editor());

CREATE POLICY "Admin-only write on affiliate_products" ON affiliate_products
  FOR ALL USING (is_admin_or_editor());
