-- RLS policies for Intelligence Engine tables

-- content_scores: public read on published content, admin/editor full access
CREATE POLICY "Public read content scores for published content" ON content_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM (
        SELECT status FROM topics WHERE id = content_scores.object_id AND content_scores.object_type = 'topic'
        UNION ALL
        SELECT status FROM questions WHERE id = content_scores.object_id AND content_scores.object_type = 'question'
        UNION ALL
        SELECT status FROM entities WHERE id = content_scores.object_id AND content_scores.object_type = 'entity'
        UNION ALL
        SELECT status FROM articles WHERE id = content_scores.object_id AND content_scores.object_type = 'article'
        UNION ALL
        SELECT status FROM knowledge_objects WHERE id = content_scores.object_id AND content_scores.object_type = 'knowledge_object'
      ) obj WHERE obj.status = 'published'
    )
  );

CREATE POLICY "Admin and editor manage content scores" ON content_scores
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

-- knowledge_relationships: public read, admin/editor write
CREATE POLICY "Public read knowledge relationships" ON knowledge_relationships
  FOR SELECT USING (true);

CREATE POLICY "Admin and editor manage knowledge relationships" ON knowledge_relationships
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

-- content_generation_queue: admin/editor only
CREATE POLICY "Admin and editor read content generation queue" ON content_generation_queue
  FOR SELECT USING (is_admin_or_editor());

CREATE POLICY "Admin and editor manage content generation queue" ON content_generation_queue
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

-- content_update_queue: admin/editor only
CREATE POLICY "Admin and editor read content update queue" ON content_update_queue
  FOR SELECT USING (is_admin_or_editor());

CREATE POLICY "Admin and editor manage content update queue" ON content_update_queue
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

-- content_priority_queue: admin/editor only
CREATE POLICY "Admin and editor read content priority queue" ON content_priority_queue
  FOR SELECT USING (is_admin_or_editor());

CREATE POLICY "Admin and editor manage content priority queue" ON content_priority_queue
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

-- internal_link_suggestions: admin/editor only
CREATE POLICY "Admin and editor read internal link suggestions" ON internal_link_suggestions
  FOR SELECT USING (is_admin_or_editor());

CREATE POLICY "Admin and editor manage internal link suggestions" ON internal_link_suggestions
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());
