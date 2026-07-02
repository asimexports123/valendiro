/**
 * Official Documentation Adapter
 *
 * Extracts structured knowledge from official documentation sites.
 * Parses only navigation structure (Table of Contents, headings, sidebar items).
 *
 * Does NOT:
 *   - Scrape arbitrary page content
 *   - Generate or summarize content
 *   - Follow arbitrary links
 *
 * Supports documentation index pages with structured headings.
 * Source URL is required in adapter config.
 *
 * Lifecycle: Fetch → Extract → Normalize → Validate → Emit
 */

import type { DiscoveryAdapter, RawCandidate, SlotInfo, SourceAttribution } from "../adapters";

interface DocsConfig {
  baseUrl: string;
  indexPath: string;
  name: string;
}

interface ExtractedHeading {
  text: string;
  level: number;
  anchor: string;
}

export class DocsAdapter implements DiscoveryAdapter {
  readonly adapterType = "docs";
  private config: DocsConfig;

  constructor(config: DocsConfig) {
    this.config = config;
  }

  async extract(topicSlug: string, topicTitle: string, emptySlots: SlotInfo[]): Promise<RawCandidate[]> {
    const candidates: RawCandidate[] = [];
    const now = new Date().toISOString();

    // Fetch documentation index page
    const indexUrl = `${this.config.baseUrl}${this.config.indexPath}`;
    let html = "";

    try {
      const response = await fetch(indexUrl);
      if (!response.ok) return candidates;
      html = await response.text();
    } catch {
      return candidates;
    }

    // Extract headings from HTML (h1-h3 with potential id/anchor)
    const headings = this.extractHeadings(html);

    // Extract navigation links (common patterns: <nav>, <aside>, .sidebar, .toc)
    const navLinks = this.extractNavLinks(html);

    // Combine headings and nav links
    const allItems = [
      ...headings.map((h) => ({ text: h.text, anchor: h.anchor, type: "heading" as const })),
      ...navLinks.map((l) => ({ text: l.text, anchor: l.href, type: "nav_link" as const })),
    ];

    // Match against empty slots
    for (const slot of emptySlots) {
      const slotWords = new Set(
        slot.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
      );

      for (const item of allItems) {
        const itemWords = new Set(
          item.text.toLowerCase().split(/[\s\-_/]+/).filter((w) => w.length > 2)
        );
        const overlap = [...slotWords].filter((w) => itemWords.has(w)).length;
        const relevance = slotWords.size > 0
          ? Math.round((overlap / Math.max(slotWords.size, itemWords.size)) * 100)
          : 0;

        if (relevance >= 30 || overlap >= 2) {
          const fullUrl = item.anchor.startsWith("http")
            ? item.anchor
            : `${this.config.baseUrl}${item.anchor.startsWith("/") ? "" : "/"}${item.anchor}`;

          const attribution: SourceAttribution = {
            sourceName: this.config.name,
            sourceUrl: fullUrl,
            adapterName: "DocsAdapter",
            extractionMethod: "doc_navigation",
            discoveredAt: now,
          };

          candidates.push({
            slotId: slot.id,
            title: `${topicTitle}: ${item.text}`,
            description: `Official documentation section "${item.text}" from ${this.config.name}`,
            sourceUrl: fullUrl,
            relevanceScore: Math.min(95, 45 + relevance),
            confidenceScore: Math.min(95, 55 + overlap * 15),
            attribution,
            metadata: {
              doc_source: this.config.name,
              doc_item: item.text,
              item_type: item.type,
              match_overlap: overlap,
            },
          });
        }
      }
    }

    return this.validate(candidates);
  }

  private extractHeadings(html: string): ExtractedHeading[] {
    const headings: ExtractedHeading[] = [];
    // Match h1-h3 tags with optional id attribute
    const headingRegex = /<h([1-3])[^>]*(?:id=["']([^"']*)["'])?[^>]*>(.*?)<\/h[1-3]>/gi;
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1], 10);
      const anchor = match[2] || "";
      // Strip HTML tags from heading text
      const text = match[3].replace(/<[^>]*>/g, "").trim();

      if (text.length >= 3 && text.length <= 100) {
        headings.push({ text, level, anchor: anchor ? `#${anchor}` : "" });
      }
    }

    return headings;
  }

  private extractNavLinks(html: string): { text: string; href: string }[] {
    const links: { text: string; href: string }[] = [];

    // Extract links from <nav> or elements with toc/sidebar classes
    const navRegex = /<(?:nav|aside|div)[^>]*(?:class=["'][^"']*(?:toc|sidebar|nav|menu)[^"']*["'])[^>]*>([\s\S]*?)<\/(?:nav|aside|div)>/gi;
    let navMatch;

    while ((navMatch = navRegex.exec(html)) !== null) {
      const navHtml = navMatch[1];
      const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(navHtml)) !== null) {
        const href = linkMatch[1];
        const text = linkMatch[2].replace(/<[^>]*>/g, "").trim();

        if (text.length >= 3 && text.length <= 100 && !href.startsWith("#") ) {
          links.push({ text, href });
        }
      }
    }

    return links;
  }

  private validate(candidates: RawCandidate[]): RawCandidate[] {
    return candidates.filter((c) => {
      if (c.title.length < 5 || c.title.length > 200) return false;
      if (!c.attribution) return false;
      return true;
    });
  }
}
