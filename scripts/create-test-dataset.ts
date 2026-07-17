/**
 * Test Dataset Generator - Phase 1
 * 
 * Creates 100-1,000 controlled test topics for validation.
 * Uses the Phase 1 active taxonomy categories and subcategories.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createAndPublishTopic } from '@/services/controlledPublishing/controlledPublisher';

const TEST_CATEGORIES = [
  { slug: 'technology', name: 'Technology' },
  { slug: 'personal-finance', name: 'Personal Finance' },
  { slug: 'health-wellness', name: 'Health & Wellness' },
];

const TEST_SUBCATEGORIES = [
  { slug: 'programming', category: 'technology', name: 'Programming' },
  { slug: 'web-development', category: 'technology', name: 'Web Development' },
  { slug: 'artificial-intelligence', category: 'technology', name: 'Artificial Intelligence' },
  { slug: 'investing', category: 'personal-finance', name: 'Investing' },
  { slug: 'mutual-funds', category: 'personal-finance', name: 'Mutual Funds' },
  { slug: 'stock-market', category: 'personal-finance', name: 'Stock Market' },
  { slug: 'nutrition', category: 'health-wellness', name: 'Nutrition' },
  { slug: 'fitness', category: 'health-wellness', name: 'Fitness' },
  { slug: 'mental-health', category: 'health-wellness', name: 'Mental Health' },
];

function generateTestContent(title: string, subcategory: string): string {
  return `
# ${title}

## Introduction

${title} is an important topic in the field of ${subcategory}. This guide covers the fundamental concepts and practical applications that beginners and intermediate learners need to understand.

## Key Concepts

Understanding ${title} requires familiarity with several core concepts:

1. **Fundamental Principles**: The basic rules and guidelines that form the foundation of ${title}.
2. **Practical Applications**: How ${title} is used in real-world scenarios.
3. **Best Practices**: Industry-standard approaches for working with ${title}.

## Getting Started

To begin learning about ${title}, start with these foundational steps:

- Understand the basic terminology and concepts
- Practice with simple examples
- Gradually build up to more complex applications
- Seek feedback and iterate on your approach

## Common Challenges

When working with ${title}, learners often encounter several challenges:

- Complexity of the subject matter
- Keeping up with rapid changes in the field
- Applying theoretical knowledge to practical situations
- Finding reliable resources and guidance

## Tips for Success

Here are some proven strategies for mastering ${title}:

1. **Start with the basics**: Build a strong foundation before advancing to complex topics
2. **Practice regularly**: Consistent practice helps reinforce learning
3. **Learn from others**: Study examples and seek mentorship
4. **Stay updated**: Keep current with developments in the field

## Conclusion

${title} is a valuable skill that opens many opportunities. By following this guide and practicing regularly, you can develop a strong understanding of the subject and apply it effectively in your work or studies.

Remember that learning ${title} is a journey, and progress comes through consistent effort and practical application.
`.trim();
}

async function getCategoryId(slug: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return data?.id || null;
}

async function getSubcategoryId(slug: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('subcategories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return data?.id || null;
}

async function createTestDataset(count: number = 100): Promise<{
  created: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const result = {
    created: 0,
    errors: [] as string[],
  };

  // Ensure categories and subcategories exist
  for (const category of TEST_CATEGORIES) {
    const categoryId = await getCategoryId(category.slug);
    if (!categoryId) {
      result.errors.push(`Category not found: ${category.slug}`);
    }
  }

  for (const subcategory of TEST_SUBCATEGORIES) {
    const subcategoryId = await getSubcategoryId(subcategory.slug);
    if (!subcategoryId) {
      result.errors.push(`Subcategory not found: ${subcategory.slug}`);
    }
  }

  if (result.errors.length > 0) {
    return result;
  }

  // Generate test topics
  const topicsPerSubcategory = Math.ceil(count / TEST_SUBCATEGORIES.length);

  for (const subcategory of TEST_SUBCATEGORIES) {
    const categoryId = await getCategoryId(subcategory.category);
    const subcategoryId = await getSubcategoryId(subcategory.slug);

    if (!categoryId || !subcategoryId) {
      continue;
    }

    for (let i = 1; i <= topicsPerSubcategory; i++) {
      const slug = `${subcategory.slug}-guide-${i}`;
      const title = `${subcategory.name} Guide ${i}`;
      const content = generateTestContent(title, subcategory.name);

      const createResult = await createAndPublishTopic({
        slug,
        categoryId,
        subcategoryId,
        languageCode: 'en',
        title,
        subtitle: `A comprehensive guide to ${title.toLowerCase()}`,
        content,
        metaTitle: `${title} - Complete Guide`,
        metaDescription: `Learn ${title.toLowerCase()} with this comprehensive guide covering fundamentals, practical applications, and best practices.`,
      });

      if (createResult.success) {
        result.created++;
      } else {
        result.errors.push(`${slug}: ${createResult.error}`);
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return result;
}

// Main execution
async function main() {
  const count = parseInt(process.argv[2]) || 100;
  console.log(`Creating ${count} test topics...`);

  const result = await createTestDataset(count);

  console.log('\n=== Test Dataset Creation Results ===');
  console.log(`Created: ${result.created} topics`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }

  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch(console.error);
