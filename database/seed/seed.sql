-- Knowledge OS — Seed Data

INSERT INTO languages (code, name, native_name, is_active, sort_order) VALUES
('en', 'English', 'English', true, 1),
('es', 'Spanish', 'Español', true, 2),
('fr', 'French', 'Français', true, 3),
('de', 'German', 'Deutsch', true, 4),
('zh', 'Chinese', '中文', true, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (slug, sort_order) VALUES
('science', 1),
('technology', 2),
('history', 3),
('health', 4),
('business', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description)
SELECT c.id, 'en', initcap(c.slug), 'Articles in ' || c.slug
FROM categories c
WHERE c.slug IN ('science', 'technology', 'history', 'health', 'business')
ON CONFLICT (category_id, language_code) DO NOTHING;

INSERT INTO tags (slug) VALUES
('ai'), ('climate'), ('economics'), ('medicine'), ('space')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tag_translations (tag_id, language_code, name)
SELECT t.id, 'en', initcap(t.slug)
FROM tags t
WHERE t.slug IN ('ai', 'climate', 'economics', 'medicine', 'space')
ON CONFLICT (tag_id, language_code) DO NOTHING;
