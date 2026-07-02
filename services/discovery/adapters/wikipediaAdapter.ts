/**
 * Wikipedia Structure Adapter
 *
 * Extracts structured knowledge from Wikipedia:
 *   - Table of Contents (section headings)
 *   - "See also" linked concepts
 *
 * Does NOT:
 *   - Summarize article content
 *   - Generate concepts
 *   - Scrape arbitrary text
 *
 * Only extracts structured knowledge (headings, links, navigation).
 *
 * Lifecycle: Fetch → Extract → Normalize → Validate → Emit
 */

import type { DiscoveryAdapter, RawCandidate, SlotInfo, SourceAttribution } from "../adapters";

interface WikiSection {
  toclevel: number;
  line: string;
  index: string;
}

interface WikiLink {
  title: string;
}

export class WikipediaAdapter implements DiscoveryAdapter {
  readonly adapterType = "wikipedia";

  async extract(topicSlug: string, topicTitle: string, emptySlots: SlotInfo[]): Promise<RawCandidate[]> {
    const candidates: RawCandidate[] = [];
    const now = new Date().toISOString();

    // Fetch Wikipedia page structure via MediaWiki API (parse endpoint)
    const pageTitle = topicTitle.replace(/ /g, "_");
    const tocUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections|links&format=json&origin=*`;

    let sections: WikiSection[] = [];
    let seeAlsoLinks: string[] = [];

    try {
      const response = await fetch(tocUrl);
      if (!response.ok) return candidates;

      const data = await response.json();
      if (!data.parse) return candidates;

      sections = (data.parse.sections ?? []) as WikiSection[];

      // Extract "See also" section links
      const seeAlsoSection = sections.find(
        (s) => s.line.toLowerCase() === "see also"
      );
      if (seeAlsoSection && data.parse.links) {
        seeAlsoLinks = (data.parse.links as WikiLink[])
          .filter((l: any) => l.ns === 0 && l.exists !== undefined)
          .map((l: any) => l["*"] || l.title)
          .filter(Boolean)
          .slice(0, 20);
      }
    } catch {
      // Network failure — return empty, don't crash
      return candidates;
    }

    // Filter to meaningful headings (exclude References, External links, etc.)
    const excludedHeadings = new Set([
      "references", "external links", "notes", "footnotes",
      "bibliography", "further reading", "see also",
    ]);

    const meaningfulSections = sections.filter(
      (s) => s.toclevel <= 2 && !excludedHeadings.has(s.line.toLowerCase())
    );

    // Match TOC headings against empty slots
    for (const slot of emptySlots) {
      const slotWords = new Set(
        slot.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
      );

      for (const section of meaningfulSections) {
        const sectionWords = new Set(
          section.line.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
        );
        const overlap = [...slotWords].filter((w) => sectionWords.has(w)).length;
        const relevance = slotWords.size > 0
          ? Math.round((overlap / Math.max(slotWords.size, sectionWords.size)) * 100)
          : 0;

        if (relevance >= 30 || overlap >= 2) {
          const attribution: SourceAttribution = {
            sourceName: "Wikipedia",
            sourceUrl: `https://en.wikipedia.org/wiki/${pageTitle}#${encodeURIComponent(section.line.replace(/ /g, "_"))}`,
            adapterName: "WikipediaAdapter",
            extractionMethod: "toc_heading",
            discoveredAt: now,
          };

          candidates.push({
            slotId: slot.id,
            title: `${topicTitle}: ${section.line}`,
            description: `Knowledge section "${section.line}" from Wikipedia article on ${topicTitle}`,
            sourceUrl: attribution.sourceUrl,
            relevanceScore: Math.min(95, 40 + relevance),
            confidenceScore: Math.min(90, 50 + overlap * 15),
            attribution,
            metadata: {
              wikipedia_section: section.line,
              toc_level: section.toclevel,
              match_overlap: overlap,
            },
          });
        }
      }

      // Also try "See also" links
      for (const link of seeAlsoLinks) {
        const linkWords = new Set(
          link.toLowerCase().split(/[\s_]+/).filter((w) => w.length > 2)
        );
        const overlap = [...slotWords].filter((w) => linkWords.has(w)).length;

        if (overlap >= 1) {
          const attribution: SourceAttribution = {
            sourceName: "Wikipedia",
            sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(link.replace(/ /g, "_"))}`,
            adapterName: "WikipediaAdapter",
            extractionMethod: "see_also",
            discoveredAt: now,
          };

          candidates.push({
            slotId: slot.id,
            title: `${link} (related to ${slot.title})`,
            description: `Related concept "${link}" discovered via Wikipedia "See also" for ${topicTitle}`,
            sourceUrl: attribution.sourceUrl,
            relevanceScore: 35 + overlap * 10,
            confidenceScore: 40 + overlap * 10,
            attribution,
            metadata: {
              wikipedia_link: link,
              extraction: "see_also",
              match_overlap: overlap,
            },
          });
        }
      }
    }

    return this.validate(candidates);
  }

  private validate(candidates: RawCandidate[]): RawCandidate[] {
    return candidates.filter((c) => {
      if (c.title.length < 5 || c.title.length > 200) return false;
      if (!c.attribution) return false;
      return true;
    });
  }
}
