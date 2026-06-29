import Link from "next/link";
import { BreadcrumbItem } from "@/lib/types";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const schema = buildBreadcrumbSchema(items);

  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 && <span className="text-border">/</span>}
            {item.isCurrent ? (
              <span className="text-foreground font-medium" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-foreground transition">
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
