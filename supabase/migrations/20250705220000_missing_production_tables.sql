-- Migration for missing production tables
-- Adds topic_tags, citations, and relationships tables

-- topic_tags table (many-to-many relationship between topics and tags)
CREATE TABLE IF NOT EXISTS topic_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, tag_id)
);

-- Create index for topic_tags
CREATE INDEX IF NOT EXISTS idx_topic_tags_topic_id ON topic_tags(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_tags_tag_id ON topic_tags(tag_id);

-- Enable RLS for topic_tags
ALTER TABLE topic_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for topic_tags
CREATE POLICY "Public read access for topic_tags" ON topic_tags
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert topic_tags" ON topic_tags
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update topic_tags" ON topic_tags
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete topic_tags" ON topic_tags
  FOR DELETE USING (auth.role() = 'service_role');

-- citations table
CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  confidence TEXT DEFAULT 'high',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for citations
CREATE INDEX IF NOT EXISTS idx_citations_topic_id ON citations(topic_id);
CREATE INDEX IF NOT EXISTS idx_citations_url ON citations(url);

-- Enable RLS for citations
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- RLS policies for citations
CREATE POLICY "Public read access for citations" ON citations
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert citations" ON citations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update citations" ON citations
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete citations" ON citations
  FOR DELETE USING (auth.role() = 'service_role');

-- relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  target_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  confidence TEXT DEFAULT 'high',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (source_topic_id != target_topic_id)
);

-- Create index for relationships
CREATE INDEX IF NOT EXISTS idx_relationships_source_topic_id ON relationships(source_topic_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target_topic_id ON relationships(target_topic_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Enable RLS for relationships
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- RLS policies for relationships
CREATE POLICY "Public read access for relationships" ON relationships
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert relationships" ON relationships
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update relationships" ON relationships
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete relationships" ON relationships
  FOR DELETE USING (auth.role() = 'service_role');
