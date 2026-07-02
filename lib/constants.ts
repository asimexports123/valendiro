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

// Owner-facing nav — what the platform owner sees by default
export const ADMIN_NAV_ITEMS = [
  { label: "🏠  Dashboard",      href: "/admin/dashboard" },
  { label: "📝  Articles",       href: "/admin/articles" },
  { label: "🧬  Entity Types",   href: "/admin/entity-types" },
  { label: "🧩  Knowledge Hubs", href: "/admin/hubs" },
  { label: "⚙️  Settings",       href: "/admin/settings" },
];

// Developer-mode nav — hidden by default, shown when ?dev=1 is in URL
export const ADMIN_DEV_NAV_ITEMS = [
  { label: "�  Categories",        href: "/admin/categories" },
  { label: "📂  Subcategories",      href: "/admin/subcategories" },
  { label: "�  Topics",            href: "/admin/topics" },
  { label: "🔍  Keyword Research",  href: "/admin/demand-intelligence" },
  { label: "🚀  Publishing",        href: "/admin/publishing" },
  { label: "🖼️  Media",             href: "/admin/media" },
  { label: "📋  Queue Monitor",     href: "/admin/queue-monitor" },
  { label: "🪵  System Logs",       href: "/admin/system-logs" },
];

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

// Feature flags: traffic-first, monetization disabled by default
export const ENABLE_AFFILIATE = process.env.ENABLE_AFFILIATE === "true";
export const ENABLE_ADSENSE = process.env.ENABLE_ADSENSE === "true";
export const ENABLE_DEMAND_DISCOVERY = process.env.ENABLE_DEMAND_DISCOVERY !== "false";
