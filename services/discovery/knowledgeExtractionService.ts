/**
 * Knowledge Extraction and Graph Update Service
 * 
 * Extracts knowledge from discovered content and updates the knowledge graph
 * Part of the autonomous discovery pipeline
 */

import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export interface ExtractedKnowledge {
  topics: string[];
  concepts: string[];
  entities: string[];
  skills: string[];
  tools: string[];
  practices: string[];
  relationships: KnowledgeRelationship[];
}

export interface KnowledgeRelationship {
  source: string;
  target: string;
  type: 'prerequisite' | 'related' | 'similar' | 'contrasts' | 'includes' | 'applies_to' | 'part_of';
  weight: number;
}

/**
 * Extract knowledge from discovered content
 */
export async function extractKnowledge(contentId: string): Promise<void> {
  console.log(`[KnowledgeExtraction] Extracting knowledge from content: ${contentId}`);

  // Fetch the content
  const { data: content, error } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("id", contentId)
    .single();

  if (error || !content) {
    throw new Error(`Content not found: ${error?.message}`);
  }

  // Extract knowledge using NLP (simplified - in production use proper NLP library)
  const knowledge = await extractKnowledgeFromContent(content);
  
  console.log(`[KnowledgeExtraction] Extracted ${knowledge.topics.length} topics, ${knowledge.concepts.length} concepts`);

  // Update content with extracted knowledge
  await supabase
    .from("discovered_content")
    .update({
      extracted_knowledge: knowledge,
    })
    .eq("id", contentId);

  // Update knowledge graph
  await updateKnowledgeGraph(knowledge, content.id);

  // Update content status
  await supabase
    .from("discovered_content")
    .update({
      status: "processing",
      processing_started_at: new Date().toISOString(),
    })
    .eq("id", contentId);

  console.log(`[KnowledgeExtraction] Knowledge extraction completed`);
}

/**
 * Extract knowledge from content (simplified NLP)
 */
async function extractKnowledgeFromContent(content: any): Promise<ExtractedKnowledge> {
  const text = (content.content_full || content.content_summary || content.title).toLowerCase();
  const title = content.title.toLowerCase();
  
  // Extract topics from title and content
  const techKeywords = [
    'javascript', 'python', 'react', 'nodejs', 'node', 'database', 'api', 'web', 'frontend', 'backend',
    'typescript', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt', 'express', 'django', 'flask', 'rails',
    'java', 'csharp', 'c++', 'rust', 'go', 'swift', 'kotlin', 'php', 'ruby', 'scala', 'clojure',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'dom', 'browser', 'server', 'client',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'vercel', 'netlify', 'heroku', 'firebase',
    'git', 'github', 'gitlab', 'bitbucket', 'ci/cd', 'devops', 'testing', 'jest', 'cypress', 'playwright',
    'graphql', 'rest', 'soap', 'grpc', 'websocket', 'http', 'https', 'tcp', 'udp', 'dns',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch',
    'authentication', 'authorization', 'jwt', 'oauth', 'session', 'cookie', 'security',
    'performance', 'optimization', 'caching', 'cdn', 'load balancer', 'scaling'
  ];
  
  const topics = extractKeywords(text, techKeywords);
  
  // If no topics found in content, use title
  if (topics.length === 0) {
    const titleTopics = extractKeywords(title, techKeywords);
    topics.push(...titleTopics);
  }
  
  // Extract concepts
  const concepts = extractKeywords(text, ['function', 'variable', 'class', 'object', 'array', 'string', 'number', 'boolean', 'async', 'await', 'promise', 'callback', 'closure', 'scope', 'hoisting', 'prototype', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction']);
  
  const entities = extractKeywords(text, ['google', 'microsoft', 'amazon', 'facebook', 'twitter', 'github', 'stackoverflow', 'mozilla', 'w3c', 'ecma', 'node foundation']);
  const skills = extractKeywords(text, ['programming', 'coding', 'debugging', 'testing', 'deployment', 'optimization', 'development', 'engineering', 'architecture', 'design']);
  const tools = extractKeywords(text, ['vscode', 'git', 'docker', 'kubernetes', 'webpack', 'babel', 'eslint', 'prettier', 'jest', 'cypress', 'playwright', 'npm', 'yarn', 'pnpm']);
  const practices = extractKeywords(text, ['tdd', 'cicd', 'agile', 'scrum', 'kanban', 'code review', 'documentation', 'testing', 'refactoring', 'clean code']);

  // Extract relationships (simplified)
  const relationships = extractRelationships(text, topics);

  return {
    topics,
    concepts,
    entities,
    skills,
    tools,
    practices,
    relationships,
  };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string, keywordList: string[]): string[] {
  const found: string[] = [];
  keywordList.forEach(keyword => {
    if (text.includes(keyword)) {
      found.push(keyword);
    }
  });
  return [...new Set(found)]; // Remove duplicates
}

/**
 * Extract relationships between topics
 */
function extractRelationships(text: string, topics: string[]): KnowledgeRelationship[] {
  const relationships: KnowledgeRelationship[] = [];

  // Simplified relationship extraction based on text patterns
  const patterns = [
    { regex: /(\w+)\s+is\s+(?:a\s+)?(?:prerequisite\s+for|required\s+for)\s+(\w+)/i, type: 'prerequisite' as const },
    { regex: /(\w+)\s+is\s+related\s+to\s+(\w+)/i, type: 'related' as const },
    { regex: /(\w+)\s+is\s+similar\s+to\s+(\w+)/i, type: 'similar' as const },
    { regex: /(\w+)\s+(?:contrasts|differs)\s+from\s+(\w+)/i, type: 'contrasts' as const },
    { regex: /(\w+)\s+includes\s+(\w+)/i, type: 'includes' as const },
    { regex: /(\w+)\s+applies\s+to\s+(\w+)/i, type: 'applies_to' as const },
    { regex: /(\w+)\s+is\s+(?:a\s+)?part\s+of\s+(\w+)/i, type: 'part_of' as const },
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      relationships.push({
        source: match[1],
        target: match[2],
        type: pattern.type,
        weight: 0.7,
      });
    }
  });

  return relationships;
}

