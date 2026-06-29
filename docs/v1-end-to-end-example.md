# Valendiro V1 End-to-End Example: Home EV Charging

## Real Topic: Home EV Charging

This example traces the full pipeline for the topic **“Home EV Charging”**.

## 1. Demand Discovery

Google Autocomplete returns these related searches for EV charging:

- `best home ev charger 2026`
- `level 2 ev charger installation`
- `how much does it cost to charge an ev at home`
- `ev charger safety tips`
- `home ev charging mistakes`

`captureAllExternalDemand()` inserts each as a `demand_signals` row with `category` = **Automotive** and `search_intent` = **commercial/informational**.

## 2. Clustering & Auto-Categorization

`clusterDemandSignals()` groups these signals into a cluster named **“Home EV Charging”**.

Because the cluster has 5 signals, the system:

- Reuses or creates the **Automotive** category.
- Reuses or creates the **Electric Vehicles** collection under Automotive.
- Inserts a row into `demand_topic_clusters` with `collection_id` pointing to **Electric Vehicles**.

## 3. Topic Queue

`buildDemandTopicQueue()` finds the cluster with high opportunity score.

- It checks `topic_translations` and `demand_topic_queue` for duplicates/cannibalization.
- The seed keyword **“home ev charging”** is unique, so it becomes a `pending` row in `demand_topic_queue` with `collection_id` = **Electric Vehicles**.

## 4. Topic Approval & Publishing

`approveDemandTopicQueueItems()` moves the topic into `content_generation_queue` with `object_type = 'topic'`.

`publishApprovedTopics()` then:

- Creates a `Topic` row with:
  - `slug`: `home-ev-charging`
  - `canonical_path`: `/en/topics/home-ev-charging`
  - `category_id`: **Automotive**
  - `collection_id`: **Electric Vehicles**
- Inserts `topic_translations` with title, subtitle, and overview content.
- Calls `buildHierarchicalLinksForTopic()`:
  - Topic → Category (Automotive)
  - Topic → Collection (Electric Vehicles)
  - Topic → Related Topics in the same collection

## 5. Topic Expansion into Articles

`queueArticleExpansionsForTopic()` generates the following article titles for the topic:

- Best Home EV Chargers
- Level 1 vs Level 2 Chargers
- EV Charger Installation Guide
- EV Charging Cost Breakdown
- EV Charging Safety Tips
- Common EV Charging Mistakes
- EV Charging FAQ
- EV Charger Troubleshooting
- EV Charger Maintenance
- EV Charging Buying Guide

Each title is inserted into `content_generation_queue` as `object_type = 'article'` with `topic_id` = **Home EV Charging**.

## 6. Article Publishing

`publishApprovedArticles()` picks each queued article:

- Selects a template (guide, comparison, tutorial, explainer) based on the title.
- Generates content via `generateArticleFromTemplate()`.
- Runs `humanizeContent()` to remove robotic phrasing.
- Runs `runQualityGate()`:
  - Duplicate check against existing content.
  - Readability score check.
  - Internal similarity check against other articles in the topic.
- Creates an `articles` row with `topic_id` = **Home EV Charging**.
- Inserts `article_translations`.
- Calls `buildHierarchicalLinksForArticle()`:
  - Article → Topic (Home EV Charging)
  - Article → Collection (Electric Vehicles)
  - Article → Category (Automotive)

## 7. Public Pages

The content is now available on the public site:

- **Category page**: `/en/categories/automotive` lists Electric Vehicles collection and Home EV Charging topic.
- **Collection page**: `/en/collections/electric-vehicles` lists Home EV Charging topic and its articles.
- **Topic page**: `/en/topics/home-ev-charging` shows all 10 articles and related topics.
- **Article page**: `/en/articles/best-home-ev-chargers` displays the article, related articles, and links to the topic and collection.
- **Search result**: Searching for `home ev charger` returns the topic and articles.

## 8. Knowledge Graph

`internal_link_suggestions` now contains hierarchical links like:

| Source | Target | Context |
|---|---|---|
| Home EV Charging (topic) | Automotive (category) | Topic belongs to category |
| Home EV Charging (topic) | Electric Vehicles (collection) | Topic belongs to collection |
| Best Home EV Chargers (article) | Home EV Charging (topic) | Article belongs to topic |
| Best Home EV Chargers (article) | Electric Vehicles (collection) | Article belongs to collection via topic |

After approval, these become rows in `internal_links` and render in the UI.
