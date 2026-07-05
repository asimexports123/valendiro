/**
 * Base Source Adapter Interface - Phase 30.3
 * 
 * Every external source must be isolated through an adapter.
 * Adapters convert external data into the canonical Knowledge Package format.
 * Adapters must remain source-specific while the rest of the system remains source-agnostic.
 */

import type { KnowledgePackage } from "../renderer/types";

export interface AdapterConfig {
  sourceType: "json" | "csv" | "rss" | "feedly" | "official-docs" | "api";
  adapterName: string;
  adapterVersion: string;
}

export interface AdapterResult {
  success: boolean;
  knowledgePackage: KnowledgePackage | null;
  error: string | null;
  warnings: string[];
}

/**
 * Base interface for all Source Adapters
 */
export interface SourceAdapter {
  /**
   * Convert external source data into canonical Knowledge Package format
   */
  adapt(sourceData: any, config: AdapterConfig): Promise<AdapterResult>;
  
  /**
   * Validate that the source data is compatible with this adapter
   */
  validateSource(sourceData: any): boolean;
  
  /**
   * Get the source type this adapter handles
   */
  getSourceType(): string;
}