/**
 * Update knowledge graph with extracted knowledge
 */
async function updateKnowledgeGraph(knowledge: ExtractedKnowledge, sourceContentId: string): Promise<void> {
  // Create or update nodes for each topic/concept/entity/skill/tool/practice
  const allItems = [
    ...knowledge.topics.map(item => ({ name: item, type: 'topic' as const })),
    ...knowledge.concepts.map(item => ({ name: item, type: 'concept' as const })),
    ...knowledge.entities.map(item => ({ name: item, type: 'entity' as const })),
    ...knowledge.skills.map(item => ({ name: item, type: 'skill' as const })),
    ...knowledge.tools.map(item => ({ name: item, type: 'tool' as const })),
    ...knowledge.practices.map(item => ({ name: item, type: 'practice' as const })),
  ];

  const nodeIds: Record<string, string> = {};

  for (const item of allItems) {
    const nodeId = await createOrUpdateNode(item.name, item.type);
    nodeIds[item.name] = nodeId;
  }

  // Create or update edges for relationships
  for (const relationship of knowledge.relationships) {
    const sourceId = nodeIds[relationship.source];
    const targetId = nodeIds[relationship.target];

    if (sourceId && targetId) {
      await createOrUpdateEdge(sourceId, targetId, relationship.type, relationship.weight, sourceContentId);
    }
  }

  console.log(`[KnowledgeExtraction] Updated knowledge graph with ${allItems.length} nodes and ${knowledge.relationships.length} edges`);
}

/**
 * Create or update a knowledge graph node
 */
async function createOrUpdateNode(name: string, type: string): Promise<string> {
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  // Check if node exists
  const { data: existing } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    // Update existing node
    await supabase
      .from("knowledge_graph_nodes")
      .update({
        article_count: existing.article_count + 1,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return existing.id;
  }

  // Create new node
  const { data, error } = await supabase
    .from("knowledge_graph_nodes")
    .insert({
      node_type: type,
      name,
      slug,
      description: `Knowledge node for ${name}`,
      article_count: 1,
      last_updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create node: ${error?.message}`);
  }

  return data.id;
}

/**
 * Create or update a knowledge graph edge
 */
async function createOrUpdateEdge(
  sourceId: string,
  targetId: string,
  type: string,
  weight: number,
  sourceDiscoveryId: string
): Promise<void> {
  // Check if edge exists
  const { data: existing } = await supabase
    .from("knowledge_graph_edges")
    .select("*")
    .eq("source_id", sourceId)
    .eq("target_id", targetId)
    .eq("edge_type", type)
    .maybeSingle();

  if (existing) {
    // Update existing edge
    await supabase
      .from("knowledge_graph_edges")
      .update({
        weight: (existing.weight + weight) / 2, // Average the weights
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new edge
    const { error } = await supabase
      .from("knowledge_graph_edges")
      .insert({
        source_id: sourceId,
        target_id: targetId,
        edge_type: type,
        weight,
        source_discovery_id: sourceDiscoveryId,
      });

    if (error) {
      throw new Error(`Failed to create edge: ${error.message}`);
    }
  }
}

/**
 * Process all content awaiting knowledge extraction
 */
export async function processPendingExtraction(): Promise<{ processed: number; nodesCreated: number; edgesCreated: number }> {
  console.log(`[KnowledgeExtraction] Processing pending knowledge extraction`);

  const { data: pendingContent } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("status", "deduplicated")
    .limit(50);

  if (!pendingContent) {
    return { processed: 0, nodesCreated: 0, edgesCreated: 0 };
  }

  let totalNodes = 0;
  let totalEdges = 0;

  for (const content of pendingContent) {
    try {
      await extractKnowledge(content.id);
      
      // Count nodes and edges created (simplified)
      const knowledge = content.extracted_knowledge;
      if (knowledge) {
        totalNodes += (knowledge.topics?.length || 0) + (knowledge.concepts?.length || 0) + (knowledge.entities?.length || 0);
        totalEdges += knowledge.relationships?.length || 0;
      }
    } catch (error) {
      console.error(`[KnowledgeExtraction] Failed to extract from content ${content.id}:`, error);
      await supabase
        .from("discovered_content")
        .update({ status: "failed", error_message: (error as Error).message })
        .eq("id", content.id);
    }
  }

  console.log(`[KnowledgeExtraction] Processed ${pendingContent.length} items, created ${totalNodes} nodes, ${totalEdges} edges`);
  return { processed: pendingContent.length, nodesCreated: totalNodes, edgesCreated: totalEdges };
}
