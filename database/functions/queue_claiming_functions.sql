-- Queue claiming functions for idempotent batch processing

-- Atomically claim a pending queue item by ID, returning the row only if successful
CREATE OR REPLACE FUNCTION claim_queue_item(queue_type TEXT, item_id UUID)
RETURNS TABLE(
  id UUID,
  object_id UUID,
  object_type TEXT,
  title TEXT,
  description TEXT,
  reason TEXT,
  priority_score NUMERIC,
  status TEXT,
  retry_count INTEGER,
  failed_reason TEXT,
  metadata JSONB
) AS $$
BEGIN
  IF queue_type = 'generation' THEN
    RETURN QUERY
    UPDATE content_generation_queue
    SET status = 'in_progress', processing_started_at = NOW()
    WHERE id = item_id AND status = 'pending'
    RETURNING
      content_generation_queue.id,
      NULL::UUID AS object_id,
      content_generation_queue.object_type,
      content_generation_queue.title,
      content_generation_queue.description,
      content_generation_queue.reason,
      content_generation_queue.priority_score,
      content_generation_queue.status,
      content_generation_queue.retry_count,
      content_generation_queue.failed_reason,
      content_generation_queue.metadata;
  ELSIF queue_type = 'update' THEN
    RETURN QUERY
    UPDATE content_update_queue
    SET status = 'in_progress', processing_started_at = NOW()
    WHERE id = item_id AND status = 'pending'
    RETURNING
      content_update_queue.id,
      content_update_queue.object_id,
      content_update_queue.object_type,
      NULL::TEXT AS title,
      NULL::TEXT AS description,
      content_update_queue.reason,
      content_update_queue.priority_score,
      content_update_queue.status,
      content_update_queue.retry_count,
      content_update_queue.failed_reason,
      content_update_queue.metadata;
  ELSIF queue_type = 'priority' THEN
    RETURN QUERY
    UPDATE content_priority_queue
    SET status = 'in_progress', processing_started_at = NOW()
    WHERE id = item_id AND status = 'approved'
    RETURNING
      content_priority_queue.id,
      content_priority_queue.object_id,
      content_priority_queue.object_type,
      NULL::TEXT AS title,
      NULL::TEXT AS description,
      content_priority_queue.reason,
      content_priority_queue.priority_score,
      content_priority_queue.status,
      content_priority_queue.retry_count,
      content_priority_queue.failed_reason,
      content_priority_queue.metadata;
  END IF;
END;
$$ LANGUAGE plpgsql;
