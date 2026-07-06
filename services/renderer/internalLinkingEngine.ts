/**
 * Internal Linking Engine
 * 
 * Every published article must automatically generate meaningful internal links
 * Minimum: Technology / Business / Finance / Travel = 5 internal links
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface InternalLink {
  url: string;
  title: string;
  relevanceScore: number;
  linkType: 'related-topic' | 'parent-topic' | 'child-topic' | 'category-guide' | 'comparison';
  anchorText: string;
}

export interface LinkingRequirements {
  category: string;
  minLinks: number;
  requiredTypes: string[];
}

export interface LinkingResult {
  links: InternalLink[];
  requirementsMet: boolean;
  missingTypes: string[];
  totalLinks: number;
  category: string;
}

/**
 * Category-specific linking requirements
 */
const CATEGORY_REQUIREMENTS: Record<string, LinkingRequirements> = {
  technology: {
    category: 'technology',
    minLinks: 5,
    requiredTypes: ['related-topic', 'parent-topic', 'category-guide'],
  },
  business: {
    category: 'business',
    minLinks: 5,
    requiredTypes: ['related-topic', 'parent-topic', 'category-guide'],
  },
  finance: {
    category: 'finance',
    minLinks: 5,
    requiredTypes: ['related-topic', 'parent-topic', 'category-guide'],
  },
  travel: {
    category: 'travel',
    minLinks: 5,
    requiredTypes: ['related-topic', 'parent-topic', 'category-guide'],
  },
  default: {
    category: 'general',
    minLinks: 3,
    requiredTypes: ['related-topic'],
  },
};

/**
 * Generate internal links for a knowledge package
 */
export async function generateInternalLinks(
  packageSlug: string,
  category: string = 'default'
): Promise<LinkingResult> {
  const supabase = createAdminClient();
  const requirements = CATEGORY_REQUIREMENTS[category] || CATEGORY_REQUIREMENTS.default;
  
  const links: InternalLink[] = [];
  const linkTypes = new Set<string>();

  // Get the current package
  const { data: currentPackage } = await supabase
    .from('knowledge_packages')
    .select('id, topic_id, slug')
    .eq('slug', packageSlug)
    .single();

  if (!currentPackage) {
    return {
      links: [],
      requirementsMet: false,
      missingTypes: requirements.requiredTypes,
      totalLinks: 0,
      category: requirements.category,
    };
  }

  // 1. Find related topics (same category)
  const relatedLinks = await findRelatedTopics(currentPackage.topic_id, category);
  links.push(...relatedLinks);
  relatedLinks.forEach(link => linkTypes.add(link.linkType));

  // 2. Find parent topic
  if (requirements.requiredTypes.includes('parent-topic')) {
    const parentLink = await findParentTopic(currentPackage.topic_id);
    if (parentLink) {
      links.push(parentLink);
      linkTypes.add(parentLink.linkType);
    }
  }

  // 3. Find child topics
  const childLinks = await findChildTopics(currentPackage.topic_id);
  links.push(...childLinks);
  childLinks.forEach(link => linkTypes.add(link.linkType));

  // 4. Find category guides
  if (requirements.requiredTypes.includes('category-guide')) {
    const categoryLinks = await findCategoryGuides(category);
    links.push(...categoryLinks);
    categoryLinks.forEach(link => linkTypes.add(link.linkType));
  }

  // 5. Find comparison articles
  const comparisonLinks = await findComparisonArticles(currentPackage.id, category);
  links.push(...comparisonLinks);
  comparisonLinks.forEach(link => linkTypes.add(link.linkType));

  // Check requirements
  const missingTypes = requirements.requiredTypes.filter(type => !linkTypes.has(type));
  const requirementsMet = links.length >= requirements.minLinks && missingTypes.length === 0;

  return {
    links: links.slice(0, 10), // Limit to top 10 links
    requirementsMet,
    missingTypes,
    totalLinks: links.length,
    category: requirements.category,
  };
}

/**
 * Find related topics in the same category
 */
async function findRelatedTopics(
  topicId: string,
  category: string
): Promise<InternalLink[]> {
  const supabase = createAdminClient();
  
  const { data: relatedPackages } = await supabase
    .from('knowledge_packages')
    .select('slug, hub_slot_id')
    .eq('topic_id', topicId)
    .neq('slug', '') // Exclude current
    .limit(5);

  if (!relatedPackages) return [];

  const links: InternalLink[] = [];
  for (const pkg of relatedPackages) {
    const { data: slot } = await supabase
      .from('hub_slots')
      .select('title')
      .eq('id', pkg.hub_slot_id)
      .single();

    if (slot) {
      links.push({
        url: `/knowledge/${pkg.slug}`,
        title: slot.title,
        relevanceScore: 0.8,
        linkType: 'related-topic',
        anchorText: slot.title,
      });
    }
  }

  return links;
}

