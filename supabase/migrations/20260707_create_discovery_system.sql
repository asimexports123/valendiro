-- Discovery Sources Table
-- Tracks all RSS feeds, Feedly sources, official documentation, government websites, research papers, trusted organizations
CREATE TABLE IF NOT EXISTS discovery_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'feedly', 'official_docs', 'government', 'research_paper', 'trusted_org')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  
  -- Trust scores
  trust_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (trust_score >= 0 AND trust_score <= 1),
  freshness_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (freshness_score >= 0 AND freshness_score <= 1),
  authority_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (authority_score >= 0 AND authority_score <= 1),
  originality_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (originality_score >= 0 AND originality_score <= 1),
  spam_score DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (spam_score >= 0 AND spam_score <= 1),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed', 'expired')),
  last_checked_at TIMESTAMPTZ,
  last_discovered_at TIMESTAMPTZ,
  discovery_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  
  -- Metadata
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for discovery sources
CREATE INDEX IF NOT EXISTS idx_discovery_sources_type ON discovery_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_status ON discovery_sources(status);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_domain ON discovery_sources(domain);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_trust_score ON discovery_sources(trust_score DESC);

-- Discovered Content Table
-- Stores all discovered articles/content before processing
CREATE TABLE IF NOT EXISTS discovered_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES discovery_sources(id) ON DELETE CASCADE,
  
  -- Content metadata
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content_summary TEXT,
  content_full TEXT,
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'deduplicated', 'merged', 'rejected', 'failed')),
  
  -- Deduplication
  content_hash TEXT,
  similar_content_ids UUID[],
  merged_into_id UUID REFERENCES discovered_content(id),
  
  -- Trust scores from source
  trust_score DECIMAL(3,2),
  freshness_score DECIMAL(3,2),
  authority_score DECIMAL(3,2),
  originality_score DECIMAL(3,2),
  spam_score DECIMAL(3,2),
  
  -- Processing metadata
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Extracted knowledge
  extracted_knowledge JSONB DEFAULT '{}',
  topic_mappings JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for discovered content
CREATE INDEX IF NOT EXISTS idx_discovered_content_source ON discovered_content(source_id);
CREATE INDEX IF NOT EXISTS idx_discovered_content_status ON discovered_content(status);
CREATE INDEX IF NOT EXISTS idx_discovered_content_hash ON discovered_content(content_hash);
CREATE INDEX IF NOT EXISTS idx_discovered_content_published ON discovered_content(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_content_discovered ON discovered_content(discovered_at DESC);

-- Knowledge Graph Nodes Table
-- Represents topics, concepts, entities in the knowledge graph
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type TEXT NOT NULL CHECK (node_type IN ('topic', 'concept', 'entity', 'skill', 'tool', 'practice')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Relationships
  parent_id UUID REFERENCES knowledge_graph_nodes(id),
  
  -- Quality metrics
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  completeness_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (completeness_score >= 0 AND completeness_score <= 1),
  importance_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (importance_score >= 0 AND importance_score <= 1),
  
  -- Statistics
  article_count INTEGER NOT NULL DEFAULT 0,
  reference_count INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ,
  
  -- Gap analysis
  gap_analysis JSONB DEFAULT '{}',
  last_gap_analysis_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for knowledge graph nodes
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent ON knowledge_graph_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_slug ON knowledge_graph_nodes(slug);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_importance ON knowledge_graph_nodes(importance_score DESC);

-- Knowledge Graph Edges Table
-- Represents relationships between nodes
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  
  edge_type TEXT NOT NULL CHECK (edge_type IN ('prerequisite', 'related', 'similar', 'contrasts', 'includes', 'applies_to', 'part_of')),
  weight DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (weight >= 0 AND weight <= 1),
  
  -- Source of this relationship
  source_discovery_id UUID REFERENCES discovered_content(id),
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence >= 0 AND confidence <= 1),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(source_id, target_id, edge_type)
);

-- Indexes for knowledge graph edges
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_graph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_graph_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_type ON knowledge_graph_edges(edge_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_weight ON knowledge_graph_edges(weight DESC);

-- Gap Analysis Results Table
-- Stores gap analysis results for articles
CREATE TABLE IF NOT EXISTS gap_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  node_id UUID REFERENCES knowledge_graph_nodes(id),
  
  -- Gap types
  missing_sections TEXT[] DEFAULT '{}',
  missing_examples BOOLEAN DEFAULT FALSE,
  missing_comparisons BOOLEAN DEFAULT FALSE,
  missing_faqs BOOLEAN DEFAULT FALSE,
  missing_glossary BOOLEAN DEFAULT FALSE,
  missing_references BOOLEAN DEFAULT FALSE,
  
  -- Severity
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Action
  action_required BOOLEAN DEFAULT TRUE,
  action_taken BOOLEAN DEFAULT FALSE,
  regeneration_job_id UUID REFERENCES content_regeneration_queue(id),
  
  -- Metadata
  analysis_details JSONB DEFAULT '{}',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_taken_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for gap analysis results
CREATE INDEX IF NOT EXISTS idx_gap_analysis_topic ON gap_analysis_results(topic_id);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_node ON gap_analysis_results(node_id);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_severity ON gap_analysis_results(severity);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_action ON gap_analysis_results(action_required);

-- Internal Links Table
-- Tracks internal links between articles
CREATE TABLE IF NOT EXISTS internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  target_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  
  link_type TEXT NOT NULL CHECK (link_type IN ('prerequisite', 'related', 'reference', 'example')),
  link_text TEXT,
  
  -- Quality metrics
  relevance_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'broken')),
  last_verified_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(source_topic_id, target_topic_id, link_type)
);

