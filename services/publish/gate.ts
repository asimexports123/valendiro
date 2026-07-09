/**
 * Publication Gate — validates rendered output before canonical publish.
 */

import { PublicationValidation } from "@/services/publication/publicationValidation";
import type { RenderedOutput, Topic } from "@/services/publication/publicationPipeline";
import type { ValidationResult } from "@/services/publication/publicationValidation";

const validator = new PublicationValidation({
  qualityThreshold: 0.6,
  requiredRendererVersion: "1.0.0",
  allowedOutputFormats: ["markdown"],
  minWordCount: 100,
  minSectionCount: 2,
});

export function validateForPublication(
  renderedOutput: RenderedOutput,
  topic: Topic | null,
  targetLanguage = "en"
): ValidationResult {
  return validator.validate(renderedOutput, topic, targetLanguage);
}