/**
 * Find parent topic
 */
async function findParentTopic(topicId: string): Promise<InternalLink | null> {
  const supabase = createAdminClient();
  
  // Get topic hierarchy
  const { data: topic } = await supabase
    .from('topics')
    .select('parent_topic_id')
    .eq('id', topicId)
    .single();

  if (!topic?.parent_topic_id) return null;

  // Find packages for parent topic
  const { data: parentPackage } = await supabase
    .from('knowledge_packages')
    .select('slug, hub_slot_id')
    .eq('topic_id', topic.parent_topic_id)
    .limit(1)
    .single();

  if (!parentPackage) return null;

  const { data: slot } = await supabase
    .from('hub_slots')
    .select('title')
    .eq('id', parentPackage.hub_slot_id)
    .single();

  if (!slot) return null;

  return {
    url: `/knowledge/${parentPackage.slug}`,
    title: slot.title,
    relevanceScore: 0.9,
    linkType: 'parent-topic',
    anchorText: slot.title,
  };
}

/**
 * Find child topics
 */
async function findChildTopics(topicId: string): Promise<InternalLink[]> {
  const supabase = createAdminClient();
  
  const { data: childTopics } = await supabase
    .from('topics')
    .select('id')
    .eq('parent_topic_id', topicId)
    .limit(3);

  if (!childTopics) return [];

  const links: InternalLink[] = [];
  for (const child of childTopics) {
    const { data: childPackage } = await supabase
      .from('knowledge_packages')
      .select('slug, hub_slot_id')
      .eq('topic_id', child.id)
      .limit(1)
      .single();

    if (childPackage) {
      const { data: slot } = await supabase
        .from('hub_slots')
        .select('title')
        .eq('id', childPackage.hub_slot_id)
        .single();

      if (slot) {
        links.push({
          url: `/knowledge/${childPackage.slug}`,
          title: slot.title,
          relevanceScore: 0.75,
          linkType: 'child-topic',
          anchorText: slot.title,
        });
      }
    }
  }

  return links;
}

/**
 * Find category guides
 */
async function findCategoryGuides(category: string): Promise<InternalLink[]> {
  const supabase = createAdminClient();
  
  // Find packages marked as category guides
  const { data: guidePackages } = await supabase
    .from('knowledge_packages')
    .select('slug, hub_slot_id')
    .eq('status', 'ready')
    .ilike('slug', `%${category}%`)
    .limit(2);

  if (!guidePackages) return [];

  const links: InternalLink[] = [];
  for (const pkg of guidePackages) {
    const { data: slot } = await supabase
      .from('hub_slots')
      .select('title')
      .eq('id', pkg.hub_slot_id)
      .single();

    if (slot) {
      links.push({
        url: `/knowledge/${pkg.slug}`,
        title: slot.title,
        relevanceScore: 0.85,
        linkType: 'category-guide',
        anchorText: slot.title,
      });
    }
  }

  return links;
}

/**
 * Find comparison articles
 */
async function findComparisonArticles(
  packageId: string,
  category: string
): Promise<InternalLink[]> {
  const supabase = createAdminClient();
  
  // Find packages with comparison-related slugs
  const { data: comparisonPackages } = await supabase
    .from('knowledge_packages')
    .select('slug, hub_slot_id')
    .neq('id', packageId)
    .ilike('slug', '%comparison%')
    .or('slug.ilike.%vs%,slug.ilike.%versus%')
    .limit(2);

  if (!comparisonPackages) return [];

  const links: InternalLink[] = [];
  for (const pkg of comparisonPackages) {
    const { data: slot } = await supabase
      .from('hub_slots')
      .select('title')
      .eq('id', pkg.hub_slot_id)
      .single();

    if (slot) {
      links.push({
        url: `/knowledge/${pkg.slug}`,
        title: slot.title,
        relevanceScore: 0.7,
        linkType: 'comparison',
        anchorText: slot.title,
      });
    }
  }

  return links;
}

/**
 * Validate internal links meet requirements
 */
export function validateInternalLinks(
  result: LinkingResult
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (result.totalLinks < 5) {
    errors.push(`Insufficient internal links: ${result.totalLinks} (minimum: 5)`);
  }

  if (result.missingTypes.length > 0) {
    errors.push(`Missing required link types: ${result.missingTypes.join(', ')}`);
  }

  if (!result.requirementsMet) {
    errors.push('Internal linking requirements not met');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