-- Indexes for internal links
CREATE INDEX IF NOT EXISTS idx_internal_links_source ON internal_links(source_topic_id);
CREATE INDEX IF NOT EXISTS idx_internal_links_target ON internal_links(target_topic_id);
CREATE INDEX IF NOT EXISTS idx_internal_links_type ON internal_links(link_type);
CREATE INDEX IF NOT EXISTS idx_internal_links_status ON internal_links(status);

-- System Health Monitoring Table
-- Tracks system health and worker status
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL CHECK (component_type IN ('worker', 'queue', 'service', 'database', 'external_api')),
  
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'dead')),
  health_score INTEGER NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  
  -- Metrics
  last_heartbeat_at TIMESTAMPTZ,
  uptime_seconds BIGINT,
  error_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  
  -- Details
  details JSONB DEFAULT '{}',
  last_error TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for system health
CREATE INDEX IF NOT EXISTS idx_system_health_component ON system_health(component_name);
CREATE INDEX IF NOT EXISTS idx_system_health_type ON system_health(component_type);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);
CREATE INDEX IF NOT EXISTS idx_system_health_heartbeat ON system_health(last_heartbeat_at DESC);

-- Discovery Queue Table
-- Queues discovery jobs for processing
CREATE TABLE IF NOT EXISTS discovery_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES discovery_sources(id) ON DELETE CASCADE,
  
  -- Job details
  job_type TEXT NOT NULL CHECK (job_type IN ('discover', 'extract', 'score', 'deduplicate', 'merge')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  priority INTEGER NOT NULL DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  
  -- Progress
  stage TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  logs TEXT[] DEFAULT '{}',
  error_message TEXT,
  
  -- Timing
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_remaining_seconds INTEGER,
  
  -- Results
  discovered_count INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for discovery queue
CREATE INDEX IF NOT EXISTS idx_discovery_queue_source ON discovery_queue(source_id);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_status ON discovery_queue(status);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_type ON discovery_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_priority ON discovery_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_queued ON discovery_queue(queued_at DESC);

-- Enable RLS
ALTER TABLE discovery_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_queue ENABLE ROW LEVEL SECURITY;

-- Policies (admin only)
CREATE POLICY "Admins can manage discovery_sources" ON discovery_sources FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage discovered_content" ON discovered_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage knowledge_graph_nodes" ON knowledge_graph_nodes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage knowledge_graph_edges" ON knowledge_graph_edges FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage gap_analysis_results" ON gap_analysis_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage internal_links" ON internal_links FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage system_health" ON system_health FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage discovery_queue" ON discovery_queue FOR ALL USING (auth.role() = 'authenticated');

-- Updated_at trigger function (already exists, reuse it)

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_discovery_sources_updated_at ON discovery_sources;
CREATE TRIGGER update_discovery_sources_updated_at BEFORE UPDATE ON discovery_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discovered_content_updated_at ON discovered_content;
CREATE TRIGGER update_discovered_content_updated_at BEFORE UPDATE ON discovered_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_graph_nodes_updated_at ON knowledge_graph_nodes;
CREATE TRIGGER update_knowledge_graph_nodes_updated_at BEFORE UPDATE ON knowledge_graph_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_graph_edges_updated_at ON knowledge_graph_edges;
CREATE TRIGGER update_knowledge_graph_edges_updated_at BEFORE UPDATE ON knowledge_graph_edges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gap_analysis_results_updated_at ON gap_analysis_results;
CREATE TRIGGER update_gap_analysis_results_updated_at BEFORE UPDATE ON gap_analysis_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_internal_links_updated_at ON internal_links;
CREATE TRIGGER update_internal_links_updated_at BEFORE UPDATE ON internal_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_health_updated_at ON system_health;
CREATE TRIGGER update_system_health_updated_at BEFORE UPDATE ON system_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discovery_queue_updated_at ON discovery_queue;
CREATE TRIGGER update_discovery_queue_updated_at BEFORE UPDATE ON discovery_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
