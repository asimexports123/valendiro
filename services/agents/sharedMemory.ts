/**
 * Shared Memory System
 *
 * Every agent shares the same memory.
 * No isolated memories.
 *
 * Memory stores:
 * - Knowledge
 * - Decisions
 * - Context
 * - Previous executions
 * - Quality reports
 * - Production validation
 * - Analytics
 */

export interface MemoryEntry {
  id: string;
  type: "knowledge" | "decision" | "context" | "execution" | "quality" | "production" | "analytics";
  key: string;
  value: any;
  timestamp: Date;
  agentId: string | null;
  ttl?: number; // Time to live in milliseconds
}

export interface SharedMemoryConfig {
  maxSize: number;
  defaultTTL: number;
  persistToDatabase: boolean;
}

export class SharedMemory {
  private static instance: SharedMemory;
  private memory: Map<string, MemoryEntry> = new Map();
  private config: SharedMemoryConfig;

  private constructor(config?: Partial<SharedMemoryConfig>) {
    this.config = {
      maxSize: 10000,
      defaultTTL: 3600000, // 1 hour
      persistToDatabase: false,
      ...config,
    };

    // Start cleanup interval
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Every minute
  }

  static getInstance(config?: Partial<SharedMemoryConfig>): SharedMemory {
    if (!SharedMemory.instance) {
      SharedMemory.instance = new SharedMemory(config);
    }
    return SharedMemory.instance;
  }

  /**
   * Store a value in memory
   */
  set(
    type: MemoryEntry["type"],
    key: string,
    value: any,
    agentId: string | null = null,
    ttl?: number
  ): void {
    const entry: MemoryEntry = {
      id: `${type}:${key}:${Date.now()}`,
      type,
      key,
      value,
      timestamp: new Date(),
      agentId,
      ttl: ttl ?? this.config.defaultTTL,
    };

    // Remove old entry with same key
    this.remove(type, key);

    // Check size limit
    if (this.memory.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.memory.set(entry.id, entry);

    if (this.config.persistToDatabase) {
      this.persistToDatabase(entry);
    }
  }

  /**
   * Get a value from memory
   */
  get(type: MemoryEntry["type"], key: string): any | null {
    const entryId = this.findEntryId(type, key);
    if (!entryId) return null;

    const entry = this.memory.get(entryId);
    if (!entry) return null;

    // Check if expired
    if (this.isExpired(entry)) {
      this.memory.delete(entryId);
      return null;
    }

    return entry.value;
  }

  /**
   * Get all entries of a type
   */
  getByType(type: MemoryEntry["type"]): MemoryEntry[] {
    const entries: MemoryEntry[] = [];

    for (const entry of this.memory.values()) {
      if (entry.type === type && !this.isExpired(entry)) {
        entries.push(entry);
      }
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all entries from an agent
   */
  getByAgent(agentId: string): MemoryEntry[] {
    const entries: MemoryEntry[] = [];

    for (const entry of this.memory.values()) {
      if (entry.agentId === agentId && !this.isExpired(entry)) {
        entries.push(entry);
      }
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Remove an entry
   */
  remove(type: MemoryEntry["type"], key: string): boolean {
    const entryId = this.findEntryId(type, key);
    if (!entryId) return false;

    return this.memory.delete(entryId);
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.memory.clear();
  }

  /**
   * Clear memory by type
   */
  clearByType(type: MemoryEntry["type"]): number {
    let count = 0;

    for (const [id, entry] of this.memory.entries()) {
      if (entry.type === type) {
        this.memory.delete(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Get memory statistics
   */
  getStatistics(): {
    totalEntries: number;
    byType: Record<string, number>;
    byAgent: Record<string, number>;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const byType: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    let oldest: Date | null = null;
    let newest: Date | null = null;

    for (const entry of this.memory.values()) {
      if (this.isExpired(entry)) continue;

      byType[entry.type] = (byType[entry.type] || 0) + 1;

      if (entry.agentId) {
        byAgent[entry.agentId] = (byAgent[entry.agentId] || 0) + 1;
      }

      if (!oldest || entry.timestamp < oldest) oldest = entry.timestamp;
      if (!newest || entry.timestamp > newest) newest = entry.timestamp;
    }

    return {
      totalEntries: this.memory.size,
      byType,
      byAgent,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  /**
   * Find entry ID by type and key
   */
  private findEntryId(type: MemoryEntry["type"], key: string): string | null {
    for (const [id, entry] of this.memory.entries()) {
      if (entry.type === type && entry.key === key) {
        return id;
      }
    }
    return null;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: MemoryEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp.getTime() > entry.ttl;
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestId: string | null = null;
    let oldestTime: Date | null = null;

    for (const [id, entry] of this.memory.entries()) {
      if (!oldestTime || entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.memory.delete(oldestId);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpiredEntries(): void {
    let count = 0;

    for (const [id, entry] of this.memory.entries()) {
      if (this.isExpired(entry)) {
        this.memory.delete(id);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[Shared Memory] Cleaned up ${count} expired entries`);
    }
  }

  /**
   * Persist to database (placeholder)
   */
  private persistToDatabase(entry: MemoryEntry): void {
    // TODO: Implement database persistence
    // This would store the memory entry in a database table
    // for cross-instance persistence
  }

  /**
   * Convenience methods for common memory operations
   */
  setKnowledge(key: string, value: any, agentId?: string): void {
    this.set("knowledge", key, value, agentId ?? null);
  }

  getKnowledge(key: string): any {
    return this.get("knowledge", key);
  }

  setDecision(key: string, value: any, agentId?: string): void {
    this.set("decision", key, value, agentId ?? null);
  }

  getDecision(key: string): any {
    return this.get("decision", key);
  }

  setContext(key: string, value: any, agentId?: string): void {
    this.set("context", key, value, agentId ?? null);
  }

  getContext(key: string): any {
    return this.get("context", key);
  }

  setExecution(key: string, value: any, agentId?: string): void {
    this.set("execution", key, value, agentId ?? null);
  }

  getExecution(key: string): any {
    return this.get("execution", key);
  }

  setQuality(key: string, value: any, agentId?: string): void {
    this.set("quality", key, value, agentId ?? null);
  }

  getQuality(key: string): any {
    return this.get("quality", key);
  }
}
