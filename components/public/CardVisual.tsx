/**
 * CardVisual — deterministic SVG thumbnail for every category/topic/article card.
 * Zero external requests. Pure inline SVG. Renders instantly.
 * Each category has its own palette + icon motif.
 * Topics/articles derive a subtle pattern from a hash of their title.
 */

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_CONFIG: Record<string, {
  bg: string; accent: string; fg: string; icon: string; shapes: string;
}> = {
  technology: {
    bg: "#EFF6FF", accent: "#3B82F6", fg: "#BFDBFE",
    icon: "💻",
    shapes: `<circle cx="56" cy="40" r="22" fill="#BFDBFE" opacity=".6"/>
             <rect x="20" y="52" width="40" height="3" rx="1.5" fill="#93C5FD" opacity=".5"/>
             <rect x="20" y="59" width="28" height="3" rx="1.5" fill="#93C5FD" opacity=".4"/>
             <circle cx="92" cy="24" r="10" fill="#3B82F6" opacity=".12"/>`,
  },
  "personal-finance": {
    bg: "#ECFDF5", accent: "#10B981", fg: "#A7F3D0",
    icon: "💰",
    shapes: `<circle cx="60" cy="38" r="20" fill="#A7F3D0" opacity=".55"/>
             <rect x="18" y="54" width="36" height="3" rx="1.5" fill="#6EE7B7" opacity=".5"/>
             <rect x="18" y="61" width="22" height="3" rx="1.5" fill="#6EE7B7" opacity=".4"/>
             <circle cx="90" cy="20" r="12" fill="#10B981" opacity=".1"/>`,
  },
  business: {
    bg: "#F5F3FF", accent: "#8B5CF6", fg: "#DDD6FE",
    icon: "🚀",
    shapes: `<circle cx="58" cy="36" r="22" fill="#DDD6FE" opacity=".55"/>
             <rect x="16" y="52" width="38" height="3" rx="1.5" fill="#C4B5FD" opacity=".5"/>
             <rect x="16" y="59" width="25" height="3" rx="1.5" fill="#C4B5FD" opacity=".4"/>
             <circle cx="88" cy="22" r="11" fill="#8B5CF6" opacity=".1"/>`,
  },
  education: {
    bg: "#FFFBEB", accent: "#F59E0B", fg: "#FDE68A",
    icon: "🎓",
    shapes: `<circle cx="57" cy="37" r="21" fill="#FDE68A" opacity=".55"/>
             <rect x="17" y="52" width="37" height="3" rx="1.5" fill="#FCD34D" opacity=".5"/>
             <rect x="17" y="59" width="24" height="3" rx="1.5" fill="#FCD34D" opacity=".4"/>
             <circle cx="89" cy="21" r="11" fill="#F59E0B" opacity=".1"/>`,
  },
  "health-wellness": {
    bg: "#FFF1F2", accent: "#F43F5E", fg: "#FECDD3",
    icon: "🌿",
    shapes: `<circle cx="59" cy="39" r="20" fill="#FECDD3" opacity=".55"/>
             <rect x="19" y="54" width="35" height="3" rx="1.5" fill="#FDA4AF" opacity=".5"/>
             <rect x="19" y="61" width="22" height="3" rx="1.5" fill="#FDA4AF" opacity=".4"/>
             <circle cx="91" cy="23" r="12" fill="#F43F5E" opacity=".1"/>`,
  },
  "home-lifestyle": {
    bg: "#FFF7ED", accent: "#F97316", fg: "#FED7AA",
    icon: "🏠",
    shapes: `<circle cx="58" cy="38" r="21" fill="#FED7AA" opacity=".55"/>
             <rect x="16" y="53" width="36" height="3" rx="1.5" fill="#FDBA74" opacity=".5"/>
             <rect x="16" y="60" width="23" height="3" rx="1.5" fill="#FDBA74" opacity=".4"/>
             <circle cx="90" cy="22" r="11" fill="#F97316" opacity=".1"/>`,
  },
  travel: {
    bg: "#F0F9FF", accent: "#0EA5E9", fg: "#BAE6FD",
    icon: "✈️",
    shapes: `<circle cx="60" cy="38" r="21" fill="#BAE6FD" opacity=".55"/>
             <rect x="18" y="53" width="36" height="3" rx="1.5" fill="#7DD3FC" opacity=".5"/>
             <rect x="18" y="60" width="24" height="3" rx="1.5" fill="#7DD3FC" opacity=".4"/>
             <circle cx="91" cy="22" r="12" fill="#0EA5E9" opacity=".1"/>`,
  },
};

