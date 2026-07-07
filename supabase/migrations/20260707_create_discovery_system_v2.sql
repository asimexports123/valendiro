-- Discovery System Migration - Simplified Version
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS pipeline_runs CASCADE;
DROP TABLE IF EXISTS discovery_queue CASCADE;
DROP TABLE IF EXISTS system_health CASCADE;
DROP TABLE IF EXISTS internal_links CASCADE;
DROP TABLE IF EXISTS gap_analysis_results CASCADE;
DROP TABLE IF EXISTS knowledge_graph_edges CASCADE;
DROP TABLE IF EXISTS knowledge_graph_nodes CASCADE;
DROP TABLE IF EXISTS discovered_content CASCADE;
DROP TABLE IF EXISTS discovery_sources CASCADE;

-- Discovery Sources Table
CREATE TABLE discovery_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  trust_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  freshness_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  authority_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  originality_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  spam_score DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active',
  last_checked_at TIMESTAMPTZ,
  last_discovered_at TIMESTAMPTZ,
  discovery_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discovery_sources_type ON discovery_sources(source_type);
CREATE INDEX idx_discovery_sources_status ON discovery_sources(status);
CREATE INDEX idx_discovery_sources_domain ON discovery_sources(domain);
CREATE INDEX idx_discovery_sources_trust_score ON discovery_sources(trust_score DESC);

-- Discovered Content Table
CREATE TABLE discovered_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES discovery_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content_summary TEXT,
  content_full TEXT,
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  content_hash TEXT,
  similar_content_ids UUID[],
  merged_into_id UUID REFERENCES discovered_content(id),
  trust_score DECIMAL(3,2),
  freshness_score DECIMAL(3,2),
  authority_score DECIMAL(3,2),
  originality_score DECIMAL(3,2),
  spam_score DECIMAL(3,2),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  extracted_knowledge JSONB DEFAULT '{}',
  topic_mappings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discovered_content_source ON discovered_content(source_id);
CREATE INDEX idx_discovered_content_status ON discovered_content(status);
CREATE INDEX idx_discovered_content_hash ON discovered_content(content_hash);
CREATE INDEX idx_discovered_content_published ON discovered_content(published_at DESC);
CREATE INDEX idx_discovered_content_discovered ON discovered_content(discovered_at DESC);

-- Knowledge Graph Nodes Table
CREATE TABLE knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES knowledge_graph_nodes(id),
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  completeness_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  importance_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  article_count INTEGER NOT NULL DEFAULT 0,
  reference_count INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ,
  gap_analysis JSONB DEFAULT '{}',
  last_gap_analysis_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_nodes_type ON knowledge_graph_nodes(node_type);
CREATE INDEX idx_knowledge_nodes_parent ON knowledge_graph_nodes(parent_id);
CREATE INDEX idx_knowledge_nodes_slug ON knowledge_graph_nodes(slug);
CREATE INDEX idx_knowledge_nodes_importance ON knowledge_graph_nodes(importance_score DESC);

-- Knowledge Graph Edges Table
CREATE TABLE knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  source_discovery_id UUID REFERENCES discovered_content(id),
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_id, target_id, edge_type)
);

CREATE INDEX idx_knowledge_edges_source ON knowledge_graph_edges(source_id);
CREATE INDEX idx_knowledge_edges_target ON knowledge_graph_edges(target_id);
CREATE INDEX idx_knowledge_edges_type ON knowledge_graph_edges(edge_type);
CREATE INDEX idx_knowledge_edges_weight ON knowledge_graph_edges(weight DESC);

-- Gap Analysis Results Table
CREATE TABLE gap_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  node_id UUID REFERENCES knowledge_graph_nodes(id),
  missing_sections TEXT[] DEFAULT '{}',
  missing_examples BOOLEAN DEFAULT FALSE,
  missing_comparisons BOOLEAN DEFAULT FALSE,
  missing_faqs BOOLEAN DEFAULT FALSE,
  missing_glossary BOOLEAN DEFAULT FALSE,
  missing_references BOOLEAN DEFAULT FALSE,
  severity TEXT NOT NULL,
  action_required BOOLEAN DEFAULT TRUE,
  action_taken BOOLEAN DEFAULT FALSE,
  regeneration_job_id UUID REFERENCES content_regeneration_queue(id),
  analysis_details JSONB DEFAULT '{}',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gap_analysis_topic ON gap_analysis_results(topic_id);
CREATE INDEX idx_gap_analysis_node ON gap_analysis_results(node_id);
CREATE INDEX idx_gap_analysis_severity ON gap_analysis_results(severity);
CREATE INDEX idx_gap_analysis_action ON gap_analysis_results(action_required);

-- Internal Links Table
CREATE TABLE internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  target_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  link_text TEXT,
  relevance_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  status TEXT NOT NULL DEFAULT 'active',
  last_verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_topic_id, target_topic_id, link_type)
);

CREATE INDEX idx_internal_links_source ON internal_links(source_topic_id);
CREATE INDEX idx_internal_links_target ON internal_links(target_topic_id);
CREATE INDEX idx_internal_links_type ON internal_links(link_type);
CREATE INDEX idx_internal_links_status ON internal_links(status);

-- System Health Monitoring Table
CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL,
  status TEXT NOT NULL,
  health_score INTEGER NOT NULL DEFAULT 100,
  last_heartbeat_at TIMESTAMPTZ,
  uptime_seconds BIGINT,
  error_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_health_component ON system_health(component_name);
CREATE INDEX idx_system_health_type ON system_health(component_type);
CREATE INDEX idx_system_health_status ON system_health(status);
CREATE INDEX idx_system_health_heartbeat ON system_health(last_heartbeat_at DESC);

-- Discovery Queue Table
CREATE TABLE discovery_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES discovery_sources(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50,
  stage TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  logs TEXT[] DEFAULT '{}',
  error_message TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_remaining_seconds INTEGER,
  discovered_count INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discovery_queue_source ON discovery_queue(source_id);
CREATE INDEX idx_discovery_queue_status ON discovery_queue(status);
CREATE INDEX idx_discovery_queue_type ON discovery_queue(job_type);
CREATE INDEX idx_discovery_queue_priority ON discovery_queue(priority DESC);
CREATE INDEX idx_discovery_queue_queued ON discovery_queue(queued_at DESC);

-- Pipeline Runs Table
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stages JSONB NOT NULL,
  total_duration INTEGER,
  success BOOLEAN,
  stages_completed INTEGER,
  stages_total INTEGER,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_runs_run_at ON pipeline_runs(run_at DESC);

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

-- Updated_at trigger function (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
