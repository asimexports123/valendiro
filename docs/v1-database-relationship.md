# Valendiro V1 Database Relationship Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    categories ||--o{ collections : has
    categories ||--o{ topics : contains
    collections ||--o{ topics : contains
    topics ||--o{ articles : has
    topics ||--o{ questions : contains

    categories {
        uuid id
        string slug
        uuid parent_id
    }
    category_translations {
        uuid category_id
        string language_code
        string name
        string description
    }
    collections {
        uuid id
        string slug
        uuid category_id
        int sort_order
    }
    collection_translations {
        uuid collection_id
        string language_code
        string name
        string description
    }
    topics {
        uuid id
        string slug
        string canonical_path
        uuid category_id
        uuid collection_id
        string status
    }
    topic_translations {
        uuid topic_id
        string language_code
        string title
        string subtitle
        string content
    }
    articles {
        uuid id
        string slug
        string canonical_path
        uuid topic_id
        string article_type
        string status
    }
    article_translations {
        uuid article_id
        string language_code
        string title
        string excerpt
        string content
    }
    questions {
        uuid id
        string slug
        uuid topic_id
    }
    question_translations {
        uuid question_id
        string language_code
        string question_text
        string answer
    }
    internal_links {
        uuid source_id
        string source_type
        uuid target_id
        string target_type
    }
    internal_link_suggestions {
        uuid source_object_id
        string source_object_type
        uuid target_object_id
        string target_object_type
        string status
    }
    demand_signals {
        uuid id
        string signal_type
        string source
        string keyword
        string language_code
    }
    demand_topic_clusters {
        uuid id
        string cluster_name
        uuid collection_id
        string seed_keyword
        string[] keywords
    }
    demand_topic_queue {
        uuid id
        uuid demand_signal_id
        uuid cluster_id
        uuid collection_id
        string keyword
        string title
        string status
    }
    content_generation_queue {
        uuid id
        string object_type
        uuid topic_id
        string title
        int priority_score
        string status
    }
```

## Key Relationships

- **Category → Collection** (1:N): A category has many collections.
- **Category → Topic** (1:N): A category also directly contains topics.
- **Collection → Topic** (1:N): A collection contains many topics.
- **Topic → Article** (1:N): A topic expands into many articles.
- **Topic → Question** (1:N): A topic has many FAQ questions.
- **Article → Topic** (N:1): Every article belongs to one topic.
- **Internal Links** (M:N): Links between any knowledge object, including category and collection.
- **Demand Signals** → Clusters → Queue → Generation Queue: Autonomous pipeline tracking.

## New V1 Columns

| Table | New Column | Purpose |
|---|---|---|
| `topics` | `collection_id` | FK to `collections` |
| `articles` | `topic_id` | FK to `topics` |
| `collections` | `category_id` | FK to `categories` |
| `demand_topic_clusters` | `collection_id` | Track generated collection |
| `demand_topic_queue` | `collection_id` | Track target collection |
| `content_generation_queue` | `topic_id` | Link article jobs to their topic |

## Internal Link Object Types

`source_type` / `target_type` now support:
- `category`
- `collection`
- `topic`
- `article`
- `question`
- `entity`
- `knowledge_object`
