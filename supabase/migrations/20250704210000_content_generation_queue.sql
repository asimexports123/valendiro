-- Content Generation Queue Table
-- Manages autonomous content generation pipeline

create table if not exists content_generation_queue (
  id uuid primary key default gen_random_uuid(),
  topic_slug text not null,
  status text not null default 'pending' check (status in ('pending', 'discovered', 'assembled', 'rendered', 'published', 'failed')),
  priority integer default 50,
  discovered_data jsonb,
  metadata jsonb,
  error_message text,
  attempts integer default 0,
  max_attempts integer default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes for efficient queue processing
create index if not exists idx_content_generation_queue_status on content_generation_queue(status);
create index if not exists idx_content_generation_queue_priority on content_generation_queue(priority desc);
create index if not exists idx_content_generation_queue_topic_slug on content_generation_queue(topic_slug);
create index if not exists idx_content_generation_queue_created_at on content_generation_queue(created_at);

-- Content Health Issues Table
-- Tracks content health monitoring results

create table if not exists content_health_issues (
  id uuid primary key default gen_random_uuid(),
  topic_slug text not null,
  issue_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  description text,
  resolved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_content_health_issues_topic_slug on content_health_issues(topic_slug);
create index if not exists idx_content_health_issues_resolved on content_health_issues(resolved);
create index if not exists idx_content_health_issues_severity on content_health_issues(severity);
