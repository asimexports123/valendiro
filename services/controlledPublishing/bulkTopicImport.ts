/**
 * Bulk Topic Import - Phase 1
 * 
 * Import hundreds or thousands of approved topics in batches.
 * Includes exact slug duplicate protection.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createAndPublishTopic } from "./controlledPublisher";

export interface TopicImportRow {
  slug: string;
  title: string;
  subtitle?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  categoryId?: string;
  subcategoryId?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface BulkImportResult {
  imported: number;
  skipped: number;
  duplicates: number;
  errors: string[];
}

/**
 * Import topics in bulk with duplicate protection.
 */
export async function bulkImportTopics(rows: TopicImportRow[]): Promise<BulkImportResult> {
  const supabase = createAdminClient();
  const result: BulkImportResult = {
    imported: 0,
    skipped: 0,
    duplicates: 0,
    errors: [],
  };

  // Pre-fetch all existing slugs for duplicate check
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('slug')
    .in('slug', rows.map(r => r.slug));

  const existingSlugs = new Set(existingTopics?.map(t => t.slug) || []);

  for (const row of rows) {
    try {
      // Check for duplicate slug
      if (existingSlugs.has(row.slug)) {
        result.duplicates++;
        result.errors.push(`Duplicate slug: ${row.slug}`);
        continue;
      }

      // Resolve category/subcategory IDs if slugs provided
      let categoryId = row.categoryId;
      let subcategoryId = row.subcategoryId;

      if (row.categorySlug && !categoryId) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', row.categorySlug)
          .maybeSingle();
        categoryId = category?.id;
      }

      if (row.subcategorySlug && !subcategoryId) {
        const { data: subcategory } = await supabase
          .from('subcategories')
          .select('id')
          .eq('slug', row.subcategorySlug)
          .maybeSingle();
        subcategoryId = subcategory?.id;
      }

      // Skip if no content provided
      if (!row.content) {
        result.skipped++;
        continue;
      }

      // Create and publish topic
      const createResult = await createAndPublishTopic({
        slug: row.slug,
        categoryId,
        subcategoryId,
        languageCode: 'en',
        title: row.title,
        subtitle: row.subtitle,
        content: row.content,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
      });

      if (createResult.success) {
        result.imported++;
      } else {
        result.errors.push(`${row.slug}: ${createResult.error}`);
      }
    } catch (error: any) {
      result.errors.push(`${row.slug}: ${error.message}`);
    }
  }

  return result;
}

/**
 * Import topics from CSV string.
 */
export async function importTopicsFromCSV(csvContent: string): Promise<BulkImportResult> {
  const lines = csvContent.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows: TopicImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: TopicImportRow = {
      slug: getValue(headers, values, 'slug') || getValue(headers, values, 'Slug'),
      title: getValue(headers, values, 'title') || getValue(headers, values, 'Title'),
      subtitle: getValue(headers, values, 'subtitle') || getValue(headers, values, 'Subtitle'),
      categorySlug: getValue(headers, values, 'categorySlug') || getValue(headers, values, 'category_slug'),
      subcategorySlug: getValue(headers, values, 'subcategorySlug') || getValue(headers, values, 'subcategory_slug'),
      content: getValue(headers, values, 'content') || getValue(headers, values, 'Content'),
      metaTitle: getValue(headers, values, 'metaTitle') || getValue(headers, values, 'meta_title'),
      metaDescription: getValue(headers, values, 'metaDescription') || getValue(headers, values, 'meta_description'),
    };
    rows.push(row);
  }

  return bulkImportTopics(rows);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function getValue(headers: string[], values: string[], key: string): string {
  const index = headers.findIndex(h => h.toLowerCase() === key.toLowerCase());
  return index >= 0 ? (values[index] || '') : '';
}
