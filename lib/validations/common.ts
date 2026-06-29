import { z } from "zod";
import { SUPPORTED_LANGUAGES, APP_ROLES } from "@/lib/constants";

export const uuidSchema = z.string().uuid();

export const languageSchema = z.enum(SUPPORTED_LANGUAGES as unknown as [string, ...string[]]);

export const roleSchema = z.enum(Object.values(APP_ROLES) as unknown as [string, ...string[]]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only");

export const seoMetadataSchema = z.object({
  meta_title: z.string().max(70).nullable().optional(),
  meta_description: z.string().max(160).nullable().optional(),
  canonical_url: z.string().url().nullable().optional(),
  og_title: z.string().max(70).nullable().optional(),
  og_description: z.string().max(200).nullable().optional(),
  og_image_url: z.string().url().nullable().optional(),
  twitter_card: z.enum(["summary", "summary_large_image"]).nullable().optional(),
  noindex: z.boolean().default(false),
  nofollow: z.boolean().default(false),
  structured_data: z.record(z.string(), z.unknown()).nullable().optional(),
});
