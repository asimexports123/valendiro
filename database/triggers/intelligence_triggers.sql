-- Triggers for Intelligence Engine tables

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_scores_updated_at
  BEFORE UPDATE ON content_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_relationships_updated_at
  BEFORE UPDATE ON knowledge_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_generation_queue_updated_at
  BEFORE UPDATE ON content_generation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_update_queue_updated_at
  BEFORE UPDATE ON content_update_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_priority_queue_updated_at
  BEFORE UPDATE ON content_priority_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internal_link_suggestions_updated_at
  BEFORE UPDATE ON internal_link_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