const DEFAULT_CAT = {
  bg: "#F8FAFC", accent: "#64748B", fg: "#CBD5E1",
  icon: "📖",
  shapes: `<circle cx="58" cy="38" r="20" fill="#CBD5E1" opacity=".5"/>
           <rect x="18" y="53" width="34" height="3" rx="1.5" fill="#94A3B8" opacity=".45"/>
           <rect x="18" y="60" width="22" height="3" rx="1.5" fill="#94A3B8" opacity=".35"/>`,
};

// ─── Simple hash to pick a pattern variant (0–3) ─────────────────────────────

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// ─── Components ───────────────────────────────────────────────────────────────

/**
 * A 16:9 illustrated thumbnail for a topic or article card.
 * categorySlug drives the palette; title drives a subtle noise variant.
 */
export function CardThumbnail({
  categorySlug,
  title,
  className = "",
}: {
  categorySlug: string | null;
  title: string;
  className?: string;
}) {
  const cfg = CAT_CONFIG[categorySlug ?? ""] ?? DEFAULT_CAT;
  const v = hashStr(title) % 4;

  // Subtle scatter dots unique to each card
  const dots = Array.from({ length: 6 }, (_, i) => {
    const h = hashStr(title + i);
    const cx = 10 + (h % 90);
    const cy = 6 + ((h >> 8) % 58);
    const r = 1.5 + (h % 3);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${cfg.accent}" opacity="${0.06 + (i % 3) * 0.03}"/>`;
  }).join("");

  // Variant diagonal stripe or arc
  const variant = [
    `<line x1="0" y1="72" x2="112" y2="0" stroke="${cfg.accent}" stroke-width="18" opacity=".04"/>`,
    `<circle cx="0" cy="72" r="55" fill="none" stroke="${cfg.accent}" stroke-width="14" opacity=".05"/>`,
    `<rect x="78" y="-10" width="50" height="92" rx="8" fill="${cfg.accent}" opacity=".04" transform="rotate(15 78 36)"/>`,
    `<circle cx="112" cy="72" r="50" fill="${cfg.accent}" opacity=".05"/>`,
  ][v];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 63" width="112" height="63">
    <rect width="112" height="63" fill="${cfg.bg}"/>
    ${variant}
    ${cfg.shapes}
    ${dots}
    <text x="14" y="44" font-size="22" font-family="system-ui,sans-serif">${cfg.icon}</text>
  </svg>`;

  return (
    <div
      className={`w-full aspect-video rounded-xl overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
        alt=""
        width={112}
        height={63}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

/**
 * A compact square icon for collection cards.
 */
export function CollectionIcon({
  categorySlug,
  name,
  size = 48,
}: {
  categorySlug: string | null;
  name: string;
  size?: number;
}) {
  const cfg = CAT_CONFIG[categorySlug ?? ""] ?? DEFAULT_CAT;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <rect width="48" height="48" rx="10" fill="${cfg.bg}"/>
    <circle cx="24" cy="21" r="13" fill="${cfg.fg}" opacity=".7"/>
    <text x="24" y="27" font-size="16" text-anchor="middle" font-family="system-ui,sans-serif">${cfg.icon}</text>
  </svg>`;

  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 rounded-xl overflow-hidden"
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

/**
 * Category badge pill.
 */
const CAT_BADGE: Record<string, { label: string; cls: string }> = {
  technology:        { label: "Technology",       cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  "personal-finance":{ label: "Personal Finance", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  business:          { label: "Business",         cls: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  education:         { label: "Education",        cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  "health-wellness": { label: "Health & Wellness",cls: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
  "home-lifestyle":  { label: "Home & Lifestyle", cls: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
  travel:            { label: "Travel",           cls: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
};

export function CategoryBadge({ slug }: { slug: string | null }) {
  if (!slug) return null;
  const b = CAT_BADGE[slug];
  if (!b) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${b.cls}`}>
      {b.label}
    </span>
  );
}
