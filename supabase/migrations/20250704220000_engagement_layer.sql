-- Engagement Layer Migration
-- Adds tables for Layer 2: Engagement Layer (next page hooks, sidebars, CTAs)

-- Engagement elements (Layer 2 components)
create table if not exists engagement_elements (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  element_type text not null check (element_type in ('next_page_hook', 'sidebar', 'cta', 'related_content', 'navigation', 'callout')),
  position integer default 0,
  content jsonb not null,
  target_topic_id uuid references topics(id) on delete set null,
  display_rules jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Next page hooks (specific engagement elements)
create table if not exists next_page_hooks (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  hook_text text not null,
  target_topic_id uuid references topics(id) on delete set null,
  position integer default 0,
  context text, -- where to place the hook (end_of_article, after_section, etc.)
  click_tracking boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sidebars
create table if not exists sidebars (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  title text,
  content jsonb not null,
  position integer default 0,
  sidebar_type text check (sidebar_type in ('key_takeaways', 'related_topics', 'quick_answer', 'pro_tip', 'did_you_know')),
  is_collapsible boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Call-to-actions
create table if not exists ctas (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  cta_text text not null,
  action_url text,
  action_type text check (action_type in ('internal_link', 'external_link', 'newsletter_signup', 'affiliate_link')),
  position integer default 0,
  is_prominent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes for performance
create index if not exists idx_engagement_elements_topic on engagement_elements(topic_id, element_type, position);
create index if not exists idx_engagement_elements_active on engagement_elements(is_active) where is_active = true;
create index if not exists idx_next_page_hooks_topic on next_page_hooks(topic_id, position);
create index if not exists idx_sidebars_topic on sidebars(topic_id, position);
create index if not exists idx_ctas_topic on ctas(topic_id, position);
