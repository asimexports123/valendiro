-- Migration: Cost Optimization Indexes
-- Adds performance indexes for zero-cost, high-scale operation.

-- Topics
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);
CREATE INDEX IF NOT EXISTS idx_topics_published_at ON topics(published_at);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_intent_type ON questions(intent_type);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_published_at ON questions(published_at);

-- Articles
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);

-- Entities
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_published_at ON entities(published_at);

-- Knowledge Objects
CREATE INDEX IF NOT EXISTS idx_knowledge_objects_status ON knowledge_objects(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_objects_published_at ON knowledge_objects(published_at);

-- Translations (language filtering is very common)
CREATE INDEX IF NOT EXISTS idx_topic_translations_lang ON topic_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_question_translations_lang ON question_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_article_translations_lang ON article_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_entity_translations_lang ON entity_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_knowledge_object_translations_lang ON knowledge_object_translations(language_code);

-- Relationship tables
CREATE INDEX IF NOT EXISTS idx_question_topics_topic ON question_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_question_topics_question ON question_topics(question_id);
CREATE INDEX IF NOT EXISTS idx_topic_categories_category ON topic_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_topic_categories_topic ON topic_categories(topic_id);

-- Queue tables (processing indexes already exist, add status+priority)
CREATE INDEX IF NOT EXISTS idx_content_generation_queue_priority ON content_generation_queue(status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_update_queue_priority ON content_update_queue(status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_priority_queue_priority ON content_priority_queue(status, priority_score DESC);

-- Content scores
CREATE INDEX IF NOT EXISTS idx_content_scores_priority ON content_scores(overall_priority_score DESC, calculated_at);
CREATE INDEX IF NOT EXISTS idx_content_scores_object_lang ON content_scores(object_id, object_type, language_code);

-- Demand signals
CREATE INDEX IF NOT EXISTS idx_demand_signals_composite ON demand_signals(signal_type, source, language_code);
