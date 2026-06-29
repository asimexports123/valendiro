-- Demand Intelligence helper functions

-- Calculate topic gap scores based on coverage, relationships, and question intent
CREATE OR REPLACE FUNCTION calculate_topic_gap_scores(language_code TEXT DEFAULT 'en')
RETURNS VOID AS $$
DECLARE
  rec RECORD;
  coverage NUMERIC;
  intent NUMERIC;
  gap NUMERIC;
  opportunity NUMERIC;
BEGIN
  FOR rec IN
    SELECT t.id AS topic_id,
      COUNT(DISTINCT q.id) AS question_count,
      COUNT(DISTINCT a.id) AS article_count,
      COUNT(DISTINCT kr.id) AS relationship_count,
      AVG(CASE WHEN q.intent_type IN ('commercial', 'transactional') THEN 80 ELSE 40 END) AS avg_intent_score
    FROM topics t
    LEFT JOIN question_topics qt ON qt.topic_id = t.id
    LEFT JOIN questions q ON q.id = qt.question_id AND q.intent_type IS NOT NULL
    LEFT JOIN knowledge_relationships kr ON (kr.source_id = t.id AND kr.source_type = 'topic') OR (kr.target_id = t.id AND kr.target_type = 'topic')
    LEFT JOIN article_categories ac ON ac.category_id = t.category_id
    LEFT JOIN articles a ON a.id = ac.article_id AND a.status = 'published'
    WHERE t.status = 'published'
    GROUP BY t.id
  LOOP
    coverage := LEAST(100, COALESCE(rec.question_count, 0) * 15 + COALESCE(rec.article_count, 0) * 30 + COALESCE(rec.relationship_count, 0) * 10);
    intent := COALESCE(rec.avg_intent_score, 40);
    gap := GREATEST(0, 100 - coverage);
    opportunity := (gap * 0.5) + (intent * 0.3) + ((100 - COALESCE(rec.article_count, 0) * 30) * 0.2);

    INSERT INTO topic_gap_scores (topic_id, language_code, gap_score, coverage_score, intent_score, opportunity_score, calculated_at)
    VALUES (rec.topic_id, language_code, gap, coverage, intent, opportunity, NOW())
    ON CONFLICT (topic_id, language_code)
    DO UPDATE SET
      gap_score = EXCLUDED.gap_score,
      coverage_score = EXCLUDED.coverage_score,
      intent_score = EXCLUDED.intent_score,
      opportunity_score = EXCLUDED.opportunity_score,
      calculated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Find topics with high opportunity scores that have no published article
CREATE OR REPLACE FUNCTION find_high_opportunity_topics(language_code TEXT DEFAULT 'en', limit_count INT DEFAULT 20)
RETURNS TABLE(topic_id UUID, opportunity_score NUMERIC, gap_score NUMERIC, coverage_score NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT tgs.topic_id, tgs.opportunity_score, tgs.gap_score, tgs.coverage_score
  FROM topic_gap_scores tgs
  WHERE tgs.language_code = language_code
    AND tgs.opportunity_score > 60
    AND NOT EXISTS (
      SELECT 1 FROM articles a
      JOIN article_categories ac ON a.id = ac.article_id
      JOIN topics t ON t.category_id = ac.category_id
      WHERE t.id = tgs.topic_id AND a.status = 'published'
    )
  ORDER BY tgs.opportunity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Find questions with high commercial/transactional intent that have no article
CREATE OR REPLACE FUNCTION find_high_intent_unanswered_questions(language_code TEXT DEFAULT 'en', limit_count INT DEFAULT 20)
RETURNS TABLE(question_id UUID, intent_type TEXT, topic_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.intent_type, qt.topic_id
  FROM questions q
  JOIN question_topics qt ON qt.question_id = q.id
  WHERE q.intent_type IN ('commercial', 'transactional')
    AND q.status = 'published'
    AND NOT EXISTS (
      SELECT 1 FROM articles a
      JOIN article_categories ac ON a.id = ac.article_id
      WHERE ac.category_id = qt.topic_id AND a.status = 'published'
    )
  ORDER BY q.id
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Find underdeveloped clusters (topics with few related objects)
CREATE OR REPLACE FUNCTION find_underdeveloped_clusters(limit_count INT DEFAULT 20)
RETURNS TABLE(topic_id UUID, relationship_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, COUNT(kr.id) AS relationship_count
  FROM topics t
  LEFT JOIN knowledge_relationships kr ON (kr.source_id = t.id AND kr.source_type = 'topic') OR (kr.target_id = t.id AND kr.target_type = 'topic')
  WHERE t.status = 'published'
  GROUP BY t.id
  HAVING COUNT(kr.id) < 3
  ORDER BY COUNT(kr.id) ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
