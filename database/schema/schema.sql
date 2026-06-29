-- Knowledge OS — Core Database Schema
-- Supabase (PostgreSQL 15+)
-- Designed for 10M+ knowledge objects, 100+ languages, AI/automation ready

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Profiles mirror Supabase Auth users with role-based access
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE category_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, language_code)
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tag_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tag_id, language_code)
);

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  canonical_path TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_read_time INTEGER,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE topic_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  structured_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topic_id, language_code)
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  answer_type TEXT CHECK (answer_type IN ('short', 'long', 'step_by_step', 'comparison')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE question_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (question_id, language_code)
);

CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  canonical_path TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'organization', 'product', 'place', 'concept', 'event', 'technology')),
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE entity_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  structured_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_id, language_code)
);

CREATE TABLE knowledge_objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  canonical_path TEXT NOT NULL UNIQUE,
  object_type TEXT NOT NULL CHECK (object_type IN ('fact', 'definition', 'procedure', 'comparison', 'principle', 'statistic')),
  confidence_score DECIMAL(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_ids UUID[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE knowledge_object_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (knowledge_object_id, language_code)
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  canonical_path TEXT NOT NULL UNIQUE,
  article_type TEXT NOT NULL CHECK (article_type IN ('guide', 'explainer', 'reference', 'comparison', 'tutorial')),
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE article_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  structured_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (article_id, language_code)
);

CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('academic', 'government', 'industry', 'news', 'book', 'dataset', 'other')),
  reliability_score DECIMAL(4,3) CHECK (reliability_score >= 0 AND reliability_score <= 1),
  published_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE source_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, language_code)
);

-- Many-to-many relationship tables
CREATE TABLE topic_categories (
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, category_id)
);

CREATE TABLE topic_tags (
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, tag_id)
);

CREATE TABLE question_topics (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, topic_id)
);

CREATE TABLE entity_categories (
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_id, category_id)
);

CREATE TABLE entity_tags (
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_id, tag_id)
);

CREATE TABLE article_categories (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE knowledge_object_categories (
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_object_id, category_id)
);

CREATE TABLE knowledge_object_tags (
  knowledge_object_id UUID NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_object_id, tag_id)
);

CREATE TABLE internal_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  link_text JSONB,
  link_context TEXT NOT NULL CHECK (link_context IN ('inline', 'related', 'see_also', 'breadcrumb', 'navigation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE affiliate_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant TEXT NOT NULL,
  product_url TEXT NOT NULL,
  affiliate_code TEXT,
  price DECIMAL(12,2),
  currency TEXT,
  active_from TIMESTAMPTZ,
  active_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE affiliate_product_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_product_id UUID NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  call_to_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (affiliate_product_id, language_code)
);

CREATE TABLE affiliate_object_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  affiliate_product_id UUID NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  placement TEXT NOT NULL CHECK (placement IN ('inline', 'sidebar', 'footer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seo_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'category', 'tag')),
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  twitter_card TEXT CHECK (twitter_card IN ('summary', 'summary_large_image')),
  noindex BOOLEAN NOT NULL DEFAULT FALSE,
  nofollow BOOLEAN NOT NULL DEFAULT FALSE,
  hreflang_group_id UUID,
  structured_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_id, object_type, language_code)
);

CREATE TABLE update_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object', 'seo', 'translation', 'internal_link', 'affiliate')),
  job_type TEXT NOT NULL CHECK (job_type IN ('content_refresh', 'translation', 'seo_optimization', 'internal_linking', 'affiliate_refresh', 'fact_check')),
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('views', 'unique_views', 'click_through', 'affiliate_click', 'bounce_rate', 'avg_time')),
  value DECIMAL(15,4) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance at scale
CREATE INDEX idx_topics_status ON topics(status);
CREATE INDEX idx_topics_published_at ON topics(published_at);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_entities_status ON entities(status);
CREATE INDEX idx_knowledge_objects_status ON knowledge_objects(status);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_seo_metadata_object ON seo_metadata(object_id, object_type, language_code);
CREATE INDEX idx_update_queue_status ON update_queue(status, priority, scheduled_at);
CREATE INDEX idx_performance_metrics_object ON performance_metrics(object_id, object_type, language_code, metric_type, recorded_at);
CREATE INDEX idx_internal_links_source ON internal_links(source_id, source_type);
CREATE INDEX idx_internal_links_target ON internal_links(target_id, target_type);

-- Trigram indexes for text search
CREATE INDEX idx_topic_translations_title_trgm ON topic_translations USING gin (title gin_trgm_ops);
CREATE INDEX idx_article_translations_title_trgm ON article_translations USING gin (title gin_trgm_ops);
CREATE INDEX idx_entity_translations_name_trgm ON entity_translations USING gin (name gin_trgm_ops);
