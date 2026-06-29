import {
  Topic,
  Question,
  Entity,
  KnowledgeObject,
  Article,
  SeoMetadata,
  UpdateQueue,
  SupportedLanguage,
} from "@/lib/types";

export type { Topic, Question, Entity, KnowledgeObject, Article, SeoMetadata, UpdateQueue };
export type { SupportedLanguage };

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
  status?: "draft" | "review" | "published" | "archived";
  language?: SupportedLanguage;
  search?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}
