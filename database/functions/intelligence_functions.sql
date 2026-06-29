-- Intelligence Engine helper functions

-- Find topics with few relationships and no published questions/knowledge objects
CREATE OR REPLACE FUNCTION find_underdeveloped_topics(limit_count INT DEFAULT 20)
RETURNS TABLE(id UUID, slug TEXT, status TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.slug, t.status
  FROM topics t
  LEFT JOIN knowledge_relationships kr ON t.id = kr.source_id OR t.id = kr.target_id
  WHERE t.status = 'published'
  GROUP BY t.id
  HAVING COUNT(kr.id) < 3
  ORDER BY t.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Return category IDs for a given object
CREATE OR REPLACE FUNCTION get_object_category_ids(object_id UUID, object_type TEXT)
RETURNS TABLE(category_id UUID) AS $$
BEGIN
  IF object_type = 'topic' THEN
    RETURN QUERY SELECT tc.category_id FROM topic_categories tc WHERE tc.topic_id = object_id;
  ELSIF object_type = 'question' THEN
    RETURN QUERY SELECT DISTINCT tc.category_id FROM question_topics qt
      JOIN topic_categories tc ON tc.topic_id = qt.topic_id
      WHERE qt.question_id = object_id;
  ELSIF object_type = 'entity' THEN
    RETURN QUERY SELECT ec.category_id FROM entity_categories ec WHERE ec.entity_id = object_id;
  ELSIF object_type = 'article' THEN
    RETURN QUERY SELECT ac.category_id FROM article_categories ac WHERE ac.article_id = object_id;
  ELSIF object_type = 'knowledge_object' THEN
    RETURN QUERY SELECT koc.category_id FROM knowledge_object_categories koc WHERE koc.knowledge_object_id = object_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Find other objects sharing any of the given category IDs
CREATE OR REPLACE FUNCTION find_objects_by_category_ids(
  category_ids UUID[],
  exclude_object_id UUID,
  max_results INT DEFAULT 10
)
RETURNS TABLE(id UUID, object_type TEXT) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT t.id, 'topic'::TEXT AS object_type
    FROM topics t
    JOIN topic_categories tc ON t.id = tc.topic_id
    WHERE tc.category_id = ANY(category_ids) AND t.id != exclude_object_id

    UNION

    SELECT q.id, 'question'::TEXT AS object_type
    FROM questions q
    JOIN question_topics qt ON q.id = qt.question_id
    JOIN topic_categories tc ON tc.topic_id = qt.topic_id
    WHERE tc.category_id = ANY(category_ids) AND q.id != exclude_object_id

    UNION

    SELECT e.id, 'entity'::TEXT AS object_type
    FROM entities e
    JOIN entity_categories ec ON e.id = ec.entity_id
    WHERE ec.category_id = ANY(category_ids) AND e.id != exclude_object_id

    UNION

    SELECT a.id, 'article'::TEXT AS object_type
    FROM articles a
    JOIN article_categories ac ON a.id = ac.article_id
    WHERE ac.category_id = ANY(category_ids) AND a.id != exclude_object_id

    UNION

    SELECT ko.id, 'knowledge_object'::TEXT AS object_type
    FROM knowledge_objects ko
    JOIN knowledge_object_categories koc ON ko.id = koc.knowledge_object_id
    WHERE koc.category_id = ANY(category_ids) AND ko.id != exclude_object_id
  )
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
