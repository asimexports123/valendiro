import { SitemapStream, streamToPromise } from "sitemap";
import { Readable } from "stream";
import { buildUrl } from "@/lib/utils/helpers";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

export interface SitemapUrl {
  url: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  lastmod?: string;
  links?: { lang: string; url: string }[];
}

export async function generateSitemap(urls: SitemapUrl[]): Promise<string> {
  const stream = new SitemapStream({ hostname: buildUrl("") });
  const data = urls.map((u) => ({
    url: u.url,
    changefreq: u.changefreq,
    priority: u.priority,
    lastmod: u.lastmod,
    links: u.links,
  }));

  return streamToPromise(Readable.from(data).pipe(stream)).then((buffer: Buffer) =>
    buffer.toString()
  );
}

export function buildHreflangLinks(path: string): { lang: string; url: string }[] {
  return SUPPORTED_LANGUAGES.map((lang) => ({
    lang,
    url: buildUrl(`/${lang}${path}`),
  }));
}
