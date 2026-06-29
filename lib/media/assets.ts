export type MediaType = "category" | "topic" | "article" | "collection" | "guide";

const categoryColors: Record<string, string> = {
  technology: "3b82f6",
  ai: "6366f1",
  finance: "10b981",
  health: "ef4444",
  home: "f59e0b",
  education: "8b5cf6",
  travel: "06b6d4",
  business: "64748b",
  science: "14b8a6",
  programming: "f97316",
  lifestyle: "ec4899",
};

function slugToColor(slug: string): string {
  const key = slug.toLowerCase().split("-")[0];
  return categoryColors[key] || "6366f1";
}

function mediaText(type: MediaType, slug: string, name?: string): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return `${type.slice(0, 2).toUpperCase()}${slug.slice(0, 2).toUpperCase()}`;
}

export interface MediaUrlOptions {
  type: MediaType;
  slug: string;
  name?: string;
  width?: number;
  height?: number;
}

export function getMediaUrl(options: MediaUrlOptions): string {
  const { type, slug, name, width = 800, height = 600 } = options;

  const color = slugToColor(slug);
  const text = mediaText(type, slug, name);

  return `https://placehold.co/${width}x${height}/${color}/ffffff?text=${encodeURIComponent(text)}`;
}

export function getMediaUrls(slugs: { type: MediaType; slug: string; name?: string }[]): string[] {
  return slugs.map((s) => getMediaUrl(s));
}

export function getMediaAlt(type: MediaType, name?: string): string {
  if (name) return `${name} ${type} image`;
  return `${type} image`;
}

export function getMediaSource(): "placeholder" | string {
  return process.env.NEXT_PUBLIC_MEDIA_SOURCE || "placeholder";
}
