import Link from "next/link";
import { BreadcrumbItem } from "@/lib/types";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Article-style: smaller, muted text */
  size?: "sm" | "md";
  separator?: "slash" | "chevron";
}

export function Breadcrumbs({ items, size = "md", separator = "slash" }: BreadcrumbsProps) {
  const schema = buildBreadcrumbSchema(items);
  const textClass = size === "sm" ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground";

  return (
    <nav aria-label="Breadcrumb" className={size === "sm" ? "py-1" : "py-3"}>
      <ol className={`flex flex-wrap items-center gap-1.5 ${textClass}`}>
        {items.map((item, index) => (
          <li key={`${item.href}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-muted-foreground/50 select-none" aria-hidden>
                {separator === "chevron" ? "›" : "/"}
              </span>
            )}
            {item.isCurrent ? (
              <span className="text-muted-foreground font-normal truncate max-w-[16rem] sm:max-w-none" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </nav>
  );
}
