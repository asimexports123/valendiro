/**
 * Phase 33.4: Enrichment Queue
 * 
 * Manages enrichment queue with state management:
 * - READY
 * - ENRICHMENT_REQUIRED
 * - ACQUISITION_REQUIRED
 * - VALIDATED
 * - PUBLISHED
 */

export type PackageState = "READY" | "ENRICHMENT_REQUIRED" | "ACQUISITION_REQUIRED" | "VALIDATED" | "PUBLISHED";

export interface QueueItem {
  packageId: string;
  slug: string;
  category: string;
  priority: number; // 1-10, 1 is highest
  state: PackageState;
  lastUpdated: string;
  qualityScore?: number;
  coverageScore?: number;
  completenessScore?: number;
  authorityScore?: number;
  freshnessScore?: number;
  error?: string;
}

export interface EnrichmentQueue {
  items: QueueItem[];
  add(item: QueueItem): void;
  updateState(packageId: string, newState: PackageState): void;
  getByState(state: PackageState): QueueItem[];
  getNextByPriority(): QueueItem | null;
  remove(packageId: string): void;
}

export class InMemoryEnrichmentQueue implements EnrichmentQueue {
  items: QueueItem[] = [];

  add(item: QueueItem): void {
    this.items.push(item);
  }

  updateState(packageId: string, newState: PackageState): void {
    const item = this.items.find(i => i.packageId === packageId);
    if (item) {
      item.state = newState;
      item.lastUpdated = new Date().toISOString();
    }
  }

  getByState(state: PackageState): QueueItem[] {
    return this.items.filter(i => i.state === state);
  }

  getNextByPriority(): QueueItem | null {
    const readyItems = this.items.filter(i => i.state === "READY" || i.state === "ENRICHMENT_REQUIRED");
    if (readyItems.length === 0) return null;
    
    readyItems.sort((a, b) => a.priority - b.priority);
    return readyItems[0];
  }

  remove(packageId: string): void {
    this.items = this.items.filter(i => i.packageId !== packageId);
  }
}
