export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Valendiro";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const DEFAULT_LANGUAGE = process.env.NEXT_PUBLIC_SITE_DEFAULT_LANGUAGE || "en";
export const SUPPORTED_LANGUAGES = ["en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const APP_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  USER: "user",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export const ADMIN_NAV_ITEMS = [
  { label: "Overview", href: "/admin/dashboard" },
  { label: "Demand Intelligence", href: "/admin/demand-intelligence" },
  { label: "Category Config", href: "/admin/categories" },
  { label: "Content Performance", href: "/admin/performance" },
  { label: "SEO Insights", href: "/admin/seo-insights" },
  { label: "Affiliate Revenue", href: "/admin/affiliate-revenue" },
  { label: "Queue Monitor", href: "/admin/queue-monitor" },
  { label: "System Logs", href: "/admin/system-logs" },
  { label: "Knowledge", href: "/admin/knowledge" },
  { label: "Topics", href: "/admin/topics" },
  { label: "Questions", href: "/admin/questions" },
  { label: "Entities", href: "/admin/entities" },
  { label: "Articles", href: "/admin/articles" },
  { label: "Publishing", href: "/admin/publishing" },
  { label: "SEO", href: "/admin/seo" },
  { label: "Translation", href: "/admin/translation" },
  { label: "Affiliate", href: "/admin/affiliate" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "CMS", href: "/admin/cms" },
  { label: "Auth", href: "/admin/auth" },
  { label: "Jobs", href: "/admin/jobs" },
  { label: "Settings", href: "/admin/settings" },
];

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

// Feature flags: traffic-first, monetization disabled by default
export const ENABLE_AFFILIATE = process.env.ENABLE_AFFILIATE === "true";
export const ENABLE_ADSENSE = process.env.ENABLE_ADSENSE === "true";
export const ENABLE_DEMAND_DISCOVERY = process.env.ENABLE_DEMAND_DISCOVERY !== "false";
