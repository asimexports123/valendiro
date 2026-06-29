-- Self-learning SEO + affiliate helper functions

-- Fetch content objects that need health scoring (prioritize stale or missing scores)
CREATE OR REPLACE FUNCTION get_objects_for_health_scoring(limit_count INTEGER DEFAULT 100)
RETURNS TABLE(
  id UUID,
  object_type TEXT,
  language_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH published_objects AS (
    SELECT t.id, 'topic'::TEXT AS object_type, tt.language_code, t.updated_at
    FROM topics t
    JOIN topic_translations tt ON tt.topic_id = t.id
    WHERE t.status = 'published'
    UNION ALL
    SELECT a.id, 'article'::TEXT AS object_type, at.language_code, a.updated_at
    FROM articles a
    JOIN article_translations at ON at.article_id = a.id
    WHERE a.status = 'published'
    UNION ALL
    SELECT q.id, 'question'::TEXT AS object_type, qt.language_code, q.updated_at
    FROM questions q
    JOIN question_translations qt ON qt.question_id = q.id
    WHERE q.status = 'published'
    UNION ALL
    SELECT e.id, 'entity'::TEXT AS object_type, et.language_code, e.updated_at
    FROM entities e
    JOIN entity_translations et ON et.entity_id = e.id
    WHERE e.status = 'published'
    UNION ALL
    SELECT ko.id, 'knowledge_object'::TEXT AS object_type, kot.language_code, ko.updated_at
    FROM knowledge_objects ko
    JOIN knowledge_object_translations kot ON kot.knowledge_object_id = ko.id
    WHERE ko.status = 'published'
  )
  SELECT po.id, po.object_type, po.language_code
  FROM published_objects po
  LEFT JOIN content_health_scores chs
    ON chs.object_id = po.id
   AND chs.object_type = po.object_type
   AND chs.language_code = po.language_code
  WHERE chs.id IS NULL
     OR chs.calculated_at < NOW() - INTERVAL '7 days'
     OR po.updated_at > chs.calculated_at
  ORDER BY chs.calculated_at NULLS FIRST, po.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Aggregate metrics for a single object/language
CREATE OR REPLACE FUNCTION get_object_metrics(
  p_object_id UUID,
  p_object_type TEXT,
  p_language_code TEXT
)
RETURNS TABLE(
  views BIGINT,
  unique_views BIGINT,
  click_throughs BIGINT,
  affiliate_clicks BIGINT,
  bounce_rate DECIMAL,
  avg_time DECIMAL,
  age_days INTEGER,
  word_count INTEGER,
  internal_links INTEGER,
  affiliate_links INTEGER,
  has_meta_title BOOLEAN,
  has_meta_description BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN pm.metric_type = 'views' THEN pm.value ELSE 0 END)::BIGINT, 0) AS views,
    COALESCE(SUM(CASE WHEN pm.metric_type = 'unique_views' THEN pm.value ELSE 0 END)::BIGINT, 0) AS unique_views,
    COALESCE(SUM(CASE WHEN pm.metric_type = 'click_through' THEN pm.value ELSE 0 END)::BIGINT, 0) AS click_throughs,
    COALESCE(SUM(CASE WHEN pm.metric_type = 'affiliate_click' THEN pm.value ELSE 0 END)::BIGINT, 0) AS affiliate_clicks,
    COALESCE(AVG(CASE WHEN pm.metric_type = 'bounce_rate' THEN pm.value ELSE NULL END)::DECIMAL, 1) AS bounce_rate,
    COALESCE(AVG(CASE WHEN pm.metric_type = 'avg_time' THEN pm.value ELSE NULL END)::DECIMAL, 0) AS avg_time,
    CASE p_object_type
      WHEN 'topic' THEN (SELECT EXTRACT(DAY FROM NOW() - t.updated_at)::INTEGER FROM topics t WHERE t.id = p_object_id)
      WHEN 'article' THEN (SELECT EXTRACT(DAY FROM NOW() - a.updated_at)::INTEGER FROM articles a WHERE a.id = p_object_id)
      WHEN 'question' THEN (SELECT EXTRACT(DAY FROM NOW() - q.updated_at)::INTEGER FROM questions q WHERE q.id = p_object_id)
      WHEN 'entity' THEN (SELECT EXTRACT(DAY FROM NOW() - e.updated_at)::INTEGER FROM entities e WHERE e.id = p_object_id)
      WHEN 'knowledge_object' THEN (SELECT EXTRACT(DAY FROM NOW() - ko.updated_at)::INTEGER FROM knowledge_objects ko WHERE ko.id = p_object_id)
      ELSE 0
    END AS age_days,
    CASE p_object_type
      WHEN 'topic' THEN (SELECT COALESCE(ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(tt.content, '\s+'), 1), 0) FROM topic_translations tt WHERE tt.topic_id = p_object_id AND tt.language_code = p_language_code)
      WHEN 'article' THEN (SELECT COALESCE(ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(at.content, '\s+'), 1), 0) FROM article_translations at WHERE at.article_id = p_object_id AND at.language_code = p_language_code)
      WHEN 'question' THEN (SELECT COALESCE(ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(qt.answer, '\s+'), 1), 0) FROM question_translations qt WHERE qt.question_id = p_object_id AND qt.language_code = p_language_code)
      WHEN 'entity' THEN (SELECT COALESCE(ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(et.content, '\s+'), 1), 0) FROM entity_translations et WHERE et.entity_id = p_object_id AND et.language_code = p_language_code)
      WHEN 'knowledge_object' THEN (SELECT COALESCE(ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(kot.content, '\s+'), 1), 0) FROM knowledge_object_translations kot WHERE kot.knowledge_object_id = p_object_id AND kot.language_code = p_language_code)
      ELSE 0
    END AS word_count,
    (SELECT COUNT(*)::INTEGER FROM internal_links il
     WHERE il.source_id = p_object_id AND il.source_type = p_object_type) AS internal_links,
    (SELECT COUNT(*)::INTEGER FROM affiliate_object_links aol
     WHERE aol.object_id = p_object_id AND aol.object_type = p_object_type) AS affiliate_links,
    CASE p_object_type
      WHEN 'topic' THEN EXISTS (SELECT 1 FROM topic_translations tt WHERE tt.topic_id = p_object_id AND tt.language_code = p_language_code AND tt.meta_title IS NOT NULL AND tt.meta_title <> '')
      WHEN 'article' THEN EXISTS (SELECT 1 FROM article_translations at WHERE at.article_id = p_object_id AND at.language_code = p_language_code AND at.meta_title IS NOT NULL AND at.meta_title <> '')
      WHEN 'question' THEN EXISTS (SELECT 1 FROM question_translations qt WHERE qt.question_id = p_object_id AND qt.language_code = p_language_code AND qt.meta_title IS NOT NULL AND qt.meta_title <> '')
      WHEN 'entity' THEN EXISTS (SELECT 1 FROM entity_translations et WHERE et.entity_id = p_object_id AND et.language_code = p_language_code AND et.meta_title IS NOT NULL AND et.meta_title <> '')
      WHEN 'knowledge_object' THEN EXISTS (SELECT 1 FROM knowledge_object_translations kot WHERE kot.knowledge_object_id = p_object_id AND kot.language_code = p_language_code AND kot.meta_title IS NOT NULL AND kot.meta_title <> '')
      ELSE FALSE
    END AS has_meta_title,
    CASE p_object_type
      WHEN 'topic' THEN EXISTS (SELECT 1 FROM topic_translations tt WHERE tt.topic_id = p_object_id AND tt.language_code = p_language_code AND tt.meta_description IS NOT NULL AND tt.meta_description <> '')
      WHEN 'article' THEN EXISTS (SELECT 1 FROM article_translations at WHERE at.article_id = p_object_id AND at.language_code = p_language_code AND at.meta_description IS NOT NULL AND at.meta_description <> '')
      WHEN 'question' THEN EXISTS (SELECT 1 FROM question_translations qt WHERE qt.question_id = p_object_id AND qt.language_code = p_language_code AND qt.meta_description IS NOT NULL AND qt.meta_description <> '')
      WHEN 'entity' THEN EXISTS (SELECT 1 FROM entity_translations et WHERE et.entity_id = p_object_id AND et.language_code = p_language_code AND et.meta_description IS NOT NULL AND et.meta_description <> '')
      WHEN 'knowledge_object' THEN EXISTS (SELECT 1 FROM knowledge_object_translations kot WHERE kot.knowledge_object_id = p_object_id AND kot.language_code = p_language_code AND kot.meta_description IS NOT NULL AND kot.meta_description <> '')
      ELSE FALSE
    END AS has_meta_description
  FROM performance_metrics pm
  WHERE pm.object_id = p_object_id
    AND pm.object_type = p_object_type
    AND pm.language_code = p_language_code
    AND pm.recorded_at >= NOW() - INTERVAL '30 days'
  GROUP BY pm.object_id, pm.object_type, pm.language_code;
