/**
 * Render Engine — canonical offline rendering facade.
 *
 * Routes all rendered_outputs persistence through services/render/writers.ts.
 */

import {
  render,
  type RenderRequest,
  type RenderResult,
} from "@/services/renderer/orchestrator";
import {
  storeRenderedOutput,
  markOutputsStaleByPackageId,
  markOutputPublished,
  persistAuthoringOutput,
  type StoreInput,
} from "./writers";

export type { RenderRequest, RenderResult, StoreInput };

export async function renderPackage(request: RenderRequest): Promise<RenderResult> {
  return render(request);
}

export async function persistRenderedOutput(input: StoreInput): Promise<string | null> {
  return storeRenderedOutput(input);
}

export async function markOutputsStale(packageId: string): Promise<number> {
  return markOutputsStaleByPackageId(packageId);
}

export { markOutputPublished, persistAuthoringOutput };
