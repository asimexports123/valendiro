/**
 * Discovery Adapter Interface
 *
 * Each adapter extracts knowledge candidates for a topic's empty hub slots.
 * Adapters are coverage-driven: input = empty slots, output = candidates.
 *
 * Adapter Lifecycle:
 *   Fetch → Extract → Normalize → Validate → Emit Candidates
 *
 * Every adapter must implement DiscoveryAdapter and follow this lifecycle.
 * The framework is frozen — adapters adapt to the framework.
 */

export interface SlotInfo {
  id: string;
  slug: string;
  title: string;
  description: string;
  sectionSlug: string;
  sectionName: string;
}

export interface SourceAttribution {
  sourceName: string;
  sourceUrl: string | null;
  adapterName: string;
  extractionMethod: string;
  discoveredAt: string;
}

export interface RawCandidate {
  slotId: string;
  title: string;
  description: string;
  sourceUrl: string | null;
  relevanceScore: number;
  confidenceScore: number;
  attribution?: SourceAttribution;
  metadata?: Record<string, unknown>;
}

export interface DiscoveryAdapter {
  readonly adapterType: string;
  extract(topicSlug: string, topicTitle: string, emptySlots: SlotInfo[]): Promise<RawCandidate[]>;
}

// ─── Static Mock Adapter ──────────────────────────────────────────────
// Generates deterministic candidates based on slot metadata.
// No external API calls. Used to validate the framework end-to-end.

export class StaticMockAdapter implements DiscoveryAdapter {
  readonly adapterType = "static";

  async extract(topicSlug: string, topicTitle: string, emptySlots: SlotInfo[]): Promise<RawCandidate[]> {
    const candidates: RawCandidate[] = [];

    for (const slot of emptySlots) {
      // Generate 1-2 candidates per empty slot
      candidates.push({
        slotId: slot.id,
        title: `${topicTitle}: ${slot.title}`,
        description: `Comprehensive guide covering ${slot.title.toLowerCase()} for ${topicTitle}. ${slot.description}`,
        sourceUrl: null,
        relevanceScore: 75 + Math.round(Math.random() * 20),
        confidenceScore: 70 + Math.round(Math.random() * 25),
        metadata: { source: "static_mock", slot_slug: slot.slug, section: slot.sectionSlug },
      });

      // Second candidate with lower scores (tests scoring/ranking)
      if (slot.description.length > 20) {
        candidates.push({
          slotId: slot.id,
          title: `Understanding ${slot.title} in ${topicTitle}`,
          description: `Alternative perspective on ${slot.title.toLowerCase()}.`,
          sourceUrl: null,
          relevanceScore: 50 + Math.round(Math.random() * 20),
          confidenceScore: 45 + Math.round(Math.random() * 20),
          metadata: { source: "static_mock", variant: "alternative", slot_slug: slot.slug },
        });
      }
    }

    return candidates;
  }
}