END;
$$ LANGUAGE plpgsql;

-- Find published objects that are good candidates for affiliate placement
CREATE OR REPLACE FUNCTION get_affiliate_opportunities(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  object_id UUID,
  object_type TEXT,
  language_code TEXT,
  content TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id AS object_id, 'article'::TEXT AS object_type, at.language_code, at.content
  FROM articles a
  JOIN article_translations at ON at.article_id = a.id
  WHERE a.status = 'published'
    AND at.content IS NOT NULL
    AND at.content <> ''
  UNION ALL
  SELECT t.id, 'topic'::TEXT, tt.language_code, tt.content
  FROM topics t
  JOIN topic_translations tt ON tt.topic_id = t.id
  WHERE t.status = 'published'
    AND tt.content IS NOT NULL
    AND tt.content <> ''
  UNION ALL
  SELECT e.id, 'entity'::TEXT, et.language_code, et.content
  FROM entities e
  JOIN entity_translations et ON et.entity_id = e.id
  WHERE e.status = 'published'
    AND et.content IS NOT NULL
    AND et.content <> ''
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fetch content for duplicate detection (same topic cluster when topic_id provided)
CREATE OR REPLACE FUNCTION get_content_for_duplicate_check(
  p_object_id UUID,
  p_object_type TEXT,
  p_language_code TEXT,
  p_topic_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  object_type TEXT,
  language_code TEXT,
  content TEXT,
  topic_id UUID
) AS $$
BEGIN
  IF p_object_type = 'article' OR p_object_type IS NULL THEN
    RETURN QUERY
    SELECT a.id, 'article'::TEXT, at.language_code, at.content, NULL::UUID
    FROM articles a
    JOIN article_translations at ON at.article_id = a.id
    WHERE a.status = 'published'
      AND at.language_code = p_language_code
      AND at.content IS NOT NULL
      AND (p_object_id IS NULL OR a.id <> p_object_id);
  END IF;

  IF p_object_type = 'topic' OR p_object_type IS NULL THEN
    RETURN QUERY
    SELECT t.id, 'topic'::TEXT, tt.language_code, tt.content, t.category_id
    FROM topics t
    JOIN topic_translations tt ON tt.topic_id = t.id
    WHERE t.status = 'published'
      AND tt.language_code = p_language_code
      AND tt.content IS NOT NULL
      AND (p_object_id IS NULL OR t.id <> p_object_id)
      AND (p_topic_id IS NULL OR t.category_id = p_topic_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Identify keyword gaps by extracting words from titles that are not well covered in content
CREATE OR REPLACE FUNCTION identify_keyword_gaps(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  topic_id UUID,
  keyword TEXT,
  language_code TEXT,
  search_volume_score DECIMAL,
  competition_score DECIMAL,
  affiliate_potential_score DECIMAL,
  opportunity_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_words AS (
    SELECT
      t.id AS topic_id,
      tt.language_code,
      unnest(regexp_split_to_array(lower(tt.title), '[^a-z0-9]+')) AS word
    FROM topics t
    JOIN topic_translations tt ON tt.topic_id = t.id
    WHERE t.status = 'published'
      AND length(unnest(regexp_split_to_array(lower(tt.title), '[^a-z0-9]+'))) > 4
  ),
  word_counts AS (
    SELECT topic_id, language_code, word, count(*) AS freq
    FROM topic_words
    GROUP BY topic_id, language_code, word
    HAVING count(*) = 1
  )
  SELECT
    wc.topic_id,
    wc.word AS keyword,
    wc.language_code,
    50::DECIMAL AS search_volume_score,
    40::DECIMAL AS competition_score,
    30::DECIMAL AS affiliate_potential_score,
    50::DECIMAL AS opportunity_score
  FROM word_counts wc
  ORDER BY wc.language_code, wc.word
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Suggest internal links between objects with similar keywords in titles
CREATE OR REPLACE FUNCTION suggest_internal_links(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  source_object_id UUID,
  source_object_type TEXT,
  target_object_id UUID,
  target_object_type TEXT,
  language_code TEXT,
  anchor_text TEXT,
  context_snippet TEXT,
  relevance_score DECIMAL,
  cluster_strength_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH object_titles AS (
    SELECT a.id AS object_id, 'article'::TEXT AS object_type, at.language_code, at.title
    FROM articles a
    JOIN article_translations at ON at.article_id = a.id
    WHERE a.status = 'published'
    UNION ALL
    SELECT t.id, 'topic'::TEXT, tt.language_code, tt.title
    FROM topics t
    JOIN topic_translations tt ON tt.topic_id = t.id
    WHERE t.status = 'published'
    UNION ALL
    SELECT e.id, 'entity'::TEXT, et.language_code, et.name
    FROM entities e
    JOIN entity_translations et ON et.entity_id = e.id
    WHERE e.status = 'published'
  ),
  pairs AS (
    SELECT
      ot1.object_id AS source_object_id,
      ot1.object_type AS source_object_type,
      ot2.object_id AS target_object_id,
      ot2.object_type AS target_object_type,
      ot1.language_code,
      ot2.title AS anchor_text,
      'Related topic' AS context_snippet,
      0.6::DECIMAL AS relevance_score,
      0.5::DECIMAL AS cluster_strength_score
    FROM object_titles ot1
    JOIN object_titles ot2
      ON ot1.language_code = ot2.language_code
     AND ot1.object_id <> ot2.object_id
    WHERE lower(ot1.title) <> lower(ot2.title)
      AND (lower(ot1.title) LIKE '%' || lower(ot2.title) || '%'
           OR ot1.title && ot2.title)
  )
  SELECT * FROM pairs
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Find weak topic clusters (categories with few published topics)
CREATE OR REPLACE FUNCTION find_weak_topic_clusters(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  category_id UUID,
  category_name TEXT,
  topic_count BIGINT,
  weakness_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS category_id,
    ct.name AS category_name,
    count(t.id) AS topic_count,
    (100 - LEAST(count(t.id) * 10, 100))::DECIMAL AS weakness_score
  FROM categories c
  JOIN category_translations ct ON ct.category_id = c.id
  LEFT JOIN topic_categories tc ON tc.category_id = c.id
  LEFT JOIN topics t ON t.id = tc.topic_id AND t.status = 'published'
  GROUP BY c.id, ct.name
  HAVING count(t.id) < 5
  ORDER BY weakness_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
