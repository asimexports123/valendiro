-- Knowledge OS — Database Triggers

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_translations_updated_at
BEFORE UPDATE ON category_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON tags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tag_translations_updated_at
BEFORE UPDATE ON tag_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_translations_updated_at
BEFORE UPDATE ON topic_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_translations_updated_at
BEFORE UPDATE ON question_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at
BEFORE UPDATE ON entities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_translations_updated_at
BEFORE UPDATE ON entity_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_objects_updated_at
BEFORE UPDATE ON knowledge_objects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_object_translations_updated_at
BEFORE UPDATE ON knowledge_object_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_translations_updated_at
BEFORE UPDATE ON article_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at
BEFORE UPDATE ON sources
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_translations_updated_at
BEFORE UPDATE ON source_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_products_updated_at
BEFORE UPDATE ON affiliate_products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_product_translations_updated_at
BEFORE UPDATE ON affiliate_product_translations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_metadata_updated_at
BEFORE UPDATE ON seo_metadata
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_update_queue_updated_at
BEFORE UPDATE ON update_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sync profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, 'user', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
